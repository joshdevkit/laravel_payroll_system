<?php

namespace App\Services\Dashboard;

use App\Models\Holiday;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class HolidayApiService
{
    private const BASE_URL = 'https://date.nager.at/api/v3/PublicHolidays';

    public function forYear(int $year): array
    {
        return Cache::remember(
            "dashboard.ph.holidays.{$year}",
            now()->addHours(12),
            function () use ($year): array {
                try {
                    $response = Http::acceptJson()
                        ->connectTimeout(3)
                        ->timeout(5)
                        ->get(self::BASE_URL . "/{$year}/PH");

                    if (! $response->successful()) {
                        return [];
                    }

                    return collect($response->json())
                        ->map(fn (array $holiday) => [
                            'name' => $holiday['localName']
                                ?? $holiday['name']
                                ?? 'Holiday',
                            'date' => $holiday['date'] ?? null,
                            'type' => $holiday['types'][0] ?? null,
                            'source' => 'national',
                        ])
                        ->filter(fn (array $holiday) => filled($holiday['date']))
                        ->values()
                        ->all();
                } catch (\Throwable) {
                    return [];
                }
            }
        );
    }

    public function localForYear(int $year): array
    {
        return Holiday::query()
            ->whereYear('date', $year)
            ->where('type', 'local')
            ->get(['date', 'name', 'type'])
            ->map(fn (Holiday $holiday) => [
                'name' => $holiday->name,
                'date' => $holiday->date?->format('Y-m-d'),
                'type' => $holiday->type,
                'source' => 'local',
            ])
            ->filter(fn (array $holiday) => filled($holiday['date']))
            ->values()
            ->all();
    }

    public function upcoming(
        int $year,
        string $fromDate,
        int $limit = 5
    ): array {
        return collect()
            ->merge($this->forYear($year))
            ->merge($this->forYear($year + 1))
            ->merge($this->localForYear($year))
            ->merge($this->localForYear($year + 1))
            ->filter(fn (array $holiday) =>
                filled($holiday['date']) &&
                $holiday['date'] >= $fromDate
            )
            ->sortBy('date')
            ->take($limit)
            ->values()
            ->all();
    }
}