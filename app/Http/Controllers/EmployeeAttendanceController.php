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

                $lateMinutes = 0.0;
                $undertimeMinutes = 0.0;
                $overtimeMinutes = 0.0;

                if (
                    $schedule &&
                    $record->status === 'present'
                ) {
                    /*
                     * -------------------------------------------------
                     * SCHEDULE START / END
                     * -------------------------------------------------
                     */
                    $scheduledStart = $record->work_date
                        ->copy()
                        ->setTimeFromTimeString(
                            (string) $schedule->start_time
                        );

                    $scheduledEnd = $record->work_date
                        ->copy()
                        ->setTimeFromTimeString(
                            (string) $schedule->end_time
                        );

                    /*
                     * Overnight schedule.
                     *
                     * Example:
                     * 19:00 - 03:00
                     */
                    if (
                        $schedule->end_time
                        <= $schedule->start_time
                    ) {
                        $scheduledEnd->addDay();
                    }

                    /*
                     * -------------------------------------------------
                     * ACTUAL TIME-IN
                     * -------------------------------------------------
                     */
                    if ($record->time_in) {
                        $actualIn = $record->time_in->copy();

                        /*
                         * TARDY
                         *
                         * Example:
                         * Scheduled: 08:00
                         * Actual:    08:10:25
                         *
                         * Display:
                         * 10.0 minutes
                         *
                         * We calculate using seconds so the result
                         * can be represented to one decimal place.
                         */
                        $lateSeconds =
                            $scheduledStart->diffInSeconds(
                                $actualIn,
                                false
                            );

                        $lateMinutes = max(
                            0,
                            round(
                                $lateSeconds / 60,
                                1
                            )
                        );
                    }

                    /*
                     * -------------------------------------------------
                     * ACTUAL TIME-OUT
                     * -------------------------------------------------
                     */
                    if ($record->time_out) {
                        $actualOut = $record->time_out->copy();

                        /*
                         * Make sure an overnight attendance follows
                         * the overnight schedule.
                         */
                        if (
                            $actualOut->lessThanOrEqualTo(
                                $record->time_in?->copy()
                            )
                        ) {
                            $actualOut->addDay();
                        }

                        /*
                         * -------------------------------------------------
                         * UNDERTIME
                         * -------------------------------------------------
                         *
                         * If actual OUT is before scheduled END.
                         */
                        $undertimeSeconds =
                            $actualOut->diffInSeconds(
                                $scheduledEnd,
                                false
                            );

                        $undertimeMinutes = max(
                            0,
                            round(
                                $undertimeSeconds / 60,
                                1
                            )
                        );

                        /*
                         * -------------------------------------------------
                         * OVERTIME
                         * -------------------------------------------------
                         *
                         * OT is only displayed when it is MORE THAN
                         * one hour for this attendance record.
                         *
                         * 60 minutes  = no OT
                         * 60.1 minutes = OT
                         * 61 minutes  = OT
                         */
                        $overtimeSeconds =
                            $scheduledEnd->diffInSeconds(
                                $actualOut,
                                false
                            );

                        $calculatedOvertimeMinutes = max(
                            0,
                            round(
                                $overtimeSeconds / 60,
                                1
                            )
                        );

                        /*
                         * IMPORTANT:
                         *
                         * Only expose overtime when it is strictly
                         * greater than 60 minutes.
                         */
                        $overtimeMinutes =
                            $calculatedOvertimeMinutes > 60
                            ? $calculatedOvertimeMinutes
                            : 0.0;
                    }
                }

                return [
                    'id' => $record->id,

                    'employee_id' =>
                        $record->employee_id,

                    'date' =>
                        $record->work_date->format('Y-m-d'),

                    'time_in' =>
                        $record->time_in?->toIso8601String(),

                    'time_out' =>
                        $record->time_out?->toIso8601String(),

                    'status' =>
                        $record->status,

                    'segment_no' =>
                        $record->segment_no,

                    /*
                     * One decimal place.
                     */
                    'late_minutes' =>
                        number_format(
                            $lateMinutes,
                            1,
                            '.',
                            ''
                        ),

                    'undertime_minutes' =>
                        number_format(
                            $undertimeMinutes,
                            1,
                            '.',
                            ''
                        ),

                    /*
                     * OT is 0 when it is <= 60 minutes.
                     *
                     * React can therefore simply show "-"
                     * when this value is zero.
                     */
                    'overtime_minutes' =>
                        number_format(
                            $overtimeMinutes,
                            1,
                            '.',
                            ''
                        ),
                ];
            })
            ->values();

        return inertia('Employees/Attendance', [
            'employee' => [
                'id' =>
                    $employee->id,

                'employee_id' =>
                    $employee->employee_id,

                'full_name' =>
                    $employee->full_name,
            ],

            'records' =>
                $attendance,

            'attendanceImportStartCell' =>
                PayrollSetting::query()
                    ->first()
                    ?->attendance_import_start_cell
                    ?? 'C3',
        ]);
    }

    public function import(
        Request $request,
        Employee $employee
    ): RedirectResponse {
        $validated = $request->validate([
            'rows' => [
                'required',
                'array',
                'min:1',
            ],

            'rows.*.date' => [
                'required',
                'date',
            ],

            'rows.*.time_in' => [
                'nullable',
                'date_format:H:i:s',
            ],

            'rows.*.time_out' => [
                'nullable',
                'date_format:H:i:s',
            ],

            'rows.*.segment_no' => [
                'required',
                'integer',
                'min:1',
            ],

            'rows.*.status' => [
                'required',
                'in:present,absent,on_leave,holiday',
            ],
        ]);

        $rows = collect(
            $validated['rows']
        )->map(function (array $row) {
            $row['date'] = Carbon::parse(
                $row['date']
            )->format('Y-m-d');

            return $row;
        });

        DB::transaction(function () use (
            $rows,
            $employee
        ) {
            $rows->each(
                function (array $row) use (
                    $employee
                ) {
                    $timeIn = $this->timestamp(
                        $row['date'],
                        $row['time_in']
                    );

                    $timeOut = $this->timestamp(
                        $row['date'],
                        $row['time_out']
                    );

                    $schedule = $employee->schedules()
                        ->whereDate(
                            'work_date',
                            $row['date']
                        )
                        ->where(
                            'segment_no',
                            $row['segment_no']
                        )
                        ->first();

                    /*
                     * Overnight schedule attendance.
                     *
                     * Example:
                     * Schedule: 19:00 - 03:00
                     * Time out: 03:05
                     *
                     * Store time_out on the following day.
                     */
                    if (
                        $schedule &&
                        $timeOut &&
                        $schedule->end_time
                            < $schedule->start_time
                    ) {
                        $timeOut->addDay();
                    }

                    Attendance::updateOrCreate(
                        [
                            'employee_id' =>
                                $employee->id,

                            'work_date' =>
                                $row['date'],

                            'segment_no' =>
                                $row['segment_no'],
                        ],
                        [
                            'time_in' =>
                                $timeIn,

                            'time_out' =>
                                $timeOut,

                            'status' =>
                                $row['status'],

                            'source' =>
                                'import',
                        ],
                    );
                }
            );
        });

        return back()->with(
            'success',
            sprintf(
                'Attendance imported successfully. %d record(s) imported.',
                $rows->count(),
            )
        );
    }

    public function destroy(
        Employee $employee,
        Attendance $attendance
    ): RedirectResponse {
        abort_unless(
            $attendance->employee_id === $employee->id,
            404
        );

        $attendance->delete();

        return back()->with(
            'success',
            'Attendance deleted successfully.'
        );
    }

    private function timestamp(
        string $date,
        ?string $time
    ): ?Carbon {
        return $time
            ? Carbon::createFromFormat(
                'Y-m-d H:i:s',
                "$date $time"
            )
            : null;
    }
}
