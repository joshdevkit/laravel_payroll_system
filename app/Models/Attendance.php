<?php

namespace App\Models;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasUuids;

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

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}