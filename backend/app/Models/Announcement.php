<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    protected $fillable = ['club_id', 'posted_by', 'title', 'body', 'image_url'];

    public function club(): BelongsTo { return $this->belongsTo(Club::class); }
    public function author(): BelongsTo { return $this->belongsTo(User::class, 'posted_by'); }
}
