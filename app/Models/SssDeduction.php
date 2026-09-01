<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SssDeduction extends Model
{
    use HasFactory;

    protected $table = 'sss_deductions';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'employee_id',
        'amount',
        'deduction_schedule',
        'effective_from',
        'effective_until',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'effective_from' => 'date:Y-m-d',
        'effective_until' => 'date:Y-m-d',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (SssDeduction $deduction) {
            if (! $deduction->getKey()) {
                $deduction->setAttribute($deduction->getKeyName(), (string) Str::uuid());
            }
        });
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
