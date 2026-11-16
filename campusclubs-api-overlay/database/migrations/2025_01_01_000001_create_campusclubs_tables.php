<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $t) {
            $t->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $t->string('full_name');
            $t->string('phone')->nullable();
            $t->string('address')->nullable();
            $t->string('photo_path')->nullable();
            $t->timestamps();
        });

        Schema::create('academic_details', function (Blueprint $t) {
            $t->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $t->string('course')->nullable();
            $t->unsignedTinyInteger('year_level')->default(1);
            $t->string('section')->nullable();
            $t->timestamps();
        });

        Schema::create('skills', function (Blueprint $t) {
            $t->id();
            $t->string('name')->unique();
        });

        Schema::create('user_skills', function (Blueprint $t) {
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $t->primary(['user_id', 'skill_id']);
        });

        Schema::create('categories', function (Blueprint $t) {
            $t->id();
            $t->string('name')->unique();
        });

        Schema::create('clubs', function (Blueprint $t) {
            $t->id();
            $t->string('name')->unique();
            $t->foreignId('category_id')->constrained();
            $t->text('description');
            $t->string('logo_url')->nullable();
            $t->string('adviser_name')->nullable();
            $t->string('meeting_schedule')->nullable();
            $t->string('contact_email')->nullable();
            $t->boolean('is_accepting_members')->default(true);
            $t->string('status')->default('pending'); // pending|active|inactive|rejected
            $t->foreignId('created_by')->constrained('users');
            $t->timestamps();
            $t->index('status');
        });

        Schema::create('club_skills', function (Blueprint $t) {
            $t->foreignId('club_id')->constrained()->cascadeOnDelete();
            $t->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $t->primary(['club_id', 'skill_id']);
        });

        Schema::create('memberships', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('club_id')->constrained()->cascadeOnDelete();
            $t->string('role')->default('member');     // member|secretary|treasurer|vice_president|president
            $t->string('status')->default('pending');  // pending|approved|rejected|cancelled|left|removed
            $t->text('message')->nullable();
            $t->text('decision_reason')->nullable();
            $t->timestamp('requested_at')->useCurrent();
            $t->timestamp('decided_at')->nullable();
            $t->foreignId('decided_by')->nullable()->constrained('users');
            $t->timestamps();
            $t->unique(['user_id', 'club_id']);
            $t->index(['club_id', 'status']);
        });

        Schema::create('announcements', function (Blueprint $t) {
            $t->id();
            $t->foreignId('club_id')->nullable()->constrained()->cascadeOnDelete(); // null = system-wide
            $t->foreignId('posted_by')->constrained('users');
            $t->string('title', 100);
            $t->text('body');
            $t->string('image_url')->nullable();
            $t->timestamps();
        });

        Schema::create('notifications', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('type'); // request_update|announcement|club_approved|system
            $t->string('message');
            $t->unsignedBigInteger('reference_id')->nullable();
            $t->boolean('is_read')->default(false);
            $t->timestamps();
            $t->index(['user_id', 'is_read']);
        });
    }

    public function down(): void
    {
        foreach (['notifications', 'announcements', 'memberships', 'club_skills', 'clubs', 'categories', 'user_skills', 'skills', 'academic_details', 'profiles'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
