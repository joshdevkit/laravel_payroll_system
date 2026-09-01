<?php

namespace App\Services\Payroll;

use App\Models\Employee;
use App\Models\PayrollSetting;
use App\Models\SssContributionTable;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class SssContributionService
{
    /**
     * Calculate the employee's monthly SSS contribution using the
     * contribution schedule effective on the supplied payroll date.
     *
     * For employed members, SSS uses the employee's monthly compensation
     * to determine the Monthly Salary Credit (MSC). The 2025 business
     * employer/employee schedule has a 5% employee share and a 10% employer
     * share, with the MPF portion applying above a P20,000 MSC.
     */
    public function calculate(
        Employee $employee,
        CarbonInterface|string $asOfDate
    ): array {
        $date = $asOfDate instanceof CarbonInterface
            ? $asOfDate->copy()
            : Carbon::parse($asOfDate);

        $monthlyCompensation = $this->monthlyCompensation($employee);

        $schedule = SssContributionTable::query()
            ->whereDate('effective_from', '<=', $date->toDateString())
            ->where(function ($query) use ($date) {
                $query
                    ->whereNull('effective_to')
                    ->orWhereDate(
                        'effective_to',
                        '>=',
                        $date->toDateString()
                    );
            })
            ->where(
                'compensation_min',
                '<=',
                $monthlyCompensation
            )
            ->where(function ($query) use ($monthlyCompensation) {
                $query
                    ->whereNull('compensation_max')
                    ->orWhere(
                        'compensation_max',
                        '>=',
                        $monthlyCompensation
                    );
            })
            ->orderByDesc('effective_from')
            ->first();

        if (! $schedule) {
            return [
                'monthlyCompensation' => $this->money($monthlyCompensation),
                'monthlySalaryCredit' => 0.0,
                'employeeRegularSs' => 0.0,
                'employeeMpf' => 0.0,
                'employeeTotal' => 0.0,
                'employerRegularSs' => 0.0,
                'employerMpf' => 0.0,
                'employerEc' => 0.0,
                'employerTotal' => 0.0,
                'effectiveFrom' => null,
                'source' => null,
            ];
        }

        return [
            'monthlyCompensation' => $this->money($monthlyCompensation),
            'monthlySalaryCredit' => $this->money(
                (float) $schedule->monthly_salary_credit
            ),
            'employeeRegularSs' => $this->money(
                (float) $schedule->employee_regular_ss
            ),
            'employeeMpf' => $this->money(
                (float) $schedule->employee_mpf
            ),
            'employeeTotal' => $this->money(
                (float) $schedule->employee_total
            ),
            'employerRegularSs' => $this->money(
                (float) $schedule->employer_regular_ss
            ),
            'employerMpf' => $this->money(
                (float) $schedule->employer_mpf
            ),
            'employerEc' => $this->money(
                (float) $schedule->employer_ec
            ),
            'employerTotal' => $this->money(
                (float) $schedule->employer_total
            ),
            'effectiveFrom' => $schedule->effective_from?->toDateString(),
            'source' => $schedule->source,
        ];
    }

    private function monthlyCompensation(Employee $employee): float
    {
        if ($employee->rate_type === 'daily') {
            $dailyRate = (float) (
                $employee->daily_rate
                ?? $employee->basic_rate
                ?? 0
            );

            $divisor = (float) (
                PayrollSetting::query()
                    ->find(1)
                    ?->monthly_daily_rate_divisor
                ?? 26
            );

            return max(0, $dailyRate * max(1, $divisor));
        }

        return max(
            0,
            (float) ($employee->basic_rate ?? 0)
        );
    }

    private function money(float $value): float
    {
        return round($value, 2);
    }
}
