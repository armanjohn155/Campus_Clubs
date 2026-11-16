<?php

namespace Database\Seeders;

use App\Models\AcademicDetail;
use App\Models\Category;
use App\Models\Profile;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Academic', 'Arts', 'Sports', 'Technology', 'Community Service', 'Religious', 'Others'] as $name) {
            Category::firstOrCreate(['name' => $name]);
        }

        foreach (['Coding', 'Graphic Design', 'Photography', 'Writing', 'Public speaking', 'Critical thinking', 'Leadership',
                  'Business', 'Teamwork', 'Fitness', 'Environment', 'Projects', 'Gaming', 'Reading', 'Music'] as $name) {
            Skill::firstOrCreate(['name' => $name]);
        }

        // The administrator account comes from .env, so no password is stored in code.
        $email = env('SEED_ADMIN_EMAIL');
        $pass = env('SEED_ADMIN_PASSWORD');
        if (! $email || ! $pass) {
            $this->command?->warn('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set: no admin created, no starter clubs added.');
            return;
        }
        $admin = User::firstOrCreate(['email' => $email], [
            'student_id' => 'ADMIN-0001', 'password' => $pass, 'role' => 'ADMIN',
        ]);
        Profile::firstOrCreate(['user_id' => $admin->id], ['full_name' => env('SEED_ADMIN_NAME', 'Administrator')]);
        AcademicDetail::firstOrCreate(['user_id' => $admin->id]);

        $this->call(ClubSeeder::class);
    }
}
