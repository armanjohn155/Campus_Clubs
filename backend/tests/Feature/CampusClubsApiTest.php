<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Club;
use App\Models\Membership;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class CampusClubsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_and_login_return_token_and_user_shapes(): void
    {
        $payload = [
            'student_id' => '2026-12345',
            'full_name' => 'Alex Student',
            'email' => 'alex@example.test',
            'password' => 'CampusTest123',
            'password_confirmation' => 'CampusTest123',
        ];

        $this->postJson('/api/register', $payload)
            ->assertCreated()
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'student_id', 'email', 'role', 'full_name', 'course', 'year_level', 'skills'],
            ])
            ->assertJsonPath('user.full_name', 'Alex Student');

        $this->postJson('/api/login', ['identifier' => $payload['email'], 'password' => $payload['password']])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'student_id', 'email', 'role', 'full_name']]);
    }

    public function test_wrong_credentials_return_422(): void
    {
        $user = User::factory()->create(['email' => 'alex@example.test']);

        $this->postJson('/api/login', ['identifier' => $user->email, 'password' => 'wrong-password'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('identifier');
    }

    public function test_password_reset_email_links_to_frontend_and_updates_password(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'reset@example.test']);

        $this->postJson('/api/forgot-password', ['email' => $user->email])
            ->assertOk()
            ->assertJsonPath('message', 'If that email has an account, a reset link is on its way.');

        Notification::assertSentTo($user, ResetPassword::class);
        $notification = Notification::sent($user, ResetPassword::class)->first();
        $this->assertInstanceOf(ResetPassword::class, $notification);
        $url = $notification->toMail($user)->actionUrl;
        $this->assertStringStartsWith('http://localhost:5173/auth/reset-password?', $url);
        parse_str((string) parse_url($url, PHP_URL_QUERY), $query);
        $this->assertSame($user->email, $query['email'] ?? null);
        $this->assertNotEmpty($query['token'] ?? null);

        $this->postJson('/api/reset-password', [
            'token' => $query['token'],
            'email' => $user->email,
            'password' => 'NewCampusPass123',
            'password_confirmation' => 'NewCampusPass123',
        ])->assertOk();

        $this->postJson('/api/login', ['identifier' => $user->email, 'password' => 'NewCampusPass123'])
            ->assertOk();
    }

    public function test_student_proposal_is_pending_and_makes_proposer_approved_president(): void
    {
        $student = $this->createStudent();
        $category = Category::factory()->create();
        Sanctum::actingAs($student);

        $this->postJson('/api/clubs', [
            'name' => 'Student Robotics Guild',
            'category_id' => $category->id,
            'description' => 'A student-led robotics community.',
            'adviser_name' => 'Dr. Example',
            'meeting_schedule' => 'Fridays at 3 PM',
            'contact_email' => 'robotics@example.test',
            'tags' => ['Robotics', 'Design'],
        ])->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.my_membership.status', 'approved')
            ->assertJsonPath('data.my_membership.role', 'president');

        $club = Club::query()->where('name', 'Student Robotics Guild')->firstOrFail();
        $this->assertDatabaseHas('clubs', [
            'id' => $club->id,
            'status' => 'pending',
            'created_by' => $student->id,
            'category_id' => $category->id,
        ]);
        $this->assertDatabaseHas('memberships', [
            'club_id' => $club->id,
            'user_id' => $student->id,
            'role' => 'president',
            'status' => 'approved',
        ]);
    }

    public function test_non_officer_cannot_update_club_settings(): void
    {
        $student = $this->createStudent();
        $club = $this->createClub();
        Sanctum::actingAs($student);

        $this->putJson("/api/clubs/{$club->id}", [
            'description' => 'Unauthorized edit',
            'is_accepting_members' => false,
        ])->assertForbidden();

        $this->assertDatabaseMissing('clubs', [
            'id' => $club->id,
            'description' => 'Unauthorized edit',
        ]);
    }

    public function test_second_pending_join_request_returns_422(): void
    {
        $student = $this->createStudent();
        $club = $this->createClub();
        Sanctum::actingAs($student);

        $this->postJson("/api/clubs/{$club->id}/join", ['message' => 'Please let me join.'])->assertCreated();

        $this->postJson("/api/clubs/{$club->id}/join")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'You already have a pending request for this club.');

        $this->assertDatabaseCount('memberships', 1);
    }

    public function test_rejected_student_cannot_reapply_within_seven_days(): void
    {
        $this->travelTo(now());
        $student = $this->createStudent();
        $club = $this->createClub();
        Membership::create([
            'user_id' => $student->id,
            'club_id' => $club->id,
            'role' => 'member',
            'status' => 'rejected',
            'requested_at' => now()->subDays(7),
            'decided_at' => now()->subDays(6),
        ]);
        Sanctum::actingAs($student);

        $this->postJson("/api/clubs/{$club->id}/join")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'You can reapply on '.now()->addDay()->format('M j, Y').'.');
    }

    public function test_last_president_cannot_leave_a_club(): void
    {
        $president = $this->createStudent();
        $club = $this->createClub();
        Membership::create([
            'user_id' => $president->id,
            'club_id' => $club->id,
            'role' => 'president',
            'status' => 'approved',
            'decided_at' => now(),
            'decided_by' => $president->id,
        ]);
        Sanctum::actingAs($president);

        $this->deleteJson("/api/clubs/{$club->id}/leave")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Assign another president before leaving this club.');

        $this->assertDatabaseHas('memberships', [
            'user_id' => $president->id,
            'club_id' => $club->id,
            'status' => 'approved',
            'role' => 'president',
        ]);
    }

    public function test_plain_member_cannot_view_club_requests(): void
    {
        $member = $this->createStudent();
        $club = $this->createClub();
        Membership::create([
            'user_id' => $member->id,
            'club_id' => $club->id,
            'role' => 'member',
            'status' => 'approved',
        ]);
        Sanctum::actingAs($member);

        $this->getJson("/api/clubs/{$club->id}/requests")->assertForbidden();
    }

    public function test_non_admin_cannot_view_admin_reports(): void
    {
        Sanctum::actingAs($this->createStudent());

        $this->getJson('/api/admin/reports')->assertForbidden();
    }

    private function createStudent(): User
    {
        $student = User::factory()->create(['role' => 'USER']);
        Profile::create(['user_id' => $student->id, 'full_name' => $student->name]);

        return $student;
    }

    private function createClub(): Club
    {
        return Club::factory()->for(Category::factory())->create(['status' => 'active']);
    }
}
