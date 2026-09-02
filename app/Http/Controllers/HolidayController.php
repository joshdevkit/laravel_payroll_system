<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Response;

class HolidayController extends Controller
{
    private const REGULAR = [
        "New Year's Day", 'Maundy Thursday', 'Good Friday',
        'Araw ng Kagitingan', 'Day of Valor', 'Labor Day',
        'Independence Day', 'National Heroes Day', 'Bonifacio Day',
        'Christmas Day', 'Rizal Day', "Eid'l Fitr", 'Eid al-Fitr',
        "Eid'l Adha", 'Eid al-Adha',
    ];

    private const SPECIAL = [
        'Ninoy Aquino Day', "All Saints' Day", "All Souls' Day",
        'Feast of the Immaculate Conception of Mary',
        'Feast of the Immaculate Conception', 'Last Day of the Year',
        'Chinese New Year', 'Black Saturday', 'Christmas Eve',
    ];

    public function index(): Response
    {
        return inertia('Holidays/Index', [
            'holidays' => Holiday::query()
                ->orderBy('date')
                ->get(['id', 'date', 'name', 'type', 'notes']),
            'currentYear' => now()->year,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Holiday::create($this->validated($request));

        return back()->with('success', 'Holiday added.');
    }

    public function update(Request $request, Holiday $holiday): RedirectResponse
    {
        $holiday->update($this->validated($request));

        return back()->with('success', 'Holiday updated.');
    }

    public function destroy(Holiday $holiday): RedirectResponse
    {
        $holiday->delete();

        return back()->with('success', 'Holiday deleted.');
    }

    public function sync(Request $request): RedirectResponse
    {
        $year = (int) $request->validate([
            'year' => ['required', 'integer', 'between:1900,2100'],
        ])['year'];

        $response = Http::acceptJson()
            ->timeout(15)
            ->get("https://date.nager.at/api/v3/PublicHolidays/{$year}/PH");

        if ($response->failed()) {
            return back()->with('error', "Holiday calendar API request failed ({$response->status()}).");
        }

        $holidays = collect($response->json())
            ->filter(fn (array $holiday) => ($holiday['global'] ?? true) !== false)
            ->map(function (array $holiday) use ($year) {
                $type = $this->classify($holiday['localName'] ?? '', $holiday['name'] ?? '');

                return $type ? [
                    'date' => $holiday['date'],
                    'name' => $holiday['name'],
                    'type' => $type,
                    'notes' => "Synchronized from live Philippine holiday API for {$year}.",
                ] : null;
            })
            ->filter()
            ->values();

        if ($holidays->isEmpty()) {
            return back()->with('error', "No supported Philippine holidays were returned for {$year}.");
        }

        foreach ($holidays as $holiday) {
            Holiday::updateOrCreate(
                ['date' => $holiday['date']],
                [
                    'name' => $holiday['name'],
                    'type' => $holiday['type'],
                    'notes' => $holiday['notes'],
                ],
            );
        }

        return back()->with('success', "{$holidays->count()} Philippine holidays for {$year} were synchronized from the live holiday API.");
    }

    private function classify(string $localName, string $name): ?string
    {
        if (in_array($localName, self::REGULAR, true) || in_array($name, self::REGULAR, true)) {
            return 'regular';
        }

        if (in_array($localName, self::SPECIAL, true) || in_array($name, self::SPECIAL, true)) {
            return 'special_non_working';
        }

        return null;
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'date' => ['required', 'date'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:regular,special_non_working,local'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);
    }
}
