<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ClubResource;
use App\Models\Club;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class ClubController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'search' => ['sometimes', 'string', 'max:100'],
            'category' => ['sometimes', 'string', 'max:100'],
            'sort' => ['sometimes', 'in:popular,name'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $clubs = Club::query()
            ->with('category')
            ->where('status', 'active')
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $searchTerm = '%'.Str::lower($search).'%';

                $query->where(function (Builder $query) use ($searchTerm): void {
                    $query->whereRaw('LOWER(name) LIKE ?', [$searchTerm])
                        ->orWhereRaw('LOWER(description) LIKE ?', [$searchTerm]);
                });
            })
            ->when($filters['category'] ?? null, function (Builder $query, string $categorySlug): void {
                $query->whereHas('category', function (Builder $categoryQuery) use ($categorySlug): void {
                    $categoryQuery->where('slug', $categorySlug);

                    if (ctype_digit($categorySlug)) {
                        $categoryQuery->orWhere('id', (int) $categorySlug);
                    }
                });
            })
            ->when(($filters['sort'] ?? 'name') === 'popular', fn (Builder $query) => $query->orderByDesc('member_count'))
            ->orderBy('name')
            ->orderBy('id')
            ->paginate($filters['per_page'] ?? 12);

        return ClubResource::collection($clubs);
    }

    /**
     * Display the specified resource.
     */
    public function show(Club $club): ClubResource
    {
        abort_unless($club->status === 'active', 404);

        return new ClubResource($club->loadMissing('category'));
    }

}
