<?php

namespace App\Models;

use App\Models\Employee;
use App\Models\LoanDeduction;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Support\Str;
class LoanAndCashAdvance extends Model
{
    use HasUuids;

    protected $table = 'loan_and_cash_advances';
    public $incrementing = false;

    protected $keyType = 'string';    
    protected $fillable = [
        'employee_id',
        'type',
        'reference_no',
        'principal_amount',
        'balance',
        'deduction_amount',
        'deduction_frequency',
        'deduction_cutoff',
        'start_date',
        'end_date',
        'status',
        'date',
        'notes',
    ];

    protected $casts = [
        'principal_amount' => 'decimal:2',
        'balance' => 'decimal:2',
        'deduction_amount' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'date' => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function deductions(): HasMany
    {
        return $this->hasMany(LoanDeduction::class);
    }

    protected static function booted(): void
    {
        static::creating(
            function (LoanAndCashAdvance $loan) {
                if (! $loan->getKey()) {
                    $loan->setAttribute(
                        $loan->getKeyName(),
                        (string) Str::uuid()
                    );
                }
            }
        );
    }
}