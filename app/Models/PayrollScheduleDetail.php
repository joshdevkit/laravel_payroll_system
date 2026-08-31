<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PayrollScheduleDetail extends Model
{
    use HasFactory;

    protected $table = 'payroll_schedule_details';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'payroll_item_id',
        'work_date',
        'segment_no',
        'scheduled_start',
        'scheduled_end',
        'actual_in',
        'actual_out',
        'scheduled_minutes',
        'break_minutes',
        'worked_minutes',
        'late_minutes',
        'undertime_minutes',
        'overtime_minutes',
        'night_diff_minutes',
        'is_present',
        'overtime_pay',
        'night_diff_pay',
        'calculation_notes',
    ];

    protected $casts = [
        'work_date' => 'date:Y-m-d',
        'scheduled_start' => 'datetime',
        'scheduled_end' => 'datetime',
        'actual_in' => 'datetime',
        'actual_out' => 'datetime',
        'is_present' => 'boolean',
        'overtime_pay' => 'decimal:2',
        'night_diff_pay' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::creating(function (PayrollScheduleDetail $detail) {
            if (! $detail->getKey()) {
                $detail->setAttribute($detail->getKeyName(), (string) Str::uuid());
            }
        });
    }

    public function payrollItem(): BelongsTo
    {
        return $this->belongsTo(PayrollItem::class);
    }
}
