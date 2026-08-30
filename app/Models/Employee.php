<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Employee extends Model
{
    use HasFactory;

    protected $table = 'employees';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'employee_id',
        'full_name',
        'employment_type',
        'rate_type',
        'basic_rate',
        'daily_rate',
        'sss_no',
        'philhealth_no',
        'pagibig_no',
        'tin',
        'date_hired',
    ];

    protected $casts = [
        'basic_rate' => 'decimal:2',
        'daily_rate' => 'decimal:2',
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
}
