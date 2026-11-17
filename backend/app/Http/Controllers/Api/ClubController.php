<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClubResource;
use App\Models\AppNotification;
use App\Models\Club;
use App\Models\Membership;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ClubController extends Controller
{
    public function index(Request $r)
    {
        $user = $r->user();
        $q = Club::forUser($user->id);
        if (! $user->isAdmin()) {
            $q->where('status', 'active');
        }

        if ($s = trim((string) $r->query('search'))) {
            $q->where(fn ($w) => $w->where('name', 'ilike', "%$s%")
                ->orWhere('description', 'ilike', "%$s%")
                ->orWhereHas('skills', fn ($k) => $k->where('name', 'ilike', "%$s%")));
        }
        if ($category = $r->query('category')) {
            $q->whereHas('category', function ($categoryQuery) use ($category): void {
                if (ctype_digit((string) $category)) {
                    $categoryQuery->whereKey((int) $category);
                } else {
                    $categoryQuery->where('name', $category)->orWhere('slug', $category);
                }
            });
        }

        match ($r->query('sort', 'recommended')) {
            'popular' => $q->orderByDesc('approved_members_count'),
            'name' => $q->orderBy('name'),
            default => $q->withCount(['skills as match_count' => fn ($w) => $w->whereIn(
                'skills.id', $user->skills()->pluck('skills.id')->all())])
                ->orderByDesc('match_count')->orderByDesc('approved_members_count'),
        };

        return ClubResource::collection($q->get());
    }

    public function show(Request $r, Club $club)
    {
        $user = $r->user();
        $club = Club::forUser($user->id)->findOrFail($club->id);
        abort_if($club->status !== 'active' && ! $club->isOfficer($user), 404);
        return new ClubResource($club);
    }

    public function myClubs(Request $r)
    {
        $uid = $r->user()->id;
        $clubs = Club::forUser($uid)
            ->whereHas('memberships', fn ($m) => $m->where('user_id', $uid)->whereIn('status', ['approved', 'pending']))
            ->orderBy('name')->get();
        return ClubResource::collection($clubs);
    }

    public function store(Request $r)
    {
        $user = $r->user();
        $data = $r->validate([
            'name' => 'required|string|min:3|max:60|unique:clubs,name',
            'category_id' => 'required|exists:categories,id',
            'description' => 'required|string|max:500',
            'adviser_name' => 'nullable|string|max:120',
            'meeting_schedule' => 'nullable|string|max:120',
            'contact_email' => 'nullable|email',
            'tags' => 'array|max:6', 'tags.*' => 'string|max:40',
        ]);

        $club = DB::transaction(function () use ($data, $user) {
            $club = Club::create([
                ...collect($data)->except('tags')->all(),
                'slug' => $this->uniqueSlug($data['name']),
                'status' => $user->isAdmin() ? 'active' : 'pending',
                'created_by' => $user->id,
            ]);
            $club->skills()->sync(collect($data['tags'] ?? [])->map(fn ($n) => Skill::firstOrCreate(['name' => trim($n)])->id));
            Membership::create([
                'user_id' => $user->id, 'club_id' => $club->id, 'role' => 'president',
                'status' => 'approved', 'decided_at' => now(), 'decided_by' => $user->id,
            ]);
            return $club;
        });

        if (! $user->isAdmin()) {
            AppNotification::send(User::where('role', 'ADMIN')->pluck('id'), 'system',
                "New club proposal: {$club->name}", $club->id);
        }
        return (new ClubResource(Club::forUser($user->id)->find($club->id)))->response()->setStatusCode(201);
    }

    public function update(Request $r, Club $club)
    {
        abort_unless($club->isOfficer($r->user()), 403);
        $data = $r->validate([
            'name' => 'sometimes|string|min:3|max:60|unique:clubs,name,' . $club->id,
            'category_id' => 'sometimes|exists:categories,id',
            'description' => 'sometimes|string|max:500',
            'adviser_name' => 'nullable|string|max:120',
            'meeting_schedule' => 'nullable|string|max:120',
            'contact_email' => 'nullable|email',
            'is_accepting_members' => 'sometimes|boolean',
            'tags' => 'sometimes|array|max:6', 'tags.*' => 'string|max:40',
        ]);
        $updates = collect($data)->except('tags')->all();
        if (isset($data['name'])) {
            $updates['slug'] = $this->uniqueSlug($data['name'], $club->id);
        }
        $club->update($updates);
        if (isset($data['tags'])) {
            $club->skills()->sync(collect($data['tags'])->map(fn ($n) => Skill::firstOrCreate(['name' => trim($n)])->id));
        }
        return new ClubResource(Club::forUser($r->user()->id)->find($club->id));
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $suffix = 2;

        while (Club::withTrashed()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = $baseSlug.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
