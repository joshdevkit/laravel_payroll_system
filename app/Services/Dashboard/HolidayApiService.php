<?php

namespace App\Services\Dashboard;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class HolidayApiService
{
    private const BASE_URL = 'https://date.nager.at/api/v3/PublicHolidays';

    /**
     * Return Philippine public holidays for a year.
     *
     * The external API is treated as optional dashboard data: a failed
     * request should never prevent the payroll application from loading.
     */
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

    public function upcoming(int $year, string $fromDate, int $limit = 5): array
    {
        return collect($this->forYear($year))
            ->filter(fn (array $holiday) => $holiday['date'] >= $fromDate)
            ->sortBy('date')
            ->take($limit)
            ->values()
            ->all();
    }
}
