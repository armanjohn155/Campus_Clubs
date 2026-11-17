<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClubResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $m = $this->relationLoaded('myMembership') ? $this->myMembership : null;
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category?->name,
            'category_id' => $this->category_id,
            'description' => $this->description,
            'logo_url' => $this->logo_url,
            'adviser_name' => $this->adviser_name,
            'meeting_schedule' => $this->meeting_schedule,
            'contact_email' => $this->contact_email,
            'is_accepting_members' => $this->is_accepting_members,
            'status' => $this->status,
            'member_count' => (int) ($this->approved_members_count ?? 0),
            'tags' => $this->skills->pluck('name')->values(),
            'my_membership' => $m ? ['id' => $m->id, 'status' => $m->status, 'role' => $m->role] : null,
        ];
    }
}
