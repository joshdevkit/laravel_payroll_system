<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\PayrollSetting;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

                    $undertimeMinutes = max(0, -$scheduledEnd->diffInMinutes($actualOut, false));
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
            'attendanceImportStartCell' => PayrollSetting::query()->first()?->attendance_import_start_cell ?? 'C3',
        ]);
    }

    public function import(Request $request, Employee $employee): RedirectResponse
    {
        $validated = $request->validate([
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.date' => ['required', 'date_format:Y-m-d'],
            'rows.*.time_in' => ['nullable', 'date_format:H:i:s'],
            'rows.*.time_out' => ['nullable', 'date_format:H:i:s'],
            'rows.*.segment_no' => ['required', 'integer', 'min:1'],
            'rows.*.status' => ['required', 'in:present,absent,on_leave,holiday'],
        ]);

        $rows = collect($validated['rows']);

        DB::transaction(function () use ($rows, $employee) {
            $rows->each(function (array $row) use ($employee) {
                $timeIn = $this->timestamp($row['date'], $row['time_in']);
                $timeOut = $this->timestamp($row['date'], $row['time_out']);

                $schedule = $employee->schedules()
                    ->whereDate('work_date', $row['date'])
                    ->where('segment_no', $row['segment_no'])
                    ->first();

                if ($schedule && $timeOut && $schedule->end_time < $schedule->start_time) {
                    $timeOut->addDay();
                }

                Attendance::updateOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'work_date' => $row['date'],
                        'segment_no' => $row['segment_no'],
                    ],
                    [
                        'time_in' => $timeIn,
                        'time_out' => $timeOut,
                        'status' => $row['status'],
                        'source' => 'import',
                    ],
                );
            });
        });

        return back()->with('success', sprintf(
            'Attendance imported successfully. %d record(s) imported.',
            $rows->count(),
        ));
    }

    public function destroy(Employee $employee, Attendance $attendance): RedirectResponse
    {
        abort_unless($attendance->employee_id === $employee->id, 404);

        $attendance->delete();

        return back()->with('success', 'Attendance deleted successfully.');
    }

    private function timestamp(string $date, ?string $time): ?Carbon
    {
        return $time ? Carbon::createFromFormat('Y-m-d H:i:s', "$date $time") : null;
    }
}
