<?php

namespace App\Services\Payroll;

use App\Models\PayrollSetting;
use App\Services\Payroll\HolidayCalculationResult;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class HolidayCalculator
{
    public function calculate(
        PayrollSetting $settings,
        string $start,
        string $end,
        float $rate,
        array $presentDates
    ): HolidayCalculationResult {
        $days = 0;
        $pay = 0.0;

        $holidays = DB::table(
            'holidays'
        )
            ->whereBetween(
                'date',
                [$start, $end]
            )
            ->get();

        foreach ($holidays as $holiday) {
            $holidayDate =
                Carbon::parse(
                    $holiday->date
                )->toDateString();

            /*
             * Only employees who actually worked
             * the holiday receive the premium.
             */
            if (
                ! isset(
                    $presentDates[$holidayDate]
                )
            ) {
                continue;
            }

            $days++;

            $multiplier =
                $holiday->type === 'regular'
                ? (float)
                    $settings->holiday_regular_multiplier
                : (float)
                    $settings->holiday_special_multiplier;

            if (
                (bool)
                    $settings->holiday_pay_enabled
            ) {
                $pay +=
                    $rate
                    *
                    max(
                        0,
                        $multiplier - 1
                    );
            }
        }

        return new HolidayCalculationResult(
            days: $days,
            pay: $pay,
        );
    }
}