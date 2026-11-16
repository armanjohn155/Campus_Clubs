# CampusClubs API: setup

Drop-in files for a fresh Laravel 11/12 project. Paths mirror the project root.

```bash
composer create-project laravel/laravel campusclubs-api
cd campusclubs-api
php artisan install:api            # Sanctum + routes/api.php
# copy this folder's app/, database/, routes/ over the project (overwrite when asked)
```

## .env

```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=campusclubs
DB_USERNAME=postgres
DB_PASSWORD=your_password

SESSION_DRIVER=file
APP_URL=http://localhost:8000

SEED_ADMIN_EMAIL=you@school.edu
SEED_ADMIN_PASSWORD=choose-a-strong-one1
SEED_ADMIN_NAME="Your Name"

# Needed only for password-reset emails (use MAIL_MAILER=log while developing)
MAIL_MAILER=log
```

```bash
createdb campusclubs
php artisan migrate --seed
php artisan storage:link           # serves profile photos
php artisan serve                  # http://localhost:8000
```

Frontend `.env`: `VITE_API_URL=http://localhost:8000/api`

## Business rules enforced in the API

- One membership row per student and club. Pending or approved requests block a new one.
- A rejected student can reapply after 7 days.
- A club's last president cannot leave or be demoted.
- Only active clubs that are accepting members can be joined.
- Only officers of that club (or admins) can see requests and rosters, approve, remove, and post announcements.
- Student proposals start as `pending`; the proposer becomes president and the admin is notified.
- Notifications are created for join requests, decisions, role changes, announcements, and club approvals.

## Where each placeholder in the UI comes from now

| UI element | Endpoint |
|---|---|
| Signed-in name, course, photo, sidebar footer | `GET /me` |
| Club cards, tags, member counts, Member / Request sent / Join club state | `GET /clubs` (`tags`, `member_count`, `my_membership`) |
| Category tabs | `GET /categories` |
| Search box, Sort by (recommended, popular, name) | `GET /clubs?search=&category=&sort=` |
| My clubs | `GET /my-clubs` |
| Announcements page and home feed | `GET /announcements` |
| Bell and unread dot | `GET /notifications` (`unread_count`) |
| Join club / Cancel request / Leave | `POST` / `DELETE /clubs/{id}/join`, `DELETE /clubs/{id}/leave` |
| Edit profile, photo | `PUT /profile`, `POST /profile/photo` |
| Admin tables and reports | `GET /clubs`, `PATCH /admin/clubs/{id}/status`, `GET /admin/reports`, `GET /admin/users` |

Not in the API on purpose: the heart (favorite) icon and the "Northfield University" portal switcher.
Neither is in the system design, so remove them from the UI or tell me to add them.
