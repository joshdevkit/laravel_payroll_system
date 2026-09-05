<?php

namespace App\Services\Payroll;

use App\Models\Employee;
use App\Models\LoanAndCashAdvance;
use App\Models\PayrollRun;
use App\Models\PayrollSetting;
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

        $dailyWorkHours = max(
            1,
            (float) $settings->daily_work_hours
        );

        $hourlyRate = $rate / $dailyWorkHours;

        /*
         * ---------------------------------------------------------
         * ATTENDANCE
         * ---------------------------------------------------------
         */

        $attendance = $this->attendanceCalculator->calculate(
            $employee,
            $settings,
            $start,
            $end,
            $hourlyRate
        );

        /*
         * Basic pay is based on actual paid regular minutes.
         */
        $regularMinutes = array_sum(
            array_map(
                static fn(array $detail): int =>
                (int) ($detail['regularMinutes'] ?? 0),
                $attendance->details()
            )
        );

        $basicPay = ($regularMinutes / 60) * $hourlyRate;

        /*
         * ---------------------------------------------------------
         * LEAVE
         * ---------------------------------------------------------
         */

        $leave = $this->leaveCalculator->calculate(
            $employee,
            $settings,
            $start,
            $end,
            $rate
        );

        /*
         * ---------------------------------------------------------
         * HOLIDAY
         * ---------------------------------------------------------
         */

        $holiday = $this->holidayCalculator->calculate(
            $employee,
            $settings,
            $start,
            $end,
            $rate
        );

        /*
         * ---------------------------------------------------------
         * EARNINGS
         * ---------------------------------------------------------
         *
         * IMPORTANT:
         * Tardy is NOT deducted here.
         *
         * The tardy amount is stored separately in
         * tardy_deduction and will be applied by the frontend
         * when displaying Total Earnings / Net Earnings.
         */

        $totalEarnings =
            $basicPay
            + $attendance->overtimePay()
            + $holiday->pay()
            + $attendance->nightDiffPay()
            + $leave->pay();

        /*
         * ---------------------------------------------------------
         * STATUTORY DEDUCTIONS
         * ---------------------------------------------------------
         */

        $deductions = $this->deductionCalculator->calculate(
            $employee,
            $run,
            $attendance->tardyDeduction()
        );

        /*
         * ---------------------------------------------------------
         * LOAN / CASH ADVANCE DEDUCTIONS
         * ---------------------------------------------------------
         *
         * These are only CALCULATED here.
         *
         * We DO NOT modify the loan balance while calculating
         * a payroll draft.
         *
         * Actual balance reduction should happen when payroll
         * is finalized/posted.
         */

        $loanDeductions = $this->calculateLoanDeductions(
            $employee,
            $run
        );

        $cashAdvance = $loanDeductions['cash_advance'];
        $sssLoan = $loanDeductions['sss_loan'];
        $pagibigLoan = $loanDeductions['pagibig_loan'];

        /*
         * ---------------------------------------------------------
         * TOTAL DEDUCTIONS
         * ---------------------------------------------------------
         *
         * Tardy is NOT included in the total deduction calculation.
         *
         * It is stored separately as tardy_deduction and handled
         * by the frontend presentation.
         */

        $statutoryDeductions = $deductions->total();

        $totalDeductions =
            $statutoryDeductions
            + $cashAdvance
            + $sssLoan
            + $pagibigLoan;

        /*
         * ---------------------------------------------------------
         * NET PAY
         * ---------------------------------------------------------
         *
         * Backend net pay is calculated before tardy.
         *
         * Frontend will subtract tardy when displaying the
         * employee's final net earnings.
         */

        $netPay = $totalEarnings - $totalDeductions;

        /*
         * ---------------------------------------------------------
         * SUMMARY SNAPSHOT
         * ---------------------------------------------------------
         */

        $summary = [
            'presentDays' =>
            $attendance->presentDays(),

            'absentDays' =>
            $attendance->absentDays(),

            'leaveDays' =>
            $leave->totalDays(),

            'paidLeaveDays' =>
            $leave->paidDays(),

            'unpaidLeaveDays' =>
            $leave->unpaidDays(),

            'holidayDays' =>
            $holiday->days(),

            'lateMinutes' =>
            $attendance->lateMinutes(),

            'tardyMinutes' =>
            $attendance->lateMinutes(),

            /*
             * Tardy remains available as a separate value.
             */
            'tardyDeduction' =>
            $this->money(
                $attendance->tardyDeduction()
            ),

            /*
             * Government contributions
             */
            'sssDeduction' =>
            $this->money(
                $deductions->sss()
            ),

            'philhealthDeduction' =>
            $this->money(
                $deductions->philhealth()
            ),

            'pagibigDeduction' =>
            $this->money(
                $deductions->pagibig()
            ),

            /*
             * Loans / cash advance
             */
            'cashAdvance' =>
            $this->money($cashAdvance),

            'sssLoan' =>
            $this->money($sssLoan),

            'pagibigLoan' =>
            $this->money($pagibigLoan),

            /*
             * Attendance
             */
            'undertimeMinutes' =>
            $attendance->undertimeMinutes(),

            'overtimeMinutes' =>
            $attendance->overtimeMinutes(),

            'nightDiffMinutes' =>
            $attendance->nightDiffMinutes(),

            /*
             * Earnings
             */
            'overtimePay' =>
            $this->money(
                $attendance->overtimePay()
            ),

            'nightDiffPay' =>
            $this->money(
                $attendance->nightDiffPay()
            ),

            'holidayPay' =>
            $this->money(
                $holiday->pay()
            ),

            'leavePay' =>
            $this->money(
                $leave->pay()
            ),

            /*
             * Work summary
             */
            'scheduledWorkdays' =>
            $attendance->scheduledWorkdays(),

            'paidDays' =>
            $attendance->presentDays()
                + $leave->paidDays(),

            'regularMinutes' =>
            $regularMinutes,

            'regularHours' =>
            round(
                $regularMinutes / 60,
                2
            ),

            /*
             * Payroll totals
             *
             * These values are BEFORE frontend tardy deduction.
             */
            'totalEarnings' =>
            $this->money($totalEarnings),

            'totalDeductions' =>
            $this->money($totalDeductions),

            'netPay' =>
            $this->money($netPay),

            /*
             * Detailed loan information.
             *
             * Useful for payroll review.
             */
            'loanDeductions' =>
            $loanDeductions['details'],

            /*
             * Schedule details
             */
            'scheduleDetails' =>
            $attendance->details(),
        ];

        /*
         * ---------------------------------------------------------
         * PAYROLL ITEM
         * ---------------------------------------------------------
         */

        $item = [
            'employee_id' =>
            $employee->id,

            'scheduled_workdays' =>
            $attendance->scheduledWorkdays(),

            'present_days' =>
            $attendance->presentDays(),

            'absent_days' =>
            $attendance->absentDays(),

            'leave_days' =>
            $leave->totalDays(),

            'paid_leave_days' =>
            $leave->paidDays(),

            'unpaid_leave_days' =>
            $leave->unpaidDays(),

            'holiday_days' =>
            $holiday->days(),

            'late_minutes' =>
            $attendance->lateMinutes(),

            'undertime_minutes' =>
            $attendance->undertimeMinutes(),

            'overtime_minutes' =>
            $attendance->overtimeMinutes(),

            'night_diff_minutes' =>
            $attendance->nightDiffMinutes(),

            /*
             * Earnings
             */
            'basic_pay' =>
            $this->money($basicPay),

            'overtime_pay' =>
            $this->money(
                $attendance->overtimePay()
            ),

            'holiday_pay' =>
            $this->money(
                $holiday->pay()
            ),

            'night_diff' =>
            $this->money(
                $attendance->nightDiffPay()
            ),

            'leave_pay' =>
            $this->money(
                $leave->pay()
            ),

            'bonus' => 0,

            /*
             * Government deductions
             */
            'sss_deduction' =>
            $this->money(
                $deductions->sss()
            ),

            'philhealth_deduction' =>
            $this->money(
                $deductions->philhealth()
            ),

            'pagibig_deduction' =>
            $this->money(
                $deductions->pagibig()
            ),

            'tax_deduction' =>
            $this->money(
                $deductions->tax()
            ),

            'leave_deduction' =>
            $this->money(
                $deductions->leave()
            ),

            'other_deductions' =>
            $this->money(
                $deductions->other()
            ),

            /*
             * Attendance deduction
             *
             * IMPORTANT:
             * This is stored separately and is NOT included
             * in total_deductions.
             */
            'tardy_deduction' =>
            $this->money(
                $attendance->tardyDeduction()
            ),

            /*
             * Loan / cash advance deductions
             */
            'cash_advance_deduction' =>
            $this->money($cashAdvance),

            'sss_loan_deduction' =>
            $this->money($sssLoan),

            'pagibig_loan_deduction' =>
            $this->money($pagibigLoan),

            /*
             * Totals
             *
             * These are BEFORE frontend tardy deduction.
             */
            'total_earnings' =>
            $this->money($totalEarnings),

            'total_deductions' =>
            $this->money($totalDeductions),

            'net_pay' =>
            $this->money($netPay),

            /*
             * Complete calculation snapshot.
             */
            'calculation_snapshot' =>
            $summary,
        ];

        return new PayrollCalculationResult(
            $item,
            $summary,
            $attendance->details()
        );
    }

    /**
     * Calculate the employee's loan and cash advance deductions
     * for the current payroll run.
     *
     * IMPORTANT:
     * This method does NOT update loan balances.
     *
     * The deduction is only a payroll calculation/snapshot.
     */
    private function calculateLoanDeductions(
        Employee $employee,
        PayrollRun $run
    ): array {
        $cutoff = $this->payrollCutoff($run);

        $payDate = Carbon::parse(
            $run->pay_date
        )->startOfDay();

        $loans = LoanAndCashAdvance::query()
            ->where('employee_id', $employee->id)
            ->where('status', 'active')
            ->whereDate('start_date', '<=', $payDate)
            ->where(function ($query) use ($payDate) {
                $query
                    ->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $payDate);
            })
            ->get();

        $cashAdvance = 0.0;
        $sssLoan = 0.0;
        $pagibigLoan = 0.0;

        $details = [];

        foreach ($loans as $loan) {
            /*
             * Determine whether this loan should be deducted
             * on this payroll cutoff.
             */
            if (
                ! $this->shouldDeductLoan(
                    $loan,
                    $cutoff
                )
            ) {
                continue;
            }

            /*
             * Never deduct more than the remaining balance.
             */
            $amount = min(
                (float) $loan->deduction_amount,
                (float) $loan->balance
            );

            $amount = max(
                0,
                $amount
            );

            if ($amount <= 0) {
                continue;
            }

            switch ($loan->type) {
                case 'cash_advance':
                    $cashAdvance += $amount;
                    break;

                case 'sss':
                    $sssLoan += $amount;
                    break;

                case 'pag_ibig':
                    $pagibigLoan += $amount;
                    break;
            }

            $details[] = [
                'loan_id' =>
                $loan->id,

                'type' =>
                $loan->type,

                'reference_no' =>
                $loan->reference_no,

                'principal_amount' =>
                $this->money(
                    (float) $loan->principal_amount
                ),

                'balance_before' =>
                $this->money(
                    (float) $loan->balance
                ),

                'scheduled_amount' =>
                $this->money(
                    (float) $loan->deduction_amount
                ),

                'deduction_amount' =>
                $this->money($amount),

                'balance_after' =>
                $this->money(
                    max(
                        0,
                        (float) $loan->balance - $amount
                    )
                ),

                'deduction_frequency' =>
                $loan->deduction_frequency,

                'deduction_cutoff' =>
                $loan->deduction_cutoff,
            ];
        }

        return [
            'cash_advance' =>
            $this->money($cashAdvance),

            'sss_loan' =>
            $this->money($sssLoan),

            'pagibig_loan' =>
            $this->money($pagibigLoan),

            'total' =>
            $this->money(
                $cashAdvance
                    + $sssLoan
                    + $pagibigLoan
            ),

            'details' =>
            $details,
        ];
    }

    /**
     * Determine if a loan should be deducted on this cutoff.
     */
    private function shouldDeductLoan(
        LoanAndCashAdvance $loan,
        string $cutoff
    ): bool {
        /*
         * If specifically assigned to this cutoff,
         * allow it.
         */
        if (
            $loan->deduction_cutoff !== 'both'
            && $loan->deduction_cutoff !== $cutoff
        ) {
            return false;
        }

        /*
         * one_time:
         *
         * The loan is deducted on its configured cutoff.
         * The finalized LoanDeduction record should prevent
         * it from being deducted again on future payrolls.
         */
        if ($loan->deduction_frequency === 'one_time') {
            return ! $loan->deductions()
                ->exists();
        }

        /*
         * monthly:
         *
         * Since the employee chooses the cutoff, it is deducted
         * only on the configured cutoff.
         *
         * Example:
         * deduction_cutoff = second
         *
         * August 15  -> no deduction
         * August 30  -> deduction
         */
        if ($loan->deduction_frequency === 'monthly') {
            return true;
        }

        /*
         * per_cutoff:
         *
         * first  -> every first cutoff
         * second -> every second cutoff
         * both   -> every cutoff
         */
        if ($loan->deduction_frequency === 'per_cutoff') {
            return true;
        }

        return false;
    }

    /**
     * Determine the payroll cutoff.
     */
    private function payrollCutoff(
        PayrollRun $run
    ): string {
        return Carbon::parse(
            $run->cutoff_end
        )->day <= 15
            ? 'first'
            : 'second';
    }

    /**
     * Calculate daily rate.
     */
    private function calculateDailyRate(
        Employee $employee,
        PayrollSetting $settings
    ): float {
        if ($employee->rate_type === 'daily') {
            return (float) (
                $employee->daily_rate
                ?? $employee->basic_rate
                ?? 0
            );
        }

        return (float) (
            $employee->basic_rate
            ?? 0
        ) / max(
            1,
            (float) $settings->monthly_daily_rate_divisor
        );
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