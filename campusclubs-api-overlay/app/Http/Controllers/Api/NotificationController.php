<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $r)
    {
        $q = $r->user()->appNotifications();
        return [
            'unread_count' => (clone $q)->where('is_read', false)->count(),
            'data' => (clone $q)->latest()->limit(50)->get(['id', 'type', 'message', 'reference_id', 'is_read', 'created_at']),
        ];
    }

    public function read(Request $r, int $id)
    {
        $r->user()->appNotifications()->whereKey($id)->update(['is_read' => true]);
        return response()->noContent();
    }

    public function readAll(Request $r)
    {
        $r->user()->appNotifications()->where('is_read', false)->update(['is_read' => true]);
        return response()->noContent();
    }
}
