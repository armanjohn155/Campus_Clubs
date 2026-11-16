<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Club extends Model
{
    /** @use HasFactory<\Database\Factories\ClubFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'slug', 'category_id', 'description', 'logo_url', 'adviser_name',
        'meeting_schedule', 'contact_email', 'member_count', 'is_accepting_members',
        'status', 'created_by',
    ];

    protected function casts(): array
    {
        return ['is_accepting_members' => 'boolean'];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
