<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MembershipResource;
use App\Models\AppNotification;
use App\Models\Club;
use App\Models\Membership;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MembershipController extends Controller
{
    public function join(Request $r, Club $club)
    {
        $user = $r->user();
        $data = $r->validate(['message' => 'nullable|string|max:500']);
        abort_unless($club->status === 'active' && $club->is_accepting_members, 422, 'This club is not accepting new members.');

        $existing = Membership::where('user_id', $user->id)->where('club_id', $club->id)->first();
        if ($existing) {
            abort_if($existing->status === 'approved', 422, 'You are already a member of this club.');
            abort_if($existing->status === 'pending', 422, 'You already have a pending request for this club.');
            if ($existing->status === 'rejected' && $existing->decided_at?->gt(now()->subDays(7))) {
                abort(422, 'You can reapply on ' . $existing->decided_at->addDays(7)->format('M j, Y') . '.');
            }
            $existing->update([
                'status' => 'pending', 'role' => 'member', 'message' => $data['message'] ?? null,
                'decision_reason' => null, 'requested_at' => now(), 'decided_at' => null, 'decided_by' => null,
            ]);
        } else {
            Membership::create([
                'user_id' => $user->id, 'club_id' => $club->id,
                'message' => $data['message'] ?? null, 'requested_at' => now(),
            ]);
        }

        AppNotification::send($club->officerIds(), 'request_update',
            "{$user->profile->full_name} wants to join {$club->name}.", $club->id);
        return response()->json(['status' => 'pending'], 201);
    }

    public function cancel(Request $r, Club $club)
    {
        $m = Membership::where('user_id', $r->user()->id)->where('club_id', $club->id)->where('status', 'pending')->firstOrFail();
        $m->update(['status' => 'cancelled']);
        return response()->noContent();
    }

    public function leave(Request $r, Club $club)
    {
        $m = Membership::where('user_id', $r->user()->id)->where('club_id', $club->id)->where('status', 'approved')->firstOrFail();
        if ($m->role === 'president') {
            $others = $club->memberships()->where('status', 'approved')->where('role', 'president')->where('id', '!=', $m->id)->exists();
            abort_unless($others, 422, 'Assign another president before leaving this club.');
        }
        $m->update(['status' => 'left']);
        return response()->noContent();
    }

    public function requests(Request $r, Club $club)
    {
        abort_unless($club->isOfficer($r->user()), 403);
        return MembershipResource::collection(
            $club->memberships()->with('user.profile', 'user.academic')->where('status', 'pending')->oldest('requested_at')->get());
    }

    public function members(Request $r, Club $club)
    {
        abort_unless($club->isOfficer($r->user()), 403);
        return MembershipResource::collection(
            $club->memberships()->with('user.profile', 'user.academic')->where('status', 'approved')->get());
    }

    public function decide(Request $r, Membership $membership)
    {
        $club = $membership->club;
        abort_unless($club->isOfficer($r->user()), 403);
        $data = $r->validate([
            'status' => ['nullable', Rule::in(['approved', 'rejected', 'removed'])],
            'role' => ['nullable', Rule::in(Membership::ROLES)],
            'decision_reason' => 'nullable|string|max:500',
        ]);

        if (($data['status'] ?? null) === 'approved' || ($data['status'] ?? null) === 'rejected') {
            abort_unless($membership->status === 'pending', 422, 'This request was already handled.');
        }
        if (($data['status'] ?? null) === 'removed') {
            abort_unless($membership->status === 'approved', 422, 'Only current members can be removed.');
        }
        if (isset($data['role']) && $membership->role === 'president' && $data['role'] !== 'president') {
            $others = $club->memberships()->where('status', 'approved')->where('role', 'president')->where('id', '!=', $membership->id)->exists();
            abort_unless($others, 422, 'A club needs at least one president.');
        }

        $membership->update([
            ...array_filter(['status' => $data['status'] ?? null, 'role' => $data['role'] ?? null], fn ($v) => $v !== null),
            'decision_reason' => $data['decision_reason'] ?? $membership->decision_reason,
            'decided_at' => now(), 'decided_by' => $r->user()->id,
        ]);

        $msg = match (true) {
            ($data['status'] ?? null) === 'approved' => "Your request to join {$club->name} was approved.",
            ($data['status'] ?? null) === 'rejected' => "Your request to join {$club->name} was not approved.",
            ($data['status'] ?? null) === 'removed' => "You were removed from {$club->name}.",
            isset($data['role']) => "You are now " . str_replace('_', ' ', $data['role']) . " of {$club->name}.",
            default => null,
        };
        if ($msg) AppNotification::send($membership->user_id, 'request_update', $msg, $club->id);

        return response()->json(['status' => $membership->status, 'role' => $membership->role]);
    }
}
