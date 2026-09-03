<?php

namespace App\Services\Payroll;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\PayrollSetting;
use App\Services\Payroll\HolidayCalculationResult;
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
             * Holiday eligibility is based only on actual attendance.
             *
             * An employee who has a time-in on the holiday is considered
             * to have worked the holiday, even if the attendance is only
             * partial/half-day. The holiday premium is therefore not
             * reduced based on the number of hours worked.
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
             * Regular holidays use the configured regular multiplier.
             * Special non-working holidays and local holidays use the
             * configured special multiplier.
             *
             * The settings determine the actual rates; no holiday rate is
             * hard-coded here. This calculator adds only the holiday
             * premium because basic pay is calculated separately.
             */
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
