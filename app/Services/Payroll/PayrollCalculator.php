<?php

namespace App\Services\Payroll;

use App\Models\Employee;
use App\Models\PayrollRun;
use App\Models\PayrollSetting;
use App\Services\Payroll\DeductionCalculator;
use Carbon\Carbon;

class PayrollCalculator
{
    public function __construct(
        private AttendanceCalculator $attendanceCalculator,
        private LeaveCalculator $leaveCalculator,
        private HolidayCalculator $holidayCalculator,
        private DeductionCalculator $deductionCalculator,
    ) {}

    /**
     * Calculate the complete payroll for one employee.
     */
    public function calculate(
        PayrollRun $run,
        PayrollSetting $settings,
        Employee $employee
    ): PayrollCalculationResult {
        $start = Carbon::parse($run->cutoff_start)->toDateString();
        $end = Carbon::parse($run->cutoff_end)->toDateString();

        $rate = $this->calculateDailyRate($employee, $settings);

        $dailyWorkHours = max(1, (float) $settings->daily_work_hours);
        $hourlyRate = $rate / $dailyWorkHours;

        $attendance = $this->attendanceCalculator->calculate(
            $employee,
            $settings,
            $start,
            $end,
            $hourlyRate
        );

        /*
         * Basic pay is based on actual paid regular minutes, not merely
         * the number of present segments. This preserves full-day pay for
         * a complete shift while correctly prorating half-day/undertime
         * attendance.
         *
         * Example:
         * 8 scheduled hours × ₱500/day = ₱500
         * 4 worked regular hours × ₱62.50/hour = ₱250
         */
        $regularMinutes = array_sum(array_map(
            static fn (array $detail): int => (int) ($detail['regularMinutes'] ?? 0),
            $attendance->details()
        ));

        $basicPay = ($regularMinutes / 60) * $hourlyRate;

        $leave = $this->leaveCalculator->calculate(
            $employee,
            $settings,
            $start,
            $end,
            $rate
        );

        $holiday = $this->holidayCalculator->calculate(
            $employee,
            $settings,
            $start,
            $end,
            $rate
        );

        $totalEarnings =
            $basicPay
            + $attendance->overtimePay()
            + $holiday->pay()
            + $attendance->nightDiffPay()
            + $leave->pay();

        $deductions = $this->deductionCalculator->calculate(
            $employee,
            $run,
            $attendance->tardyDeduction()
        );

        $totalDeductions = $deductions->total();
        $netPay = $totalEarnings - $totalDeductions;

        $summary = [
            'presentDays' => $attendance->presentDays(),
            'absentDays' => $attendance->absentDays(),
            'leaveDays' => $leave->totalDays(),
            'paidLeaveDays' => $leave->paidDays(),
            'unpaidLeaveDays' => $leave->unpaidDays(),
            'holidayDays' => $holiday->days(),
            'lateMinutes' => $attendance->lateMinutes(),
            'tardyMinutes' => $attendance->lateMinutes(),
            'tardyDeduction' => $this->money($attendance->tardyDeduction()),
            'sssDeduction' => $this->money($deductions->sss()),
            'undertimeMinutes' => $attendance->undertimeMinutes(),
            'overtimeMinutes' => $attendance->overtimeMinutes(),
            'nightDiffMinutes' => $attendance->nightDiffMinutes(),
            'overtimePay' => $this->money($attendance->overtimePay()),
            'nightDiffPay' => $this->money($attendance->nightDiffPay()),
            'holidayPay' => $this->money($holiday->pay()),
            'leavePay' => $this->money($leave->pay()),
            'scheduledWorkdays' => $attendance->scheduledWorkdays(),
            'paidDays' => $attendance->presentDays() + $leave->paidDays(),
            'regularMinutes' => $regularMinutes,
            'regularHours' => round($regularMinutes / 60, 2),
            'totalEarnings' => $this->money($totalEarnings),
            'totalDeductions' => $this->money($totalDeductions),
            'netPay' => $this->money($netPay),
            'scheduleDetails' => $attendance->details(),
        ];

        $item = [
            'employee_id' => $employee->id,
            'scheduled_workdays' => $attendance->scheduledWorkdays(),
            'present_days' => $attendance->presentDays(),
            'absent_days' => $attendance->absentDays(),
            'leave_days' => $leave->totalDays(),
            'paid_leave_days' => $leave->paidDays(),
            'unpaid_leave_days' => $leave->unpaidDays(),
            'holiday_days' => $holiday->days(),
            'late_minutes' => $attendance->lateMinutes(),
            'undertime_minutes' => $attendance->undertimeMinutes(),
            'overtime_minutes' => $attendance->overtimeMinutes(),
            'night_diff_minutes' => $attendance->nightDiffMinutes(),
            'basic_pay' => $this->money($basicPay),
            'overtime_pay' => $this->money($attendance->overtimePay()),
            'holiday_pay' => $this->money($holiday->pay()),
            'night_diff' => $this->money($attendance->nightDiffPay()),
            'leave_pay' => $this->money($leave->pay()),
            'bonus' => 0,
            'sss_deduction' => $this->money($deductions->sss()),
            'philhealth_deduction' => $this->money($deductions->philhealth()),
            'pagibig_deduction' => $this->money($deductions->pagibig()),
            'tax_deduction' => $this->money($deductions->tax()),
            'leave_deduction' => $this->money($deductions->leave()),
            'other_deductions' => $this->money($deductions->other()),
            'tardy_deduction' => $this->money($attendance->tardyDeduction()),
            'total_earnings' => $this->money($totalEarnings),
            'total_deductions' => $this->money($totalDeductions),
            'net_pay' => $this->money($netPay),
            'calculation_snapshot' => $summary,
        ];

        return new PayrollCalculationResult(
            $item,
            $summary,
            $attendance->details()
        );
    }

    private function calculateDailyRate(
        Employee $employee,
        PayrollSetting $settings
    ): float {
        if ($employee->rate_type === 'daily') {
            return (float) ($employee->daily_rate ?? $employee->basic_rate ?? 0);
        }

        return (float) ($employee->basic_rate ?? 0) / max(
            1,
            (float) $settings->monthly_daily_rate_divisor
        );
    }

    private function money(float $value): float
    {
        return (float) number_format($value, 2, '.', '');
    }
}
