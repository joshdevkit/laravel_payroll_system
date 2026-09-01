<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SssContribution extends Model
{
    use HasFactory;

    protected $table = 'sss_contributions';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'employee_id',
        'payroll_run_id',
        'payroll_item_id',
        'sss_contribution_table_id',
        'contribution_date',
        'monthly_compensation',
        'monthly_salary_credit',
        'employee_regular_ss',
        'employee_mpf',
        'employee_total',
        'employer_regular_ss',
        'employer_mpf',
        'employer_ec',
        'employer_total',
        'effective_from',
        'source',
    ];

    protected $casts = [
        'contribution_date' => 'date:Y-m-d',
        'monthly_compensation' => 'decimal:2',
        'monthly_salary_credit' => 'decimal:2',
        'employee_regular_ss' => 'decimal:2',
        'employee_mpf' => 'decimal:2',
        'employee_total' => 'decimal:2',
        'employer_regular_ss' => 'decimal:2',
        'employer_mpf' => 'decimal:2',
        'employer_ec' => 'decimal:2',
        'employer_total' => 'decimal:2',
        'effective_from' => 'date:Y-m-d',
    ];

    protected static function booted(): void
    {
        static::creating(function (SssContribution $contribution) {
            if (! $contribution->getKey()) {
                $contribution->setAttribute(
                    $contribution->getKeyName(),
                    (string) Str::uuid()
                );
            }
        });
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function payrollRun(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class);
    }

    public function payrollItem(): BelongsTo
    {
        return $this->belongsTo(PayrollItem::class);
    }

    public function contributionTable(): BelongsTo
    {
        return $this->belongsTo(
            SssContributionTable::class,
            'sss_contribution_table_id'
        );
    }
}
