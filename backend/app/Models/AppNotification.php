<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppNotification extends Model
{
    protected $table = 'notifications';
    protected $fillable = ['user_id', 'type', 'message', 'reference_id', 'is_read'];
    protected $casts = ['is_read' => 'boolean'];

    /** @param iterable<int>|int $userIds */
    public static function send(iterable|int $userIds, string $type, string $message, ?int $ref = null): void
    {
        $ids = is_int($userIds) ? [$userIds] : collect($userIds)->unique()->all();
        foreach ($ids as $id) {
            static::create(['user_id' => $id, 'type' => $type, 'message' => $message, 'reference_id' => $ref]);
        }
    }
}
