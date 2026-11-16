<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Membership extends Model
{
    public const ROLES = ['member', 'secretary', 'treasurer', 'vice_president', 'president'];

    protected $fillable = [
        'user_id', 'club_id', 'role', 'status', 'message', 'decision_reason',
        'requested_at', 'decided_at', 'decided_by',
    ];
    protected $casts = ['requested_at' => 'datetime', 'decided_at' => 'datetime'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function club(): BelongsTo { return $this->belongsTo(Club::class); }
}
