<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Club extends Model
{
    protected $fillable = [
        'name', 'category_id', 'description', 'logo_url', 'adviser_name', 'meeting_schedule',
        'contact_email', 'is_accepting_members', 'status', 'created_by',
    ];
    protected $casts = ['is_accepting_members' => 'boolean'];

    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
    public function skills(): BelongsToMany { return $this->belongsToMany(Skill::class, 'club_skills'); }
    public function memberships(): HasMany { return $this->hasMany(Membership::class); }
    public function announcements(): HasMany { return $this->hasMany(Announcement::class); }
    public function myMembership(): HasOne { return $this->hasOne(Membership::class); }

    /** Club query with everything ClubResource needs, scoped to one viewer. */
    public function scopeForUser(Builder $q, int $userId): Builder
    {
        return $q->with([
            'category', 'skills',
            'myMembership' => fn ($m) => $m->where('user_id', $userId),
        ])->withCount(['memberships as member_count' => fn ($m) => $m->where('status', 'approved')]);
    }

    public function officerIds(): array
    {
        return $this->memberships()->where('status', 'approved')->where('role', '!=', 'member')->pluck('user_id')->all();
    }

    public function memberIds(): array
    {
        return $this->memberships()->where('status', 'approved')->pluck('user_id')->all();
    }

    public function isOfficer(User $user): bool
    {
        return $user->isAdmin() || in_array($user->id, $this->officerIds(), true);
    }
}
