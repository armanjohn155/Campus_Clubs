<?php

use App\Http\Controllers\Api\V1\ClubController;
use App\Http\Controllers\Api\V1\CategoryController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('categories', [CategoryController::class, 'index']);
    Route::apiResource('clubs', ClubController::class)->only(['index', 'show']);
});
