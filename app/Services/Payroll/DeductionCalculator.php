<?php

namespace App\Services\Payroll;

use App\Models\Employee;
use App\Models\PayrollRun;
use App\Services\Payroll\DeductionCalculationResult;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DeductionCalculator
{
    public function calculate(
        Employee $employee,
        PayrollRun $run,
        float $tardyDeduction
    ): DeductionCalculationResult {
        $payDate =
            Carbon::parse(
                $run->pay_date
            )->toDateString();

        /*
         * ==========================================
         * SSS
         * ==========================================
         *
         * Priority:
         *
         * 1. deduction_date = payroll pay date
         *
         * 2. deduction_date IS NULL and the
         *    payroll pay date is inside the
         *    effective date range.
         */
        $sss = (float) DB::table(
            'sss_deductions'
        )
            ->where(
                'employee_id',
                $employee->id
            )
            ->where(
                'is_active',
                true
            )
            ->where(function ($query) use ($payDate) {
                $query
                    ->whereDate(
                        'deduction_date',
                        $payDate
                    )
                    ->orWhere(function ($query) use (
                        $payDate
                    ) {
                        $query
                            ->whereNull(
                                'deduction_date'
                            )
                            ->whereDate(
                                'effective_from',
                                '<=',
                                $payDate
                            )
                            ->where(function (
                                $query
                            ) use ($payDate) {
                                $query
                                    ->whereNull(
                                        'effective_until'
                                    )
                                    ->orWhereDate(
                                        'effective_until',
                                        '>=',
                                        $payDate
                                    );
                            });
                    });
            })
            ->sum('amount');

        /*
         * ==========================================
         * OTHER DEDUCTIONS
         * ==========================================
         *
         * These remain zero exactly as in your
         * current service until their own rules
         * are implemented.
         */
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
        );
    }
}