<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->resource->loadMissing(['profile', 'academic', 'skills']);
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'email' => $this->email,
            'role' => $this->role,
            'is_active' => $this->is_active,
            'full_name' => $this->profile?->full_name ?? '',
            'course' => $this->academic?->course ?? '',
            'year_level' => (int) ($this->academic?->year_level ?? 1),
            'section' => $this->academic?->section ?? '',
            'phone' => $this->profile?->phone,
            'address' => $this->profile?->address,
            'photo_url' => $this->profile?->photo_url,
            'skills' => $this->skills->pluck('name')->values(),
        ];
    }
}
