#!/bin/sh
set -e

php artisan package:discover --ansi
php artisan storage:link || true
php artisan migrate --force
php artisan db:seed --force

# PHP_CLI_SERVER_WORKERS (set in render.yaml) lets the built-in server handle several requests at once.
exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}" --no-reload
