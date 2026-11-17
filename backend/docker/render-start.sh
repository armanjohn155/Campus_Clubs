#!/bin/sh
set -e
mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chmod -R 775 storage bootstrap/cache

php artisan package:discover --ansi
php artisan storage:link || true
php artisan migrate --force
php artisan db:seed --force

# PHP_CLI_SERVER_WORKERS (set in render.yaml) lets the built-in server handle several requests at once.
exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}" --no-reload
