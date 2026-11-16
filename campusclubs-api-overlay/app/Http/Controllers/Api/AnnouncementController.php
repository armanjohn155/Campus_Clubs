<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AppNotification;
use App\Models\Club;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public static function shape(Announcement $a): array
    {
        return [
            'id' => $a->id, 'club_id' => $a->club_id, 'club_name' => $a->club?->name ?? 'Campus',
            'title' => $a->title, 'body' => $a->body, 'created_at' => $a->created_at->toIso8601String(),
        ];
    }

    public function index(Request $r)
    {
        $user = $r->user();
        $q = Announcement::with('club')->latest()->limit(50);
        if (! $user->isAdmin()) {
            $clubIds = $user->memberships()->where('status', 'approved')->pluck('club_id');
            $q->where(fn ($w) => $w->whereNull('club_id')->orWhereIn('club_id', $clubIds));
        }
        return $q->get()->map(fn ($a) => self::shape($a));
    }

    public function store(Request $r, Club $club)
    {
        abort_unless($club->isOfficer($r->user()), 403);
        $data = $r->validate(['title' => 'required|string|max:100', 'body' => 'required|string|max:1000']);
        $a = $club->announcements()->create([...$data, 'posted_by' => $r->user()->id]);
        AppNotification::send(array_diff($club->memberIds(), [$r->user()->id]), 'announcement',
            "New announcement from {$club->name}: {$a->title}", $a->id);
        return response()->json(self::shape($a->load('club')), 201);
    }

    public function update(Request $r, Announcement $announcement)
    {
        $this->authorizeEdit($r, $announcement);
        $announcement->update($r->validate(['title' => 'required|string|max:100', 'body' => 'required|string|max:1000']));
        return self::shape($announcement->load('club'));
    }

    public function destroy(Request $r, Announcement $announcement)
    {
        $this->authorizeEdit($r, $announcement);
        $announcement->delete();
        return response()->noContent();
    }

    private function authorizeEdit(Request $r, Announcement $a): void
    {
        $ok = $a->club ? $a->club->isOfficer($r->user()) : $r->user()->isAdmin();
        abort_unless($ok, 403);
    }
}
