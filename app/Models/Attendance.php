<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Attendance extends Model
{
    protected $table = 'attendance';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'employee_id',
        'work_date',
        'segment_no',
        'time_in',
        'time_out',
        'status',
        'source',
        'notes',
    ];

    protected $casts = [
        'work_date' => 'date:Y-m-d',
        'time_in' => 'datetime',
        'time_out' => 'datetime',
        'segment_no' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (Attendance $attendance) {
            if (! $attendance->getKey()) {
                $attendance->setAttribute($attendance->getKeyName(), (string) Str::uuid());
            }
        });
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
