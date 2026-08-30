<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

use App\Models\Employee;
class EmployeeSchedule extends Model
{
    protected $table = 'employee_schedules';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'employee_id',
        'work_date',
        'segment_no',
        'start_time',
        'end_time',
        'break_minutes',
        'is_working_day',
        'notes',
    ];

    protected $casts = [
        'work_date' => 'date:Y-m-d',
        'segment_no' => 'integer',
        'break_minutes' => 'integer',
        'is_working_day' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (EmployeeSchedule $schedule) {
            if (! $schedule->getKey()) {
                $schedule->setAttribute($schedule->getKeyName(), (string) Str::uuid());
            }
        });
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
