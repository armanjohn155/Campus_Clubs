<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Club;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ClubSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $clubs = [
            ['Computer Science Society', 'Technology', 'Build, learn, and ship ideas with fellow tech enthusiasts.', 248],
            ['Campus Creatives', 'Arts', 'A home for photographers, illustrators, and storytellers.', 126],
            ['Young Entrepreneurs', 'Academic', 'Turn bold ideas into real projects alongside your peers.', 94],
            ['Green Campus Collective', 'Community Service', 'Make our campus greener, one practical action at a time.', 183],
            ['University Debate Circle', 'Academic', 'Sharpen your arguments and make room for new perspectives.', 72],
            ['Wildcats Volleyball', 'Sports', 'Play, train, and cheer with the campus volleyball community.', 61],
        ];

        foreach (['Academic', 'Arts', 'Sports', 'Technology', 'Community Service', 'Religious', 'Others'] as $categoryName) {
            Category::query()->updateOrCreate(
                ['slug' => Str::slug($categoryName)],
                ['name' => $categoryName, 'is_active' => true],
            );
        }

        foreach ($clubs as [$name, $categoryName, $description, $memberCount]) {
            Club::query()->updateOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'category_id' => Category::query()->where('slug', Str::slug($categoryName))->value('id'),
                    'description' => $description,
                    'member_count' => $memberCount,
                    'is_accepting_members' => true,
                    'status' => 'active',
                ],
            );
        }
    }
}
