<?php

namespace App\Models;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeSchedule extends Model
{
    use HasUuids;

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

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}