<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

use App\Models\EmployeeSchedule;
use App\Models\Attendance;
use App\Models\PayrollItem;
use App\Models\Category;
use App\Models\SssDeduction;

use App\Models\SssContribution;
use App\Models\LoanAndCashAdvance;
use App\Models\LoanDeduction;

use App\Models\Branch;
class Employee extends Model
{
    use HasFactory;

    protected $table = 'employees';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'employee_id',
        'branch_id',
        'category_id',
        'full_name',
        'employment_type',
        'rate_type',
        'basic_rate',
        'daily_rate',
        'sss_no',
        'sss_deduction_cutoff',
        'sss_msc_override',
        'philhealth_no',
        'philhealth_deduction_cutoff',
        'pagibig_no',
        'pagibig_deduction_cutoff',
        'tin',
        'date_hired',
    ];

    protected $casts = [
        'basic_rate' => 'decimal:2',
        'daily_rate' => 'decimal:2',
        'sss_msc_override' => 'decimal:2',
        'date_hired' => 'date:Y-m-d',
    ];

    protected static function booted(): void
    {
        static::creating(function (Employee $employee) {
            if (! $employee->getKey()) {
                $employee->setAttribute($employee->getKeyName(), (string) Str::uuid());
            }
        });
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(EmployeeSchedule::class);
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function payrollItems(): HasMany
    {
        return $this->hasMany(PayrollItem::class);
    }

    public function sssDeductions(): HasMany
    {
        return $this->hasMany(SssDeduction::class);
    }

    public function sssContributions(): HasMany
    {
        return $this->hasMany(SssContribution::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function loansAndCashAdvances(): HasMany
    {
        return $this->hasMany(LoanAndCashAdvance::class);
    }

    public function loanDeductions(): HasMany
    {
        return $this->hasMany(LoanDeduction::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
