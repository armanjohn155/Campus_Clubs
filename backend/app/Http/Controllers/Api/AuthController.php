<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\AcademicDetail;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    public function register(Request $r)
    {
        $data = $r->validate([
            'student_id' => ['required', 'regex:/^\d{4}-\d{5}$/', 'unique:users,student_id'],
            'full_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->letters()->numbers()],
        ], ['student_id.regex' => 'Use the format 2024-12345.']);

        $user = DB::transaction(function () use ($data) {
            $user = User::create([
                'student_id' => $data['student_id'],
                'name' => $data['full_name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => 'USER',
            ]);
            Profile::create(['user_id' => $user->id, 'full_name' => $data['full_name']]);
            AcademicDetail::create(['user_id' => $user->id]);
            return $user;
        });

        return response()->json([
            'token' => $user->createToken('web')->plainTextToken,
            'user' => new UserResource($user),
        ], 201);
    }

    public function login(Request $r)
    {
        $data = $r->validate(['identifier' => 'required|string', 'password' => 'required|string']);

        $user = User::query()
            ->where(fn ($query) => $query
                ->where('email', $data['identifier'])
                ->orWhere('student_id', $data['identifier']))
            ->first();
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['identifier' => ['Student ID, email, or password is incorrect.']]);
        }
        abort_unless($user->is_active, 403, 'This account has been disabled. Contact the administrator.');

        return [
            'token' => $user->createToken('web')->plainTextToken,
            'user' => new UserResource($user),
        ];
    }

    public function me(Request $r)
    {
        return (new UserResource($r->user()))->resolve();
    }

    public function logout(Request $r)
    {
        $r->user()->currentAccessToken()->delete();
        return response()->noContent();
    }

    public function forgotPassword(Request $r)
    {
        $r->validate(['email' => 'required|email']);
        try { Password::sendResetLink($r->only('email')); } catch (\Throwable $e) { report($e); }
        // Same answer whether or not the email exists.
        return ['message' => 'If that email has an account, a reset link is on its way.'];
    }

    public function resetPassword(Request $r)
    {
        $data = $r->validate([
            'token' => 'required', 'email' => 'required|email',
            'password' => ['required', 'confirmed', PasswordRule::min(8)->letters()->numbers()],
        ]);
        $status = Password::reset($data, function (User $u, string $password) {
            $u->forceFill(['password' => $password])->save();
            $u->tokens()->delete();
        });
        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }
        return ['message' => 'Password updated. You can log in now.'];
    }
}
