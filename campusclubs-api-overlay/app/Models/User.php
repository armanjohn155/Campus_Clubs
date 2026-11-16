<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes;

    protected $fillable = ['student_id', 'email', 'password', 'role', 'is_active'];
    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['password' => 'hashed', 'is_active' => 'boolean'];
    }

    public function profile(): HasOne { return $this->hasOne(Profile::class); }
    public function academic(): HasOne { return $this->hasOne(AcademicDetail::class); }
    public function skills(): BelongsToMany { return $this->belongsToMany(Skill::class, 'user_skills'); }
    public function memberships(): HasMany { return $this->hasMany(Membership::class); }
    public function appNotifications(): HasMany { return $this->hasMany(AppNotification::class); }

    public function isAdmin(): bool { return $this->role === 'ADMIN'; }
}
