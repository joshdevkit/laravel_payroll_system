<?php

namespace App\Services\Payroll;

use App\Models\Employee;
use App\Models\PayrollRun;
use App\Models\PayrollSetting;
use App\Models\SssContribution;
use App\Models\SssContributionTable;
use Carbon\Carbon;

class SssContributionCalculator
{
    /**
     * Calculate the SSS contribution for the payroll cutoff selected by the
     * employee. SSS itself is a monthly contribution; the employee's full
     * monthly share is deducted only on the employee's configured cutoff.
     *
     * When sss_msc_override is set, the normal compensation-bracket lookup is
     * bypassed and the contribution table row for the manually selected MSC
     * is used instead. When it is null, the existing calculation is unchanged.
     */
    public function calculate(
        Employee $employee,
        PayrollRun $run,
        ?PayrollSetting $settings = null,
    ): ?array {
        if (! $employee->sss_no) {
            return null;
        }

        $preferredCutoff = $employee->sss_deduction_cutoff;

        // A cutoff must be explicitly selected before SSS can be deducted.
        if (! in_array($preferredCutoff, ['first', 'second'], true)) {
            return null;
        }

        if ($this->payrollCutoff($run) !== $preferredCutoff) {
            return null;
        }

        $settings ??= PayrollSetting::query()->findOrFail(1);

        $payDate = Carbon::parse($run->pay_date)->toDateString();
        $monthlyCompensation = $this->monthlyCompensation($employee, $settings);
        $mscOverride = $employee->sss_msc_override !== null
            ? (float) $employee->sss_msc_override
            : null;

        $tableQuery = SssContributionTable::query()
            ->whereDate('effective_from', '<=', $payDate)
            ->where(function ($query) use ($payDate) {
                $query
                    ->whereNull('effective_to')
                    ->orWhereDate('effective_to', '>=', $payDate);
            });

        if ($mscOverride !== null) {
            // Manual MSC: select the exact SSS table row for the configured MSC.
            $tableQuery->where('monthly_salary_credit', $mscOverride);
        } else {
            // Existing behavior: determine MSC from actual monthly compensation.
            $tableQuery
                ->where('compensation_min', '<=', $monthlyCompensation)
                ->where(function ($query) use ($monthlyCompensation) {
                    $query
                        ->whereNull('compensation_max')
                        ->orWhere('compensation_max', '>=', $monthlyCompensation);
                });
        }

        $table = $tableQuery
            ->orderByDesc('effective_from')
            ->orderBy('compensation_min')
            ->first();

        if (! $table) {
            return null;
        }

        $monthStart = Carbon::parse($payDate)->startOfMonth()->toDateString();
        $monthEnd = Carbon::parse($payDate)->endOfMonth()->toDateString();

        // If this month's SSS has already been deducted by another payroll
        // run, do not deduct it again. This also protects against rebuilding
        // a draft payroll after another cutoff has already been calculated.
        $alreadyDeducted = (float) SssContribution::query()
            ->where('employee_id', $employee->id)
            ->whereBetween('contribution_date', [$monthStart, $monthEnd])
            ->where('payroll_run_id', '!=', $run->id)
            ->sum('employee_total');

        if ($alreadyDeducted > 0) {
            return null;
        }

        return [
            'sss_contribution_table_id' => $table->id,
            'contribution_date' => $payDate,
            'monthly_compensation' => round($monthlyCompensation, 2),
            'monthly_salary_credit' => (float) $table->monthly_salary_credit,
            'employee_regular_ss' => (float) $table->employee_regular_ss,
            'employee_mpf' => (float) $table->employee_mpf,
            'employee_total' => (float) $table->employee_total,
            'employer_regular_ss' => (float) $table->employer_regular_ss,
            'employer_mpf' => (float) $table->employer_mpf,
            'employer_ec' => (float) $table->employer_ec,
            'employer_total' => (float) $table->employer_total,
            'effective_from' => $table->effective_from->toDateString(),
            'source' => $table->source,
        ];
    }

    private function payrollCutoff(PayrollRun $run): string
    {
        return Carbon::parse($run->cutoff_end)->day <= 15
            ? 'first'
            : 'second';
    }

    private function monthlyCompensation(
        Employee $employee,
        PayrollSetting $settings,
    ): float {
        if ($employee->rate_type === 'daily') {
            return (float) ($employee->daily_rate ?? $employee->basic_rate ?? 0)
                * max(1, (int) $settings->monthly_daily_rate_divisor);
        }

        return (float) ($employee->basic_rate ?? 0);
    }
}
