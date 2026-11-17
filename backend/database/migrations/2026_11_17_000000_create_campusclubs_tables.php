<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table): void {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('full_name');
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->string('photo_path')->nullable();
            $table->timestamps();
        });

        Schema::create('academic_details', function (Blueprint $table): void {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('course')->nullable();
            $table->unsignedTinyInteger('year_level')->default(1);
            $table->string('section')->nullable();
            $table->timestamps();
        });

        Schema::create('skills', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
        });

        Schema::create('user_skills', function (Blueprint $table): void {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->primary(['user_id', 'skill_id']);
        });

        Schema::create('club_skills', function (Blueprint $table): void {
            $table->foreignId('club_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->primary(['club_id', 'skill_id']);
        });

        Schema::create('memberships', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('club_id')->constrained()->cascadeOnDelete();
            $table->string('role')->default('member');
            $table->string('status')->default('pending');
            $table->text('message')->nullable();
            $table->text('decision_reason')->nullable();
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('decided_at')->nullable();
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'club_id']);
            $table->index(['club_id', 'status']);
        });

        Schema::create('announcements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('club_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('posted_by')->constrained('users')->cascadeOnDelete();
            $table->string('title', 100);
            $table->text('body');
            $table->string('image_url')->nullable();
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('message');
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();
            $table->index(['user_id', 'is_read']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('memberships');
        Schema::dropIfExists('club_skills');
        Schema::dropIfExists('user_skills');
        Schema::dropIfExists('skills');
        Schema::dropIfExists('academic_details');
        Schema::dropIfExists('profiles');
    }
};
