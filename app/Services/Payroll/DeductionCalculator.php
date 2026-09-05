<?php

namespace App\Services\Payroll;

use App\Models\Employee;
use App\Models\PayrollRun;
use Carbon\Carbon;

class DeductionCalculator
{
    public function __construct(
        private SssContributionCalculator $sssContributionCalculator,
    ) {
    }

    public function calculate(
        Employee $employee,
        PayrollRun $run,
        float $tardyDeduction
    ): DeductionCalculationResult {
        $payDate = Carbon::parse($run->pay_date)->toDateString();
        $payrollCutoff = $this->payrollCutoff($run);

        $sssContribution = $this->sssContributionCalculator->calculate(
            $employee,
            $run,
        );

        $sss = (float) ($sssContribution['employee_total'] ?? 0);

        /*
         * Government contribution minimum salary credit.
         *
         * PhilHealth:
         * ₱10,000 × 2.5% = ₱250 employee contribution.
         *
         * Pag-IBIG:
         * ₱10,000 × 2% = ₱200 employee contribution.
         *
         * Both contributions are monthly deductions and are applied
         * only on the employee's selected payroll cutoff.
         */
        $minimumSalaryCredit = 10000.00;

        $philhealth = 0.0;
        $pagibig = 0.0;

        if (
            ! empty($employee->philhealth_no)
            && $employee->philhealth_deduction_cutoff === $payrollCutoff
        ) {
            $philhealth = $minimumSalaryCredit * 0.025;
        }

        if (
            ! empty($employee->pagibig_no)
            && $employee->pagibig_deduction_cutoff === $payrollCutoff
        ) {
            $pagibig = $minimumSalaryCredit * 0.02;
        }

        $tax = 0.0;
        $leave = 0.0;
        $other = 0.0;

        $total =
            $tardyDeduction
            + $sss
            + $philhealth
            + $pagibig
            + $tax
            + $leave
            + $other;

        return new DeductionCalculationResult(
            tardy: $tardyDeduction,
            sss: $sss,
            philhealth: $philhealth,
            pagibig: $pagibig,
            tax: $tax,
            leave: $leave,
            other: $other,
            total: $total,
            sssContribution: $sssContribution,
        );
    }

    private function payrollCutoff(PayrollRun $run): string
    {
        return Carbon::parse($run->cutoff_end)->day <= 15
            ? 'first'
            : 'second';
    }
}