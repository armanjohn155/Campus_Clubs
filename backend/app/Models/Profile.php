<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Profile extends Model
{
    protected $primaryKey = 'user_id';
    public $incrementing = false;
    protected $fillable = ['user_id', 'full_name', 'phone', 'address', 'photo_path'];

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo_path ? url(Storage::disk('public')->url($this->photo_path)) : null;
    }
}
