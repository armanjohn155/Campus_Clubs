<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Category;
use App\Models\Skill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function update(Request $r)
    {
        $user = $r->user();
        $data = $r->validate([
            'full_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'regex:/^(\+63|0)\s?9\d{2}\s?\d{3}\s?\d{4}$/'],
            'address' => ['nullable', 'string', 'max:255'],
            'course' => ['nullable', 'string', 'max:60'],
            'year_level' => ['required', 'integer', 'between:1,6'],
            'section' => ['nullable', 'string', 'max:10'],
            'skills' => ['array', 'max:20'],
            'skills.*' => ['string', 'max:40'],
        ], ['phone.regex' => 'Use a valid PH number, for example +63 912 345 6789.']);

        DB::transaction(function () use ($user, $data) {
            $user->update(['email' => $data['email']]);
            $user->profile()->updateOrCreate(['user_id' => $user->id], [
                'full_name' => $data['full_name'], 'phone' => $data['phone'] ?? null, 'address' => $data['address'] ?? null,
            ]);
            $user->academic()->updateOrCreate(['user_id' => $user->id], [
                'course' => $data['course'] ?? null, 'year_level' => $data['year_level'], 'section' => $data['section'] ?? null,
            ]);
            $ids = collect($data['skills'] ?? [])->map(fn ($n) => trim($n))->filter()->unique()
                ->map(fn ($n) => Skill::firstOrCreate(['name' => $n])->id);
            $user->skills()->sync($ids);
        });

        return new UserResource($user->fresh(['profile', 'academic', 'skills']));
    }

    public function photo(Request $r)
    {
        $r->validate(['photo' => 'required|image|mimes:jpg,jpeg,png|max:2048']);
        $profile = $r->user()->profile;
        if ($profile->photo_path) Storage::disk('public')->delete($profile->photo_path);
        $profile->update(['photo_path' => $r->file('photo')->store('profile-photos', 'public')]);
        return ['photo_url' => $profile->fresh()->photo_url];
    }

    public function skills()
    {
        return Skill::orderBy('name')->pluck('name');
    }

    public function categories()
    {
        return Category::orderBy('name')->get(['id', 'name']);
    }
}
