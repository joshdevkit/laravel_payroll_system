<?php

namespace App\Services\Payroll;

use App\Models\Employee;
use App\Models\PayrollRun;
use App\Models\PayrollSetting;
use App\Models\SssContribution;
use App\Models\SssContributionTable;
use Carbon\Carbon;

use Illuminate\Support\Facades\DB;
use App\Models\PayrollItem;
use App\Models\PayrollScheduleDetail;
class SssContributionCalculator
{
    /**
     * Calculate the employee's SSS contribution for the payroll month.
     *
     * SSS is a monthly contribution. This implementation applies the
     * employee's full monthly share to the first payroll contribution
     * generated for that employee in the calendar month and prevents a
     * second payroll in the same month from deducting it again.
     */
    public function calculate(
        Employee $employee,
        PayrollRun $run,
        ?PayrollSetting $settings = null,
    ): ?array {
        if (! $employee->sss_no) {
            return null;
        }

        $settings ??= PayrollSetting::query()->findOrFail(1);

        $payDate = Carbon::parse($run->pay_date)->toDateString();
        $monthlyCompensation = $this->monthlyCompensation($employee, $settings);

        $table = SssContributionTable::query()
            ->whereDate('effective_from', '<=', $payDate)
            ->where(function ($query) use ($payDate) {
                $query
                    ->whereNull('effective_to')
                    ->orWhereDate('effective_to', '>=', $payDate);
            })
            ->where('compensation_min', '<=', $monthlyCompensation)
            ->where(function ($query) use ($monthlyCompensation) {
                $query
                    ->whereNull('compensation_max')
                    ->orWhere('compensation_max', '>=', $monthlyCompensation);
            })
            ->orderByDesc('effective_from')
            ->orderBy('compensation_min')
            ->first();

        if (! $table) {
            return null;
        }

        $monthStart = Carbon::parse($payDate)->startOfMonth()->toDateString();
        $monthEnd = Carbon::parse($payDate)->endOfMonth()->toDateString();

        $alreadyDeducted = (float) SssContribution::query()
            ->where('employee_id', $employee->id)
            ->whereBetween('contribution_date', [$monthStart, $monthEnd])
            ->where('payroll_run_id', '!=', $run->id)
            ->sum('employee_total');

        $monthlyEmployeeTotal = (float) $table->employee_total;
        $remaining = max(0, $monthlyEmployeeTotal - $alreadyDeducted);

        return [
            'sss_contribution_table_id' => $table->id,
            'contribution_date' => $payDate,
            'monthly_compensation' => round($monthlyCompensation, 2),
            'monthly_salary_credit' => (float) $table->monthly_salary_credit,
            'employee_regular_ss' => $remaining > 0 ? (float) $table->employee_regular_ss : 0,
            'employee_mpf' => $remaining > 0 ? (float) $table->employee_mpf : 0,
            'employee_total' => round($remaining, 2),
            'employer_regular_ss' => $remaining > 0 ? (float) $table->employer_regular_ss : 0,
            'employer_mpf' => $remaining > 0 ? (float) $table->employer_mpf : 0,
            'employer_ec' => $remaining > 0 ? (float) $table->employer_ec : 0,
            'employer_total' => $remaining > 0 ? (float) $table->employer_total : 0,
            'effective_from' => $table->effective_from->toDateString(),
            'source' => $table->source,
        ];
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
