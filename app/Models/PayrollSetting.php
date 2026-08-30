<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollSetting extends Model
{
    protected $table = 'payroll_settings';

    protected $fillable = [
        'daily_work_hours',
        'late_enabled',
        'undertime_enabled',
        'overtime_enabled',
        'overtime_multiplier',
        'overtime_threshold_minutes',
        'late_grace_minutes',
        'unpaid_break_minutes',
        'night_diff_enabled',
        'night_diff_start',
        'night_diff_end',
        'night_diff_multiplier',
        'holiday_pay_enabled',
        'holiday_regular_multiplier',
        'holiday_special_multiplier',
        'leave_pay_enabled',
        'monthly_daily_rate_divisor',
        'work_schedule',
        'shift_options',
        'attendance_import_start_cell',
        'schedule_import_start_cell',
    ];
}
