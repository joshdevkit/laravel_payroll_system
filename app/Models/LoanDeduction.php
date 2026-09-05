<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

use App\Models\LoanAndCashAdvance;
use App\Models\Employee;
use App\Models\PayrollRun;
use App\Models\PayrollItem;
class LoanDeduction extends Model
{
    use HasFactory;

    protected $table = 'loan_deductions';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'loan_and_cash_advance_id',
        'employee_id',
        'payroll_run_id',
        'payroll_item_id',
        'amount',
        'balance_before',
        'balance_after',
        'deduction_date',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'deduction_date' => 'date',
    ];

    protected static function booted(): void
    {
        static::creating(function (LoanDeduction $deduction) {
            if (! $deduction->getKey()) {
                $deduction->setAttribute(
                    $deduction->getKeyName(),
                    (string) Str::uuid()
                );
            }
        });
    }

    public function loanAndCashAdvance(): BelongsTo
    {
        return $this->belongsTo(
            LoanAndCashAdvance::class,
            'loan_and_cash_advance_id'
        );
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(
            Employee::class,
            'employee_id'
        );
    }

    public function payrollRun(): BelongsTo
    {
        return $this->belongsTo(
            PayrollRun::class,
            'payroll_run_id'
        );
    }

    public function payrollItem(): BelongsTo
    {
        return $this->belongsTo(
            PayrollItem::class,
            'payroll_item_id'
        );
    }
}