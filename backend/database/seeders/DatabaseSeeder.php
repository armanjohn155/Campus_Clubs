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

        $email = env('SEED_ADMIN_EMAIL');
        $password = env('SEED_ADMIN_PASSWORD');
        if (! $email || ! $password) {
            $this->command?->warn('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set to create the admin account.');

            return;
        }

        $name = env('SEED_ADMIN_NAME', 'Administrator');
        $admin = User::updateOrCreate(
            ['email' => $email],
            [
                'student_id' => 'ADMIN-0001',
                'name' => $name,
                'password' => $password,
                'role' => 'ADMIN',
                'is_active' => true,
            ],
        );

        Profile::updateOrCreate(['user_id' => $admin->id], ['full_name' => $name]);
        AcademicDetail::firstOrCreate(['user_id' => $admin->id]);

        $this->call(ClubSeeder::class);
    }
}
