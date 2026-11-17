# CampusClubs local development

Run the Laravel backend, Vite frontend, and PostgreSQL database with Docker Compose:

```sh
docker compose up --build
```

Open the frontend at <http://localhost:5173> and the backend at <http://localhost:8000>.
The backend container installs Composer dependencies, creates its application key,
and runs database migrations on startup. PostgreSQL data is stored in the
`postgres_data` Docker volume.

For password resets, set `MAIL_MAILER=log` during local development. Laravel writes
the email (including its frontend reset link) to `backend/storage/logs/laravel.log`.

Stop the stack with `Ctrl+C`, or run `docker compose down`. To remove the database
volume as well, run `docker compose down -v`.
