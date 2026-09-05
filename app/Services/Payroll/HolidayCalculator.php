<?php

namespace App\Services\Payroll;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\PayrollSetting;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class HolidayCalculator
{
    public function calculate(
        Employee $employee,
        PayrollSetting $settings,
        string $start,
        string $end,
        float $rate
    ): HolidayCalculationResult {
        $days = 0;
        $pay = 0.0;

        /*
         * Get all holidays inside the payroll cutoff.
         */
        $holidays = DB::table('holidays')
            ->whereBetween('date', [$start, $end])
            ->get();

        foreach ($holidays as $holiday) {
            $holidayDate = Carbon::parse(
                $holiday->date
            )->toDateString();

            /*
             * ======================================================
             * HOLIDAY ATTENDANCE
             * ======================================================
             *
             * The employee qualifies for the holiday premium if
             * they have a PRESENT attendance record with a time_in
             * on the exact holiday date.
             *
             * We intentionally do NOT calculate the holiday premium
             * based on:
             *
             * - total hours worked
             * - late minutes
             * - undertime
             * - overtime
             * - break minutes
             *
             * Example:
             *
             * Time in  : 07:50 AM
             * Time out : 05:02 PM
             *
             * The employee has time_in on the holiday, therefore
             * they qualify for the holiday premium.
             */
            $workedHoliday = Attendance::query()
                ->where('employee_id', $employee->id)
                ->whereDate('work_date', $holidayDate)
                ->where('status', 'present')
                ->whereNotNull('time_in')
                ->exists();

            if (! $workedHoliday) {
                continue;
            }

            $days++;

            /*
             * ======================================================
             * HOLIDAY MULTIPLIER
             * ======================================================
             *
             * Regular holiday:
             *     2.0
             *
             * Special non-working holiday:
             *     1.3
             *
             * The normal/basic daily pay is already calculated
             * separately by PayrollCalculator.
             *
             * Therefore we only calculate the ADDITIONAL holiday
             * premium here.
             *
             * Regular:
             *
             *     ₱500 × (2.0 - 1.0)
             *     = ₱500 additional
             *
             * Special:
             *
             *     ₱500 × (1.3 - 1.0)
             *     = ₱150 additional
             */
            $multiplier = $this->getHolidayMultiplier(
                $holiday->type,
                $settings
            );

            if (! (bool) $settings->holiday_pay_enabled) {
                continue;
            }

            /*
             * Only the premium portion is returned.
             */
            $premiumMultiplier = max(
                0,
                $multiplier - 1
            );

            $pay +=
                $rate
                * $premiumMultiplier;
        }

        return new HolidayCalculationResult(
            days: $days,
            pay: $this->money($pay),
        );
    }

    /**
     * Get the configured multiplier for the holiday type.
     */
    private function getHolidayMultiplier(
        string $holidayType,
        PayrollSetting $settings
    ): float {
        return $holidayType === 'regular'
            ? (float) $settings->holiday_regular_multiplier
            : (float) $settings->holiday_special_multiplier;
    }

    /**
     * Normalize money values to 2 decimal places.
     */
    private function money(float $value): float
    {
        return (float) number_format(
            $value,
            2,
            '.',
            ''
        );
    }
}