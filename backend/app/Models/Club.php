<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Club extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'category_id',
        'description',
        'logo_url',
        'adviser_name',
        'meeting_schedule',
        'contact_email',
        'member_count',
        'is_accepting_members',
        'status',
        'created_by',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['is_accepting_members' => 'boolean'];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'club_skills');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class);
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class);
    }

    public function myMembership(): HasOne
    {
        return $this->hasOne(Membership::class);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query
            ->with([
                'category',
                'skills',
                'myMembership' => fn ($membershipQuery) => $membershipQuery->where('user_id', $userId),
            ])
            ->withCount([
                'memberships as approved_members_count' => fn (Builder $membershipQuery) => $membershipQuery->where('status', 'approved'),
            ]);
    }

    /** @return list<int> */
    public function officerIds(): array
    {
        return $this->memberships()
            ->where('status', 'approved')
            ->where('role', '!=', 'member')
            ->pluck('user_id')
            ->map(static fn ($id): int => (int) $id)
            ->all();
    }

    /** @return list<int> */
    public function memberIds(): array
    {
        return $this->memberships()
            ->where('status', 'approved')
            ->pluck('user_id')
            ->map(static fn ($id): int => (int) $id)
            ->all();
    }

    public function isOfficer(User $user): bool
    {
        return $user->isAdmin() || in_array($user->id, $this->officerIds(), true);
    }
}
