<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Club;
use App\Models\Membership;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Database\Seeder;

/** Starter clubs. Edit or delete freely: clubs can also be created from the app. */
class ClubSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'ADMIN')->first();
        if (! $admin) return;

        $clubs = [
            ['Computer Science Society', 'Technology', 'Build, learn, and ship projects with fellow tech enthusiasts.', ['Coding', 'Projects']],
            ['Campus Creatives', 'Arts', 'A home for photographers, illustrators, and storytellers.', ['Graphic Design', 'Photography']],
            ['Young Entrepreneurs', 'Academic', 'Turn bold ideas into real projects alongside your peers.', ['Leadership', 'Business']],
            ['Green Campus Collective', 'Community Service', 'Make our campus greener, one practical action at a time.', ['Environment', 'Teamwork']],
            ['University Debate Circle', 'Academic', 'Sharpen your arguments and make room for new perspectives.', ['Public speaking', 'Critical thinking']],
            ['Wildcats Volleyball', 'Sports', 'Play, train, and cheer with the campus volleyball community.', ['Teamwork', 'Fitness']],
        ];

        foreach ($clubs as [$name, $cat, $desc, $tags]) {
            $club = Club::firstOrCreate(['name' => $name], [
                'category_id' => Category::where('name', $cat)->value('id'),
                'description' => $desc, 'status' => 'active', 'created_by' => $admin->id,
            ]);
            $club->skills()->syncWithoutDetaching(collect($tags)->map(fn ($t) => Skill::firstOrCreate(['name' => $t])->id));
            Membership::firstOrCreate(['user_id' => $admin->id, 'club_id' => $club->id],
                ['role' => 'president', 'status' => 'approved', 'decided_at' => now(), 'decided_by' => $admin->id]);
        }
    }
}
