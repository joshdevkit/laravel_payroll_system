<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\RedirectResponse;
use Inertia\Response;

class EmployeeAttendanceController extends Controller
{
    public function index(Employee $employee): Response
    {
        $attendance = $employee->attendance()
            ->orderByDesc('work_date')
            ->orderBy('segment_no')
            ->get()
            ->map(function (Attendance $record) use ($employee) {
                $schedule = $employee->schedules()
                    ->whereDate('work_date', $record->work_date)
                    ->where('segment_no', $record->segment_no)
                    ->first();

                $lateMinutes = 0;
                $undertimeMinutes = 0;

                if ($schedule && $record->status === 'present' && $record->time_in) {
                    $scheduledStart = $record->work_date->copy()->setTimeFromTimeString($schedule->start_time);
                    $actualIn = $record->time_in->copy();
                    $lateMinutes = max(0, $scheduledStart->diffInMinutes($actualIn, false));
                }

                if ($schedule && $record->status === 'present' && $record->time_out) {
                    $scheduledEnd = $record->work_date->copy()->setTimeFromTimeString($schedule->end_time);
                    $actualOut = $record->time_out->copy();

                    if ($schedule->end_time < $schedule->start_time) {
                        $scheduledEnd->addDay();
                    }

                    $undertimeMinutes = max(0, $actualOut->diffInMinutes($scheduledEnd, false) * -1);
                }

                return [
                    'id' => $record->id,
                    'employee_id' => $record->employee_id,
                    'date' => $record->work_date->format('Y-m-d'),
                    'time_in' => $record->time_in?->toIso8601String(),
                    'time_out' => $record->time_out?->toIso8601String(),
                    'status' => $record->status,
                    'segment_no' => $record->segment_no,
                    'late_minutes' => $lateMinutes,
                    'undertime_minutes' => $undertimeMinutes,
                ];
            })
            ->values();

        return inertia('Employees/Attendance', [
            'employee' => [
                'id' => $employee->id,
                'employee_id' => $employee->employee_id,
                'full_name' => $employee->full_name,
            ],
            'records' => $attendance,
        ]);
    }

    public function destroy(Employee $employee, Attendance $attendance): RedirectResponse
    {
        abort_unless($attendance->employee_id === $employee->id, 404);

        $attendance->delete();

        return back()->with('success', 'Attendance deleted successfully.');
    }
}
