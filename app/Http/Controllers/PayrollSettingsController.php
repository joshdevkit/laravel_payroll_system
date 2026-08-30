<?php

namespace App\Http\Controllers;

use App\Models\PayrollSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;

class PayrollSettingsController extends Controller
{
    public function index(): Response
    {
        return inertia('Settings/Index', [
            'settings' => $this->settings()->toArray(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'daily_work_hours' => ['required', 'integer', 'min:0'],
            'late_enabled' => ['required', 'boolean'],
            'undertime_enabled' => ['required', 'boolean'],
            'overtime_enabled' => ['required', 'boolean'],
            'overtime_multiplier' => ['required', 'decimal:2', 'min:0', 'min:0'],
            'overtime_threshold_minutes' => ['required', 'integer', 'min:0'],
            'late_grace_minutes' => ['required', 'integer', 'min:0'],
            'unpaid_break_minutes' => ['required', 'integer', 'min:0'],
            'night_diff_enabled' => ['required', 'boolean'],
            'night_diff_start' => ['required'],
            'night_diff_end' => ['required'],
            'night_diff_multiplier' => ['required', 'decimal:1', 'min:0', 'min:0'],
            'holiday_pay_enabled' => ['required', 'boolean'],
            'holiday_regular_multiplier' => ['required', 'integer', 'min:0', 'min:0'],
            'holiday_special_multiplier' => ['required', 'decimal:1', 'min:0', 'min:0'],
            'leave_pay_enabled' => ['required', 'boolean'],
            'monthly_daily_rate_divisor' => ['required', 'integer', 'min:0'],
            'work_schedule' => ['nullable', 'array'],
            'shift_options' => ['nullable', 'array'],
            'attendance_import_start_cell' => ['required', 'string', 'regex:/^[A-Z]+[1-9][0-9]*$/i'],
            'schedule_import_start_cell' => ['required', 'string', 'regex:/^[A-Z]+[1-9][0-9]*$/i'],
        ]);
        $validated['night_diff_start'];
        $validated['night_diff_end'];
        $validated['attendance_import_start_cell'] = strtoupper(trim($validated['attendance_import_start_cell']));
        $validated['schedule_import_start_cell'] = strtoupper(trim($validated['schedule_import_start_cell']));

        $settings = $this->settings();
        $settings->update($validated);

        return back()->with('success', 'Payroll configurations saved successfully.');
    }

    private function settings(): PayrollSetting
    {
        return PayrollSetting::query()->firstOrCreate(
            ['id' => 1],
            [
                'daily_work_hours' => 8,
                'late_enabled' => true,
                'undertime_enabled' => true,
                'overtime_enabled' => true,
                'overtime_multiplier' => 1.25,
                'overtime_threshold_minutes' => 0,
                'late_grace_minutes' => 0,
                'unpaid_break_minutes' => 60,
                'night_diff_enabled' => true,
                'night_diff_start' => '22:00:00',
                'night_diff_end' => '06:00:00',
                'night_diff_multiplier' => 0.10,
                'holiday_pay_enabled' => true,
                'holiday_regular_multiplier' => 2,
                'holiday_special_multiplier' => 1.3,
                'leave_pay_enabled' => true,
                'monthly_daily_rate_divisor' => 26,
                'work_schedule' => $this->defaultWorkSchedule(),
                'shift_options' => $this->defaultShiftOptions(),
                'attendance_import_start_cell' => 'C3',
                'schedule_import_start_cell' => 'C3',
            ],
        );
    }

    private function defaultShiftOptions(): array
    {
        return [
            ['id' => 'regular', 'name' => 'Regular Day', 'start' => '08:00', 'end' => '17:00', 'break_minutes' => 60],
            ['id' => 'night', 'name' => 'Night Shift', 'start' => '19:00', 'end' => '03:00', 'break_minutes' => 0],
        ];
    }

    private function defaultWorkSchedule(): array
    {
        $working = [
            'enabled' => true,
            'start' => '08:00',
            'end' => '17:00',
            'shift_id' => 'regular',
            'break_minutes' => 60,
        ];

        return [
            'monday' => $working,
            'tuesday' => $working,
            'wednesday' => $working,
            'thursday' => $working,
            'friday' => $working,
            'saturday' => ['enabled' => false, 'start' => '08:00', 'end' => '12:00', 'break_minutes' => 0],
            'sunday' => ['enabled' => false, 'start' => '08:00', 'end' => '17:00', 'break_minutes' => 60],
        ];
    }
}
