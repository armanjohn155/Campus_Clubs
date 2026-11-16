<?php

use App\Http\Controllers\Api\{AdminController, AnnouncementController, AuthController, ClubController,
    MembershipController, NotificationController, ProfileController};
use App\Http\Middleware\AdminOnly;
use Illuminate\Support\Facades\Route;

Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);

    Route::put('profile', [ProfileController::class, 'update']);
    Route::post('profile/photo', [ProfileController::class, 'photo']);
    Route::get('skills', [ProfileController::class, 'skills']);
    Route::get('categories', [ProfileController::class, 'categories']);

    Route::get('clubs', [ClubController::class, 'index']);
    Route::post('clubs', [ClubController::class, 'store']);
    Route::get('clubs/{club}', [ClubController::class, 'show']);
    Route::put('clubs/{club}', [ClubController::class, 'update']);
    Route::get('my-clubs', [ClubController::class, 'myClubs']);

    Route::post('clubs/{club}/join', [MembershipController::class, 'join']);
    Route::delete('clubs/{club}/join', [MembershipController::class, 'cancel']);
    Route::delete('clubs/{club}/leave', [MembershipController::class, 'leave']);
    Route::get('clubs/{club}/requests', [MembershipController::class, 'requests']);
    Route::get('clubs/{club}/members', [MembershipController::class, 'members']);
    Route::patch('memberships/{membership}', [MembershipController::class, 'decide']);

    Route::get('announcements', [AnnouncementController::class, 'index']);
    Route::post('clubs/{club}/announcements', [AnnouncementController::class, 'store']);
    Route::put('announcements/{announcement}', [AnnouncementController::class, 'update']);
    Route::delete('announcements/{announcement}', [AnnouncementController::class, 'destroy']);

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::patch('notifications/read-all', [NotificationController::class, 'readAll']);
    Route::patch('notifications/{id}/read', [NotificationController::class, 'read']);

    Route::prefix('admin')->middleware(AdminOnly::class)->group(function () {
        Route::get('users', [AdminController::class, 'users']);
        Route::patch('users/{user}/toggle', [AdminController::class, 'toggleUser']);
        Route::patch('clubs/{club}/status', [AdminController::class, 'clubStatus']);
        Route::post('announcements', [AdminController::class, 'announce']);
        Route::get('reports', [AdminController::class, 'reports']);
    });
});
