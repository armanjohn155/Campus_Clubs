<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_reseeding_updates_admin_password_without_creating_another_admin(): void
    {
        $envNames = ['SEED_ADMIN_EMAIL', 'SEED_ADMIN_NAME', 'SEED_ADMIN_PASSWORD'];
        $previous = [];
        foreach ($envNames as $envName) {
            $previous[$envName] = [getenv($envName), $_ENV[$envName] ?? null, $_SERVER[$envName] ?? null];
        }

        $this->setSeederEnvironment('SEED_ADMIN_EMAIL', '  Admin@Example.Test  ');
        $this->setSeederEnvironment('SEED_ADMIN_NAME', '  Campus Admin  ');
        $this->setSeederEnvironment('SEED_ADMIN_PASSWORD', '  FirstCampusPass123  ');
        User::factory()->create([
            'email' => 'ADMIN@example.test',
            'student_id' => '2025-00001',
            'role' => 'USER',
        ]);

        try {
            Artisan::call('db:seed', ['--class' => 'DatabaseSeeder', '--force' => true]);
            $admin = User::query()->whereRaw('LOWER(email) = ?', ['admin@example.test'])->firstOrFail();
            $firstHash = $admin->password;

            $this->assertTrue(Hash::check('FirstCampusPass123', $firstHash));
            $this->assertSame('Campus Admin', $admin->name);
            $this->assertSame('ADMIN-0001', $admin->student_id);
            $this->assertSame('ADMIN', $admin->role);
            $this->assertTrue($admin->is_active);

            $this->setSeederEnvironment('SEED_ADMIN_PASSWORD', '  SecondCampusPass123  ');
            Artisan::call('db:seed', ['--class' => 'DatabaseSeeder', '--force' => true]);

            $admin->refresh();
            $this->assertNotSame($firstHash, $admin->password);
            $this->assertTrue(Hash::check('SecondCampusPass123', $admin->password));
            $this->assertSame(1, User::query()->where('role', 'ADMIN')->count());
        } finally {
            foreach ($previous as $envName => [$processValue, $envValue, $serverValue]) {
                if ($processValue === false) {
                    putenv($envName);
                } else {
                    putenv($envName.'='.$processValue);
                }
                if ($envValue === null) {
                    unset($_ENV[$envName]);
                } else {
                    $_ENV[$envName] = $envValue;
                }
                if ($serverValue === null) {
                    unset($_SERVER[$envName]);
                } else {
                    $_SERVER[$envName] = $serverValue;
                }
            }
        }
    }

    private function setSeederEnvironment(string $name, string $value): void
    {
        putenv($name.'='.$value);
        $_ENV[$name] = $value;
        $_SERVER[$name] = $value;
    }
}
