<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MembershipResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $u = $this->user;
        return [
            'id' => $this->id,
            'status' => $this->status,
            'role' => $this->role,
            'message' => $this->message,
            'requested_at' => $this->requested_at?->toIso8601String(),
            'user' => [
                'id' => $u->id,
                'full_name' => $u->profile?->full_name ?? '',
                'student_id' => $u->student_id,
                'course' => $u->academic?->course ?? '',
                'year_level' => (int) ($u->academic?->year_level ?? 1),
            ],
        ];
    }
}
