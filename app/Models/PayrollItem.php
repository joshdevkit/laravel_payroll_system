<?php

namespace App\Models;

use App\Models\Employee;
use App\Models\PayrollRun;
use App\Models\PayrollScheduleDetail;
use App\Models\SssContribution;
use App\Services\Payroll\SssContributionService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class PayrollItem extends Model
{
    use HasFactory;

    protected $table = 'payroll_items';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'payroll_run_id',
        'employee_id',
        'scheduled_workdays',
        'present_days',
        'absent_days',
        'leave_days',
        'paid_leave_days',
        'unpaid_leave_days',
        'holiday_days',
        'late_minutes',
        'tardy_deduction',
        'undertime_minutes',
        'overtime_minutes',
        'night_diff_minutes',
        'basic_pay',
        'overtime_pay',
        'holiday_pay',
        'night_diff',
        'leave_pay',
        'bonus',
        'sss_deduction',
        'philhealth_deduction',
        'pagibig_deduction',
        'tax_deduction',
        'leave_deduction',
        'other_deductions',
        'calculation_snapshot',
    ];

    protected $casts = [
        'scheduled_workdays' => 'decimal:2',
        'present_days' => 'decimal:2',
        'absent_days' => 'decimal:2',
        'leave_days' => 'decimal:2',
        'paid_leave_days' => 'decimal:2',
        'unpaid_leave_days' => 'decimal:2',
        'holiday_days' => 'decimal:2',
        'late_minutes' => 'integer',
        'tardy_deduction' => 'decimal:2',
        'undertime_minutes' => 'integer',
        'overtime_minutes' => 'integer',
        'night_diff_minutes' => 'integer',
        'basic_pay' => 'decimal:2',
        'overtime_pay' => 'decimal:2',
        'holiday_pay' => 'decimal:2',
        'night_diff' => 'decimal:2',
        'leave_pay' => 'decimal:2',
        'bonus' => 'decimal:2',
        'sss_deduction' => 'decimal:2',
        'philhealth_deduction' => 'decimal:2',
        'pagibig_deduction' => 'decimal:2',
        'tax_deduction' => 'decimal:2',
        'leave_deduction' => 'decimal:2',
        'other_deductions' => 'decimal:2',
        'total_earnings' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
        'calculation_snapshot' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (PayrollItem $item) {
            if (! $item->getKey()) {
                $item->setAttribute(
                    $item->getKeyName(),
                    (string) Str::uuid()
                );
            }
        });

        // SSS is an employee/payroll transaction, not part of the
        // contribution-rate master table. Resolve the rate while saving
        // the payroll item, then persist the actual contribution after the
        // payroll item has an ID. This preserves the existing NSD/tardy
        // calculations in PayrollRunService.
        static::saving(function (PayrollItem $item) {
            if (! $item->payroll_run_id || ! $item->employee_id) {
                return;
            }

            $run = PayrollRun::query()->find($item->payroll_run_id);
            $employee = Employee::query()->find($item->employee_id);

            if (! $run || ! $employee) {
                return;
            }

            $sss = app(SssContributionService::class)->calculate(
                $employee,
                $run->cutoff_end
            );

            $item->sss_deduction = $sss['employeeTotal'];
        });

        static::saved(function (PayrollItem $item) {
            if (! $item->payroll_run_id || ! $item->employee_id) {
                return;
            }

            $run = $item->payrollRun()->first();
            $employee = $item->employee()->first();

            if (! $run || ! $employee) {
                return;
            }

            $sss = app(SssContributionService::class)->calculate(
                $employee,
                $run->cutoff_end
            );

            $scheduleId = $sss['contributionTableId'];

            SssContribution::query()->updateOrCreate(
                ['payroll_item_id' => $item->id],
                [
                    'employee_id' => $employee->id,
                    'payroll_run_id' => $run->id,
                    'sss_contribution_table_id' => $scheduleId,
                    'contribution_date' => $run->cutoff_end,
                    'monthly_compensation' => $sss['monthlyCompensation'],
                    'monthly_salary_credit' => $sss['monthlySalaryCredit'],
                    'employee_regular_ss' => $sss['employeeRegularSs'],
                    'employee_mpf' => $sss['employeeMpf'],
                    'employee_total' => $sss['employeeTotal'],
                    'employer_regular_ss' => $sss['employerRegularSs'],
                    'employer_mpf' => $sss['employerMpf'],
                    'employer_ec' => $sss['employerEc'],
                    'employer_total' => $sss['employerTotal'],
                    'effective_from' => $sss['effectiveFrom'],
                    'source' => $sss['source'],
                ]
            );
        });
    }

    public function payrollRun(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function scheduleDetails(): HasMany
    {
        return $this->hasMany(PayrollScheduleDetail::class);
    }

    public function sssContribution(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(SssContribution::class);
    }
}
