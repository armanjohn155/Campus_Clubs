<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClubResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'category' => $this->category->name,
            'description' => $this->description,
            'logo_url' => $this->logo_url,
            'adviser_name' => $this->adviser_name,
            'meeting_schedule' => $this->meeting_schedule,
            'contact_email' => $this->contact_email,
            'member_count' => $this->member_count,
            'is_accepting_members' => $this->is_accepting_members,
        ];
    }
}
