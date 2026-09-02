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

        $sssContribution = $this->sssContributionCalculator->calculate(
            $employee,
            $run,
        );

        $sss = (float) ($sssContribution['employee_total'] ?? 0);

        // These remain zero until their own contribution rules are implemented.
        $philhealth = 0.0;
        $pagibig = 0.0;
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
}
