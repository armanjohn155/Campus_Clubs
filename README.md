# CampusClubs local development

## Start the stack

From the workspace root, start PostgreSQL, Laravel, and Vite with Docker Compose:

```powershell
docker compose up -d
```

The backend installs Composer dependencies, applies migrations, and runs the full
database seeder on startup. PostgreSQL data remains in the named
`postgres_data` volume.

| Service | URL / port |
|---|---|
| Frontend | <http://localhost:5173> |
| API | <http://localhost:8000/api> |
| PostgreSQL from the host | `127.0.0.1:5433` |
| PostgreSQL from backend container | `db:5432` |

The seeded administrator credentials are `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD` from `backend/.env`. Sign in at the frontend using those
values. Keep the `.env` file private.

On Render, set `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME`, and
`SEED_ADMIN_PASSWORD` as service environment variables. The startup seeder
syncs the admin account on every deploy. To reset the admin password, change
`SEED_ADMIN_PASSWORD` in the Render service environment and redeploy.

## Run backend tests

On Windows, from the backend directory, run the PHPUnit suite with the host
database settings in `backend/.env` (`127.0.0.1:5433`):

```powershell
Set-Location .\backend
php artisan test
Set-Location ..
```

## Run the API smoke test

Run this from the workspace root. It reads the admin email and password from
`backend/.env` into temporary process environment variables and clears them
afterward. Use `127.0.0.1` explicitly: a WSL relay also listens on `[::1]:8000`,
so `localhost` can reach the wrong endpoint.

```powershell
$dotenvLines = Get-Content .\backend\.env
function Get-DotEnvValue([string]$Name) {
    $entry = $dotenvLines | Where-Object { $_ -match "^\s*$([regex]::Escape($Name))=" } | Select-Object -Last 1
    if (-not $entry) { throw "Missing $Name in backend/.env." }
    $value = $entry.Substring($entry.IndexOf('=') + 1).Trim()
    if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) {
        $value = $value.Substring(1, $value.Length - 2)
    }
    return $value
}
try {
    $env:ADMIN_EMAIL = Get-DotEnvValue 'SEED_ADMIN_EMAIL'
    $env:ADMIN_PASSWORD = Get-DotEnvValue 'SEED_ADMIN_PASSWORD'
    $env:API_URL = 'http://127.0.0.1:8000/api'
    node .\scripts\smoke-test.mjs
    if ($LASTEXITCODE -ne 0) { throw "Smoke test failed with exit code $LASTEXITCODE." }
} finally {
    Remove-Item Env:\ADMIN_EMAIL, Env:\ADMIN_PASSWORD, Env:\API_URL -ErrorAction SilentlyContinue
}
```

The smoke test creates a student account and club proposal and posts an
announcement to a seeded club. Those test records remain in the database.

## Password reset mail

For local development, `MAIL_MAILER=log` is sufficient. Laravel writes the
reset email and its frontend link to `backend/storage/logs/laravel.log`.

## Known development details

- Keep `--no-reload` on the backend's `php artisan serve` command in
  `docker-compose.yml`. Laravel's development server can restart the app and
  reload `backend/.env`; that file uses host-side database settings
  (`127.0.0.1:5433`) while the container must connect to `db:5432`. Disabling
  reload keeps the Compose-provided container environment in effect.
- The database port is bound to localhost only. Host-side PHP and PHPUnit use
  port `5433`; containers use the Compose service name `db` and port `5432`.
- Avoid `docker compose down -v` unless you intend to delete the PostgreSQL
  volume and all local database data.
