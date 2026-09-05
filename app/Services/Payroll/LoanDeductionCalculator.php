<?php

namespace App\Services\Payroll;

use App\Models\Employee;
use App\Models\LoanAndCashAdvance;
use App\Models\PayrollRun;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class LoanDeductionCalculator
{
    /**
     * Calculate eligible loan deductions for an employee
     * during a payroll run.
     */
    public function calculate(
        Employee $employee,
        PayrollRun $run
    ): array {
        $cutoff = $this->payrollCutoff($run);

        $payDate = Carbon::parse($run->pay_date);

        $loans = LoanAndCashAdvance::query()
            ->where('employee_id', $employee->id)
            ->where('status', 'active')
            ->where('balance', '>', 0)
            ->whereDate('start_date', '<=', $payDate)
            ->where(function ($query) use ($payDate) {
                $query
                    ->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $payDate);
            })
            ->get();
        

        $cashAdvance = 0;
        $sssLoan = 0;
        $pagibigLoan = 0;

        foreach ($loans as $loan) {
            if (! $this->isEligible($loan, $cutoff)) {
                continue;
            }

            $amount = min(
                (float) $loan->deduction_amount,
                (float) $loan->balance
            );

            if ($amount <= 0) {
                continue;
            }

            match ($loan->type) {
                'cash_advance' => $cashAdvance += $amount,
                'sss' => $sssLoan += $amount,
                'pag_ibig' => $pagibigLoan += $amount,
                default => null,
            };
        }

        return [
            'cash_advance_deduction' => $this->money($cashAdvance),
            'sss_loan_deduction' => $this->money($sssLoan),
            'pagibig_loan_deduction' => $this->money($pagibigLoan),
        ];
    }

    private function isEligible(
        LoanAndCashAdvance $loan,
        string $cutoff
    ): bool {
        /*
         * One-time deduction:
         * eligible on the selected cutoff.
         */
        if ($loan->deduction_frequency === 'one_time') {
            return $loan->deduction_cutoff === $cutoff;
        }

        /*
         * Every cutoff.
         */
        if (
            $loan->deduction_frequency === 'per_cutoff'
            && $loan->deduction_cutoff === 'both'
        ) {
            return true;
        }

        /*
         * Specific cutoff.
         */
        if ($loan->deduction_frequency === 'per_cutoff') {
            return $loan->deduction_cutoff === $cutoff;
        }

        /*
         * Monthly deductions.
         *
         * Only deduct on the selected cutoff.
         */
        if ($loan->deduction_frequency === 'monthly') {
            return $loan->deduction_cutoff === $cutoff;
        }

        return false;
    }

    private function payrollCutoff(PayrollRun $run): string
    {
        return Carbon::parse($run->cutoff_end)->day <= 15
            ? 'first'
            : 'second';
    }

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