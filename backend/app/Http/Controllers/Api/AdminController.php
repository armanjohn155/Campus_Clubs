<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Announcement;
use App\Models\AppNotification;
use App\Models\Club;
use App\Models\Membership;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function users(Request $r)
    {
        $q = User::with('profile', 'academic', 'skills')->latest();
        if ($s = trim((string) $r->query('search'))) {
            $q->where(fn ($w) => $w->where('student_id', 'ilike', "%$s%")->orWhere('email', 'ilike', "%$s%")
                ->orWhereHas('profile', fn ($p) => $p->where('full_name', 'ilike', "%$s%")));
        }
        return UserResource::collection($q->paginate(25));
    }

    public function toggleUser(Request $r, User $user)
    {
        abort_if($user->id === $r->user()->id, 422, 'You cannot disable your own account.');
        $user->update(['is_active' => ! $user->is_active]);
        if (! $user->is_active) $user->tokens()->delete();
        return ['id' => $user->id, 'is_active' => $user->is_active];
    }

    public function clubStatus(Request $r, Club $club)
    {
        $data = $r->validate(['status' => 'required|in:active,inactive,rejected']);
        $was = $club->status;
        $club->update($data);
        if ($was === 'pending') {
            AppNotification::send($club->created_by, 'club_approved',
                $data['status'] === 'active' ? "Your club proposal {$club->name} was approved." : "Your club proposal {$club->name} was not approved.", $club->id);
        }
        return ['id' => $club->id, 'status' => $club->status];
    }

    public function announce(Request $r)
    {
        $data = $r->validate(['title' => 'required|string|max:100', 'body' => 'required|string|max:1000']);
        $a = Announcement::create([...$data, 'club_id' => null, 'posted_by' => $r->user()->id]);
        AppNotification::send(User::where('is_active', true)->where('id', '!=', $r->user()->id)->pluck('id'),
            'system', "Campus announcement: {$a->title}", $a->id);
        return response()->json(AnnouncementController::shape($a), 201);
    }

    public function reports()
    {
        return [
            'totals' => [
                'students' => User::where('role', 'USER')->count(),
                'clubs' => Club::where('status', 'active')->count(),
                'memberships' => Membership::where('status', 'approved')->count(),
                'pending_clubs' => Club::where('status', 'pending')->count(),
            ],
            'members_per_club' => Club::where('status', 'active')
                ->withCount(['memberships as members' => fn ($m) => $m->where('status', 'approved')])
                ->orderByDesc('members')->get(['id', 'name']),
            'students_without_club' => User::where('role', 'USER')
                ->whereDoesntHave('memberships', fn ($m) => $m->where('status', 'approved'))->count(),
            'membership_growth' => DB::table('memberships')->where('status', 'approved')
                ->selectRaw("to_char(date_trunc('month', requested_at), 'YYYY-MM') as month, count(*) as total")
                ->groupBy('month')->orderBy('month')->get(),
        ];
    }
}
