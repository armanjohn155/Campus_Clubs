<?php

namespace Database\Seeders;

use App\Models\AcademicDetail;
use App\Models\Category;
use App\Models\Profile;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->syncAdminFromEnvironment();

        foreach (['Academic', 'Arts', 'Sports', 'Technology', 'Community Service', 'Religious', 'Others'] as $name) {
            Category::firstOrCreate(
                ['name' => $name],
                ['slug' => Str::slug($name), 'is_active' => true],
            );
        }

        foreach ([
            'Coding', 'Graphic Design', 'Photography', 'Writing', 'Public speaking', 'Critical thinking',
            'Leadership', 'Business', 'Teamwork', 'Fitness', 'Environment', 'Projects', 'Gaming', 'Reading', 'Music',
        ] as $name) {
            Skill::firstOrCreate(['name' => $name]);
        }

        $this->call(ClubSeeder::class);
    }

    private function syncAdminFromEnvironment(): void
    {
        $email = mb_strtolower(trim((string) env('SEED_ADMIN_EMAIL', '')));
        $password = trim((string) env('SEED_ADMIN_PASSWORD', ''));

        if ($email === '' || $password === '') {
            $this->command?->warn('Admin seeding skipped: SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must both be set.');

            return;
        }

        $name = trim((string) env('SEED_ADMIN_NAME', 'Administrator')) ?: 'Administrator';
        $existing = User::withTrashed()
            ->whereRaw('LOWER(email) = ?', [$email])
            ->first();

        $studentId = 'ADMIN-0001';
        $studentIdQuery = User::withTrashed()->where('student_id', $studentId);
        if ($existing) {
            $studentIdQuery->where('id', '<>', $existing->id);
        }
        if ($studentIdQuery->exists()) {
            $studentId = 'ADMIN-'.strtoupper(substr(sha1($email), 0, 10));
        }

        $admin = User::withTrashed()->updateOrCreate(
            ['email' => $existing?->email ?? $email],
            [
                'email' => $email,
                'student_id' => $studentId,
                'name' => $name,
                'password' => $password,
                'role' => 'ADMIN',
                'is_active' => true,
            ],
        );

        if ($admin->trashed()) {
            $admin->restore();
        }

        $this->command?->info('Admin seeding '.($existing ? 'updated.' : 'created.'));

        Profile::updateOrCreate(['user_id' => $admin->id], ['full_name' => $name]);
        AcademicDetail::firstOrCreate(['user_id' => $admin->id]);

    }
}
