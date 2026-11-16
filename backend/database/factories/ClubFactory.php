<?php

namespace Database\Factories;

use App\Models\Club;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Club>
 */
class ClubFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->company().' Club',
            'slug' => fn (array $attributes): string => Str::slug($attributes['name']),
            'category_id' => Category::factory(),
            'description' => fake()->paragraph(),
            'member_count' => fake()->numberBetween(0, 250),
            'is_accepting_members' => true,
            'status' => 'active',
        ];
    }
}
