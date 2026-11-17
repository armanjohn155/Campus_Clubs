// CampusClubs API smoke test. Needs Node 18+.
// Usage:
//   API_URL=http://127.0.0.1:8000/api ADMIN_EMAIL=you@school.edu ADMIN_PASSWORD=... node scripts/smoke-test.mjs
// The admin from the seeder is president of every seeded club, so it doubles as the officer.

const API = process.env.API_URL ?? "http://127.0.0.1:8000/api";
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (the values from your .env SEED_ADMIN_*).");
  process.exit(2);
}

let passed = 0, failed = 0;
const ok = (name) => { passed++; console.log(`  PASS  ${name}`); };
const bad = (name, why) => { failed++; console.log(`  FAIL  ${name}\n        ${why}`); };

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

async function step(name, fn) {
  try { await fn(); ok(name); }
  catch (e) { bad(name, e.message); }
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
const expectStatus = (r, code) => expect(r.status === code, `expected ${code}, got ${r.status}: ${JSON.stringify(r.data)?.slice(0, 200)}`);

const rand = Math.floor(10000 + Math.random() * 89999);
const student = {
  student_id: `2099-${rand}`,
  full_name: "Smoke Test Student",
  email: `smoke${rand}@example.com`,
  password: "SmokeTest123",
  password_confirmation: "SmokeTest123",
};
let adminToken, studentToken, clubId, proposalClubId, membershipId, categoryId;

console.log(`Testing ${API}\n`);

await step("admin can log in", async () => {
  const r = await call("POST", "/login", { body: { identifier: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  expectStatus(r, 200);
  expect(r.data.user.role === "ADMIN", "user.role should be ADMIN");
  adminToken = r.data.token;
});

await step("wrong password is rejected with 422", async () => {
  const r = await call("POST", "/login", { body: { identifier: ADMIN_EMAIL, password: "definitely-wrong" } });
  expectStatus(r, 422);
});

await step("existing admin can request a password reset", async () => {
  const r = await call("POST", "/forgot-password", { body: { email: ADMIN_EMAIL } });
  expectStatus(r, 200);
  expect(typeof r.data.message === "string", "password reset response is missing its message");
});

await step("student can register", async () => {
  const r = await call("POST", "/register", { body: student });
  expectStatus(r, 201);
  expect(r.data.user.full_name === student.full_name, "full_name missing in user");
  studentToken = r.data.token;
});

await step("duplicate Student ID is rejected", async () => {
  const r = await call("POST", "/register", { body: { ...student, email: `other${rand}@example.com` } });
  expectStatus(r, 422);
});

await step("GET /me returns the flat user shape", async () => {
  const r = await call("GET", "/me", { token: studentToken });
  expectStatus(r, 200);
  for (const k of ["id", "student_id", "email", "role", "full_name", "course", "year_level", "skills"])
    expect(k in r.data, `missing field ${k}`);
});

await step("student can edit profile and skills", async () => {
  const r = await call("PUT", "/profile", { token: studentToken, body: {
    full_name: student.full_name, email: student.email, phone: "+63 912 345 6789",
    address: "Test Street", course: "BSIT", year_level: 2, section: "B", skills: ["Coding", "Teamwork"],
  } });
  expectStatus(r, 200);
  expect(r.data.skills.includes("Coding"), "skills were not saved");
});

await step("categories and clubs load, with the expected club shape", async () => {
  const categoryResponse = await call("GET", "/categories", { token: studentToken });
  expectStatus(categoryResponse, 200);
  const categories = categoryResponse.data.data ?? categoryResponse.data;
  expect(categories.length > 0, "no categories found: did the seeder run?");
  categoryId = categories[0].id;
  const r = await call("GET", "/clubs", { token: studentToken });
  expectStatus(r, 200);
  const clubs = r.data.data ?? r.data;
  expect(clubs.length > 0, "no clubs found: did the seeder run with SEED_ADMIN_* set?");
  for (const k of ["id", "name", "category", "tags", "member_count", "my_membership", "is_accepting_members"])
    expect(k in clubs[0], `club is missing ${k}`);
  clubId = clubs[0].id;
});

await step("student can propose a club with a pending status", async () => {
  const r = await call("POST", "/clubs", { token: studentToken, body: {
    name: `Smoke Club ${rand}`, category_id: categoryId,
    description: "A club created by the CampusClubs API smoke test.",
    adviser_name: "Smoke Test Adviser", meeting_schedule: "Fridays at 3 PM",
    contact_email: `club${rand}@example.com`, tags: ["Smoke Testing", "Community"],
  } });
  expectStatus(r, 201);
  const proposal = r.data.data ?? r.data;
  expect(proposal.status === "pending", "club proposal should await admin approval");
  expect(proposal.my_membership?.status === "approved" && proposal.my_membership.role === "president", "proposer should be approved president");
  proposalClubId = proposal.id;
  const mine = await call("GET", "/my-clubs", { token: studentToken });
  expectStatus(mine, 200);
  const clubs = mine.data.data ?? mine.data;
  expect(clubs.some((club) => club.id === proposalClubId && club.status === "pending"), "pending proposal missing from My Clubs");
});

await step("admin can approve a student proposal", async () => {
  const r = await call("PATCH", `/admin/clubs/${proposalClubId}/status`, { token: adminToken, body: { status: "active" } });
  expectStatus(r, 200);
  expect(r.data.status === "active", "club was not activated");
});

await step("proposer can edit settings as the club president", async () => {
  const r = await call("PUT", `/clubs/${proposalClubId}`, { token: studentToken, body: {
    description: "Updated by the smoke-test president.", adviser_name: "Updated Adviser",
    meeting_schedule: "Mondays at 4 PM", contact_email: `updated${rand}@example.com`,
    is_accepting_members: false, tags: ["Updated", "Smoke"],
  } });
  expectStatus(r, 200);
  const club = r.data.data ?? r.data;
  expect(club.description === "Updated by the smoke-test president.", "club description was not updated");
  expect(club.is_accepting_members === false, "accepting-members setting was not updated");
  expect(club.tags.includes("Updated"), "club tags were not updated");
});

await step("student can request to join", async () => {
  expectStatus(await call("POST", `/clubs/${clubId}/join`, { token: studentToken, body: { message: "Hello" } }), 201);
});

await step("second join request is blocked", async () => {
  expectStatus(await call("POST", `/clubs/${clubId}/join`, { token: studentToken, body: {} }), 422);
});

await step("student cannot see the club's requests (403)", async () => {
  expectStatus(await call("GET", `/clubs/${clubId}/requests`, { token: studentToken }), 403);
});

await step("officer sees the pending request", async () => {
  const r = await call("GET", `/clubs/${clubId}/requests`, { token: adminToken });
  expectStatus(r, 200);
  const list = r.data.data ?? r.data;
  const mine = list.find((m) => m.user.student_id === student.student_id);
  expect(mine, "request from the test student not found");
  membershipId = mine.id;
});

await step("officer received a notification", async () => {
  const r = await call("GET", "/notifications", { token: adminToken });
  expectStatus(r, 200);
  expect(r.data.unread_count > 0, "no unread notification for the officer");
});

await step("officer approves the request", async () => {
  expectStatus(await call("PATCH", `/memberships/${membershipId}`, { token: adminToken, body: { status: "approved" } }), 200);
});

await step("student sees the club in My Clubs and is notified", async () => {
  const mc = await call("GET", "/my-clubs", { token: studentToken });
  expectStatus(mc, 200);
  const list = mc.data.data ?? mc.data;
  expect(list.some((c) => c.id === clubId && c.my_membership?.status === "approved"), "club not approved in my-clubs");
  const n = await call("GET", "/notifications", { token: studentToken });
  expect(n.data.unread_count > 0, "student has no notification about the decision");
});

await step("officer posts an announcement, member sees it", async () => {
  const p = await call("POST", `/clubs/${clubId}/announcements`, { token: adminToken, body: { title: "Smoke test", body: "Hello members" } });
  expectStatus(p, 201);
  const f = await call("GET", "/announcements", { token: studentToken });
  expectStatus(f, 200);
  expect(f.data.some((a) => a.title === "Smoke test"), "announcement missing from the student feed");
});

await step("student cannot post announcements (403)", async () => {
  expectStatus(await call("POST", `/clubs/${clubId}/announcements`, { token: studentToken, body: { title: "x", body: "y" } }), 403);
});

await step("student cannot use admin routes (403)", async () => {
  expectStatus(await call("GET", "/admin/reports", { token: studentToken }), 403);
});

await step("admin reports load", async () => {
  const r = await call("GET", "/admin/reports", { token: adminToken });
  expectStatus(r, 200);
  expect(r.data.totals && "students" in r.data.totals, "reports.totals missing");
});

await step("student can leave the club", async () => {
  expectStatus(await call("DELETE", `/clubs/${clubId}/leave`, { token: studentToken }), 204);
});

await step("logout revokes the token", async () => {
  expectStatus(await call("POST", "/logout", { token: studentToken }), 204);
  expectStatus(await call("GET", "/me", { token: studentToken }), 401);
});

console.log(`\n${passed} passed, ${failed} failed`);
console.log("Test data left behind: one smoke-test student, one proposed club, and an announcement on a seeded club.");
process.exit(failed ? 1 : 0);
