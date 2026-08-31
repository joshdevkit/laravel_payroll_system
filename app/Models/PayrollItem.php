<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

use App\Models\PayrollRun;
use App\Models\Employee;
use App\Models\PayrollScheduleDetail;

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
        'scheduled_workdays' => 'integer',
        'present_days' => 'integer',
        'absent_days' => 'decimal:2',
        'leave_days' => 'decimal:2',
        'paid_leave_days' => 'decimal:2',
        'unpaid_leave_days' => 'decimal:2',
        'holiday_days' => 'decimal:2',

        'late_minutes' => 'integer',
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
        'calculation_snapshot' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (PayrollItem $item) {
            if (! $item->getKey()) {
                $item->setAttribute($item->getKeyName(), (string) Str::uuid());
            }
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
}
