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
     *
     * IMPORTANT:
     * This calculation is intentionally aligned with the
     * PayrollRegisterTable formulas.
     *
     * Payroll Register Formula:
     *
     * Total Earnings
     *     = Basic Salary - Tardy
     *
     * Total Gross Earning
     *     = Total Earnings
     *     + Overtime Pay
     *     + Holiday Pay
     *     + Night Shift Pay
     *
     * COLA
     *     = COLA Amount × Present Days
     *
     * Total Deductions
     *     = PhilHealth
     *     + Pag-IBIG
     *     + SSS
     *     + SSS Loan
     *     + Pag-IBIG Loan
     *     + Cash Advance
     *     + Tardy
     *
     * Total Net Earnings
     *     = Total Gross Earning
     *     + COLA
     *     - Total Deductions
     */
    public function calculate(
        PayrollRun $run,
        PayrollSetting $settings,
        Employee $employee
    ): PayrollCalculationResult {
        $start = Carbon::parse(
            $run->cutoff_start
        )->toDateString();

        $end = Carbon::parse(
            $run->cutoff_end
        )->toDateString();

        /*
         * ---------------------------------------------------------
         * DAILY / HOURLY RATE
         * ---------------------------------------------------------
         */

        $rate = $this->calculateDailyRate(
            $employee,
            $settings
        );

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
                static fn (array $detail): int =>
                    (int) ($detail['regularMinutes'] ?? 0),
                $attendance->details()
            )
        );

        $basicPay = (
            $regularMinutes / 60
        ) * $hourlyRate;

        /*
         * ---------------------------------------------------------
         * ATTENDANCE VALUES
         * ---------------------------------------------------------
         */

        $presentDays = (float) $attendance->presentDays();

        $tardyDeduction = (float) $attendance->tardyDeduction();

        $overtimePay = (float) $attendance->overtimePay();

        $nightDiffPay = (float) $attendance->nightDiffPay();

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

        $holidayPay = (float) $holiday->pay();

        /*
         * ---------------------------------------------------------
         * COLA
         * ---------------------------------------------------------
         *
         * Only employees marked as COLA eligible receive COLA.
         *
         * Formula:
         *
         *     COLA Amount × Number of Present Days
         *
         * Example:
         *
         *     cola_amount       = 50.00
         *     present_days      = 12
         *
         *     COLA = 50 × 12
         *          = 600.00
         */

        $colaAmount = $employee->is_cola_eligible
            ? (float) ($employee->cola_amount ?? 0)
            : 0.0;

        $cola = $colaAmount * $presentDays;

        /*
         * ---------------------------------------------------------
         * TOTAL EARNINGS
         * ---------------------------------------------------------
         *
         * EXACTLY MATCHES PayrollRegisterTable:
         *
         *     Basic Salary - Tardy
         *
         * IMPORTANT:
         *
         * Overtime, holiday and night differential are NOT
         * included here yet.
         *
         * They are added in Total Gross Earning below.
         */

        $totalEarnings =
            $basicPay
            - $tardyDeduction;

        /*
         * ---------------------------------------------------------
         * TOTAL GROSS EARNING
         * ---------------------------------------------------------
         *
         * EXACTLY MATCHES PayrollRegisterTable:
         *
         *     Total Earnings
         *     + Overtime
         *     + Holiday
         *     + Night Shift
         *
         * COLA is intentionally NOT included here.
         */

        $totalGrossEarning =
            $totalEarnings
            + $overtimePay
            + $holidayPay
            + $nightDiffPay;

        /*
         * ---------------------------------------------------------
         * STATUTORY DEDUCTIONS
         * ---------------------------------------------------------
         */

        $deductions = $this->deductionCalculator->calculate(
            $employee,
            $run,
            $tardyDeduction
        );

        /*
         * ---------------------------------------------------------
         * LOAN / CASH ADVANCE DEDUCTIONS
         * ---------------------------------------------------------
         *
         * These are calculated only.
         *
         * Loan balances are NOT modified here.
         *
         * Actual posting happens when payroll is confirmed.
         */

        $loanDeductions = $this->calculateLoanDeductions(
            $employee,
            $run
        );

        $cashAdvance = (float) $loanDeductions['cash_advance'];

        $sssLoan = (float) $loanDeductions['sss_loan'];

        $pagibigLoan = (float) $loanDeductions['pagibig_loan'];

        /*
         * ---------------------------------------------------------
         * TOTAL DEDUCTIONS
         * ---------------------------------------------------------
         *
         * EXACTLY MATCHES PayrollRegisterTable:
         *
         *     PhilHealth
         *     + Pag-IBIG
         *     + SSS
         *     + SSS Loan
         *     + Pag-IBIG Loan
         *     + Cash Advance
         *     + Tardy
         *
         * Tardy is included here because the register explicitly
         * includes it in Total Deductions.
         */

        $statutoryDeductions =
            (float) $deductions->philhealth()
            + (float) $deductions->pagibig()
            + (float) $deductions->sss();

        $totalDeductions =
            $statutoryDeductions
            + $sssLoan
            + $pagibigLoan
            + $cashAdvance
            + $tardyDeduction;

        /*
         * ---------------------------------------------------------
         * TOTAL NET EARNINGS
         * ---------------------------------------------------------
         *
         * EXACTLY MATCHES PayrollRegisterTable:
         *
         *     Total Gross Earning
         *     + COLA
         *     - Total Deductions
         */

        $netPay =
            $totalGrossEarning
            + $cola
            - $totalDeductions;

        /*
         * ---------------------------------------------------------
         * OTHERS
         * ---------------------------------------------------------
         *
         * Matches PayrollRegisterTable:
         *
         *     COLA
         *     + Overtime
         *     + Holiday
         *     + Night Shift
         *
         * This is a DISPLAY subtotal.
         */

        $others =
            $cola
            + $overtimePay
            + $holidayPay
            + $nightDiffPay;

        /*
         * ---------------------------------------------------------
         * SUMMARY SNAPSHOT
         * ---------------------------------------------------------
         */

        $summary = [
            /*
             * Attendance
             */
            'presentDays' =>
                $attendance->presentDays(),

            'absentDays' =>
                $attendance->absentDays(),

            'lateMinutes' =>
                $attendance->lateMinutes(),

            'tardyMinutes' =>
                $attendance->lateMinutes(),

            'undertimeMinutes' =>
                $attendance->undertimeMinutes(),

            'overtimeMinutes' =>
                $attendance->overtimeMinutes(),

            'nightDiffMinutes' =>
                $attendance->nightDiffMinutes(),

            /*
             * Tardy
             */
            'tardyDeduction' =>
                $this->money(
                    $tardyDeduction
                ),

            /*
             * Leave
             */
            'leaveDays' =>
                $leave->totalDays(),

            'paidLeaveDays' =>
                $leave->paidDays(),

            'unpaidLeaveDays' =>
                $leave->unpaidDays(),

            /*
             * Holiday
             */
            'holidayDays' =>
                $holiday->days(),

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

            'taxDeduction' =>
                $this->money(
                    $deductions->tax()
                ),

            'leaveDeduction' =>
                $this->money(
                    $deductions->leave()
                ),

            'otherDeductions' =>
                $this->money(
                    $deductions->other()
                ),

            /*
             * Loans / Cash Advance
             */
            'cashAdvance' =>
                $this->money(
                    $cashAdvance
                ),

            'sssLoan' =>
                $this->money(
                    $sssLoan
                ),

            'pagibigLoan' =>
                $this->money(
                    $pagibigLoan
                ),

            /*
             * Earnings
             */
            'basicPay' =>
                $this->money(
                    $basicPay
                ),

            'overtimePay' =>
                $this->money(
                    $overtimePay
                ),

            'holidayPay' =>
                $this->money(
                    $holidayPay
                ),

            'nightDiffPay' =>
                $this->money(
                    $nightDiffPay
                ),

            'leavePay' =>
                $this->money(
                    $leave->pay()
                ),

            /*
             * COLA
             */
            'isColaEligible' =>
                (bool) $employee->is_cola_eligible,

            'colaAmount' =>
                $this->money(
                    $colaAmount
                ),

            'colaDays' =>
                $this->money(
                    $presentDays
                ),

            'cola' =>
                $this->money(
                    $cola
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
             * Payroll Register calculations
             *
             * These MUST match PayrollRegisterTable.
             */

            'totalEarnings' =>
                $this->money(
                    $totalEarnings
                ),

            'totalGrossEarning' =>
                $this->money(
                    $totalGrossEarning
                ),

            'totalDeductions' =>
                $this->money(
                    $totalDeductions
                ),

            'others' =>
                $this->money(
                    $others
                ),

            'netPay' =>
                $this->money(
                    $netPay
                ),

            /*
             * Detailed loan information.
             */
            'loanDeductions' =>
                $loanDeductions['details'],

            /*
             * Schedule details.
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

            /*
             * Work summary
             */
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
                $this->money(
                    $basicPay
                ),

            'overtime_pay' =>
                $this->money(
                    $overtimePay
                ),

            'holiday_pay' =>
                $this->money(
                    $holidayPay
                ),

            'night_diff' =>
                $this->money(
                    $nightDiffPay
                ),

            'leave_pay' =>
                $this->money(
                    $leave->pay()
                ),

            'bonus' =>
                0,

            /*
             * COLA
             *
             * This requires the cola column to exist
             * in payroll_items.
             */

            'cola' =>
                $this->money(
                    $cola
                ),

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
             * Tardy
             */
            'tardy_deduction' =>
                $this->money(
                    $tardyDeduction
                ),

            /*
             * Loan / Cash Advance deductions
             */
            'cash_advance_deduction' =>
                $this->money(
                    $cashAdvance
                ),

            'sss_loan_deduction' =>
                $this->money(
                    $sssLoan
                ),

            'pagibig_loan_deduction' =>
                $this->money(
                    $pagibigLoan
                ),

            /*
             * Payroll Register totals
             */
            'total_earnings' =>
                $this->money(
                    $totalEarnings
                ),

            'total_deductions' =>
                $this->money(
                    $totalDeductions
                ),

            'net_pay' =>
                $this->money(
                    $netPay
                ),

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
            ->where(
                'employee_id',
                $employee->id
            )
            ->where(
                'status',
                'active'
            )
            ->whereDate(
                'start_date',
                '<=',
                $payDate
            )
            ->where(function ($query) use ($payDate) {
                $query
                    ->whereNull('end_date')
                    ->orWhereDate(
                        'end_date',
                        '>=',
                        $payDate
                    );
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
                    $this->money(
                        $amount
                    ),

                'balance_after' =>
                    $this->money(
                        max(
                            0,
                            (float) $loan->balance
                            - $amount
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
                $this->money(
                    $cashAdvance
                ),

            'sss_loan' =>
                $this->money(
                    $sssLoan
                ),

            'pagibig_loan' =>
                $this->money(
                    $pagibigLoan
                ),

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
         * One-time loan.
         */
        if (
            $loan->deduction_frequency === 'one_time'
        ) {
            return ! $loan->deductions()
                ->exists();
        }

        /*
         * Monthly loan.
         */
        if (
            $loan->deduction_frequency === 'monthly'
        ) {
            return true;
        }

        /*
         * Per-cutoff loan.
         */
        if (
            $loan->deduction_frequency === 'per_cutoff'
        ) {
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
        if (
            $employee->rate_type === 'daily'
        ) {
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
    private function money(
        float $value
    ): float {
        return (float) number_format(
            $value,
            2,
            '.',
            ''
        );
    }
}