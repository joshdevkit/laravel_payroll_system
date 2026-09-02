<?php

namespace App\Services\Payroll;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\EmployeeSchedule;
use App\Models\PayrollSetting;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class AttendanceCalculator
{
    public function __construct(
        private OvertimeCalculator $overtimeCalculator,
        private NightDifferentialCalculator $nightDifferentialCalculator,
    ) {
    }

    public function calculate(
        Employee $employee,
        PayrollSetting $settings,
        string $start,
        string $end,
        float $hourlyRate
    ): AttendanceCalculationResult {
        $schedules = EmployeeSchedule::query()
            ->where('employee_id', $employee->id)
            ->whereBetween('work_date', [$start, $end])
            ->where('is_working_day', true)
            ->orderBy('work_date')
            ->orderBy('segment_no')
            ->get();

        /*
         * Include one day before and after for
         * overnight attendance.
         */
        $attendance = Attendance::query()
            ->where('employee_id', $employee->id)
            ->whereBetween(
                'work_date',
                [
                    Carbon::parse($start)
                        ->subDay()
                        ->toDateString(),

                    Carbon::parse($end)
                        ->addDay()
                        ->toDateString(),
                ]
            )
            ->get();

        $details = [];

        $usedAttendance = [];

        $presentDates = [];
        $scheduledDates = [];

        $presentSegments = 0;

        $lateMinutes = 0;
        $undertimeMinutes = 0;
        $overtimeMinutes = 0;
        $nightDiffMinutes = 0;

        $tardyDeduction = 0.0;
        $overtimePay = 0.0;
        $nightDiffPay = 0.0;

        $dailyWorkHours = max(
            1,
            (float) $settings->daily_work_hours
        );

        $tardyPerMinute = $hourlyRate / 60;

        /*
         * ==========================================================
         * SEPARATE DAY-FRACTION CALCULATION
         * ==========================================================
         *
         * This is intentionally independent from:
         *
         * - tardy
         * - undertime
         * - overtime
         * - NSD
         * - payroll pay calculations
         *
         * Each attendance record contributes:
         *
         * actual minutes / daily working minutes
         *
         * The total for ONE calendar date is capped at 1.00.
         *
         * Example:
         *
         * 4 hours / 8 hours = 0.50 day
         *
         * 6 hours / 8 hours = 0.75 day
         *
         * 8 hours / 8 hours = 1.00 day
         *
         * ==========================================================
         */

        $dayFractionByDate = [];

        foreach ($attendance as $record) {
            if ($record->status !== 'present') {
                continue;
            }

            if (! $record->time_in || ! $record->time_out) {
                continue;
            }

            $attendanceDate = Carbon::parse(
                $record->work_date
            )->toDateString();

            /*
             * Only calculate day fractions for dates
             * inside the payroll period.
             */
            if (
                $attendanceDate < Carbon::parse($start)->toDateString()
                ||
                $attendanceDate > Carbon::parse($end)->toDateString()
            ) {
                continue;
            }

            $actual = $this->attendanceBounds(
                $record->time_in,
                $record->time_out
            );

            if (! $actual) {
                continue;
            }

            /*
             * IMPORTANT:
             *
             * This uses the ACTUAL TIME IN -> ACTUAL TIME OUT.
             *
             * It does NOT use:
             *
             * - late minutes
             * - undertime
             * - overtime
             * - NSD
             * - schedule overlap
             * - break calculation
             *
             * This is purely for No. of Days.
             */
            $actualMinutes = $this->duration(
                $actual['from'],
                $actual['to']
            );

            if ($actualMinutes <= 0) {
                continue;
            }

            /*
             * Convert actual attendance into a day fraction.
             *
             * Example:
             *
             * daily_work_hours = 8
             * actual = 4 hours
             *
             * 240 / 480 = 0.50
             */
            $fraction =
                $actualMinutes
                / ($dailyWorkHours * 60);

            /*
             * Add the attendance fraction to the date.
             *
             * Multiple attendance records on the same date
             * are allowed.
             */
            $dayFractionByDate[$attendanceDate] =
                ($dayFractionByDate[$attendanceDate] ?? 0)
                + $fraction;
        }

        /*
         * ==========================================================
         * CAP EACH CALENDAR DATE AT 1.00
         * ==========================================================
         *
         * This prevents:
         *
         * Segment 1 = 0.50
         * Segment 2 = 0.50
         *
         * from becoming 2 days.
         *
         * The date can contribute a maximum of 1.00.
         */
        foreach ($dayFractionByDate as $date => $fraction) {
            $dayFractionByDate[$date] = min(
                1.0,
                $fraction
            );
        }

        /*
         * ==========================================================
         * NORMAL PAYROLL CALCULATIONS
         * ==========================================================
         */

        foreach ($schedules as $schedule) {
            $date = Carbon::parse(
                $schedule->work_date
            )->toDateString();

            $scheduledDates[$date] = true;

            $scheduleTime = $this->bounds(
                $date,
                (string) $schedule->start_time,
                (string) $schedule->end_time
            );

            $grossMinutes = $this->duration(
                $scheduleTime['from'],
                $scheduleTime['to']
            );

            $scheduledMinutes = max(
                0,
                $grossMinutes
                - min(
                    (int) $schedule->break_minutes,
                    $grossMinutes
                )
            );

            /*
             * ======================================================
             * MATCH ATTENDANCE
             * ======================================================
             */
            $record = null;

            foreach ($attendance as $candidate) {
                if (
                    isset(
                        $usedAttendance[$candidate->id]
                    )
                ) {
                    continue;
                }

                if (
                    Carbon::parse(
                        $candidate->work_date
                    )->toDateString() !== $date
                    ||
                    (int) $candidate->segment_no
                        !==
                    (int) $schedule->segment_no
                    ||
                    $candidate->status !== 'present'
                ) {
                    continue;
                }

                $actual = $this->attendanceBounds(
                    $candidate->time_in,
                    $candidate->time_out
                );

                if (! $actual) {
                    continue;
                }

                if (
                    $this->overlap(
                        $actual['from'],
                        $actual['to'],
                        $scheduleTime['from'],
                        $scheduleTime['to']
                    ) > 0
                ) {
                    $record = $candidate;
                    break;
                }
            }

            /*
             * ======================================================
             * ABSENT SEGMENT
             * ======================================================
             */
            if (! $record) {
                $details[] = [
                    'date' =>
                        $date,

                    'segmentNo' =>
                        (int) $schedule->segment_no,

                    'start' =>
                        substr(
                            (string) $schedule->start_time,
                            0,
                            5
                        ),

                    'end' =>
                        substr(
                            (string) $schedule->end_time,
                            0,
                            5
                        ),

                    'scheduledStart' =>
                        $scheduleTime['from'],

                    'scheduledEnd' =>
                        $scheduleTime['to'],

                    'scheduledMinutes' =>
                        $scheduledMinutes,

                    'breakMinutes' =>
                        (int) $schedule->break_minutes,

                    'workedMinutes' =>
                        0,

                    'regularMinutes' =>
                        0,

                    'actualIn' =>
                        null,

                    'actualOut' =>
                        null,

                    'lateMinutes' =>
                        0,

                    'rawLateMinutes' =>
                        0,

                    'graceMinutes' =>
                        (int) $settings->late_grace_minutes,

                    'undertimeMinutes' =>
                        0,

                    'overtimeMinutes' =>
                        0,

                    'nightDiffMinutes' =>
                        0,

                    'isPresent' =>
                        false,

                    'overtimePay' =>
                        0,

                    'nightDiffPay' =>
                        0,

                    'tardyDeduction' =>
                        0,

                    'calculationNotes' =>
                        null,
                ];

                continue;
            }

            $actual = $this->attendanceBounds(
                $record->time_in,
                $record->time_out
            );

            if (! $actual) {
                continue;
            }

            $usedAttendance[$record->id] = true;

            $presentSegments++;

            /*
             * ======================================================
             * WORKED MINUTES
             * ======================================================
             */
            $workedMinutes = $this->overlap(
                $actual['from'],
                $actual['to'],
                $scheduleTime['from'],
                $scheduleTime['to']
            );

            /*
             * ======================================================
             * REGULAR MINUTES
             * ======================================================
             */
            $regularMinutes =
                $this->calculateRegularPaidMinutes(
                    $actual['from'],
                    $actual['to'],
                    $scheduleTime['from'],
                    $scheduleTime['to'],
                    (int) $schedule->break_minutes
                );

            /*
             * ======================================================
             * TARDY
             * ======================================================
             */
            $rawLateSeconds =
                $scheduleTime['from']->diffInSeconds(
                    $actual['from'],
                    false
                );

            $rawLateMinutes = max(
                0,
                (int) floor(
                    $rawLateSeconds / 60
                )
            );

            $late = max(
                0,
                $rawLateMinutes
                - max(
                    0,
                    (int) $settings->late_grace_minutes
                )
            );

            $segmentTardyDeduction =
                $late * $tardyPerMinute;

            /*
             * ======================================================
             * UNDERTIME
             * ======================================================
             */
            $undertime = max(
                0,
                $this->roundedMinutesBetween(
                    $actual['to'],
                    $scheduleTime['to']
                )
            );

            /*
             * ======================================================
             * OVERTIME
             * ======================================================
             */
            $overtime =
                $this->overtimeCalculator->calculate(
                    $scheduleTime['to'],
                    $actual['to'],
                    $settings
                );

            /*
             * ======================================================
             * NSD
             * ======================================================
             */
            $nsd =
                $this->nightDifferentialCalculator->calculate(
                    $actual['from'],
                    $actual['to'],
                    $scheduleTime['from'],
                    $scheduleTime['to'],
                    $scheduledMinutes,
                    (int) $schedule->break_minutes,
                    $overtime,
                    $settings
                );

            /*
             * ======================================================
             * PAY
             * ======================================================
             */
            $segmentOvertimePay =
                ($overtime / 60)
                * $hourlyRate
                * (float) $settings->overtime_multiplier;

            $segmentNightDiffPay =
                ($nsd / 60)
                * $hourlyRate
                * (float) $settings->night_diff_multiplier;

            $presentDates[$date] = true;

            $lateMinutes += $late;

            $undertimeMinutes += $undertime;

            $overtimeMinutes += $overtime;

            $nightDiffMinutes += $nsd;

            $tardyDeduction +=
                $segmentTardyDeduction;

            $overtimePay +=
                $segmentOvertimePay;

            $nightDiffPay +=
                $segmentNightDiffPay;

            $details[] = [
                'date' =>
                    $date,

                'segmentNo' =>
                    (int) $schedule->segment_no,

                'start' =>
                    substr(
                        (string) $schedule->start_time,
                        0,
                        5
                    ),

                'end' =>
                    substr(
                        (string) $schedule->end_time,
                        0,
                        5
                    ),

                'scheduledStart' =>
                    $scheduleTime['from'],

                'scheduledEnd' =>
                    $scheduleTime['to'],

                'scheduledMinutes' =>
                    $scheduledMinutes,

                'breakMinutes' =>
                    (int) $schedule->break_minutes,

                'workedMinutes' =>
                    $workedMinutes,

                'regularMinutes' =>
                    $regularMinutes,

                'actualIn' =>
                    $record->time_in,

                'actualOut' =>
                    $record->time_out,

                'lateMinutes' =>
                    $late,

                'rawLateMinutes' =>
                    $rawLateMinutes,

                'graceMinutes' =>
                    (int) $settings->late_grace_minutes,

                'undertimeMinutes' =>
                    $undertime,

                'overtimeMinutes' =>
                    $overtime,

                'nightDiffMinutes' =>
                    $nsd,

                'isPresent' =>
                    true,

                'overtimePay' =>
                    $this->money(
                        $segmentOvertimePay
                    ),

                'nightDiffPay' =>
                    $this->money(
                        $segmentNightDiffPay
                    ),

                'tardyDeduction' =>
                    $this->money(
                        $segmentTardyDeduction
                    ),

                'calculationNotes' =>
                    'Tardy: '
                    . $late
                    . ' min × ₱'
                    . number_format(
                        $tardyPerMinute,
                        6
                    )
                    . '/min',
            ];
        }

        /*
         * ==========================================================
         * FRACTIONAL PRESENT DAYS
         * ==========================================================
         *
         * DO NOT use count($presentDates).
         *
         * This is now based exclusively on actual attendance
         * duration.
         */
        $presentDays = array_sum(
            $dayFractionByDate
        );

        /*
         * Keep scheduled workdays as actual scheduled dates.
         */
        $scheduledWorkdays =
            count($scheduledDates);

        /*
         * A date is absent only when there was no present
         * attendance at all.
         */
        $absentDays =
            count(
                array_diff_key(
                    $scheduledDates,
                    $presentDates
                )
            );

        return new AttendanceCalculationResult(
            details: $details,
            presentDates: $presentDates,
            scheduledDates: $scheduledDates,
            presentSegments: $presentSegments,
            presentDays: $presentDays,
            scheduledWorkdays: $scheduledWorkdays,
            absentDays: $absentDays,
            lateMinutes: $lateMinutes,
            undertimeMinutes: $undertimeMinutes,
            overtimeMinutes: $overtimeMinutes,
            nightDiffMinutes: $nightDiffMinutes,
            tardyDeduction: $tardyDeduction,
            overtimePay: $overtimePay,
            nightDiffPay: $nightDiffPay,
        );
    }

    private function calculateRegularPaidMinutes(
        CarbonInterface $actualIn,
        CarbonInterface $actualOut,
        CarbonInterface $scheduleStart,
        CarbonInterface $scheduleEnd,
        int $breakMinutes
    ): int {
        $workedMinutes = $this->overlap(
            $actualIn,
            $actualOut,
            $scheduleStart,
            $scheduleEnd
        );

        if (
            $workedMinutes <= 0
            ||
            $breakMinutes <= 0
        ) {
            return max(
                0,
                $workedMinutes
            );
        }

        $breakDuration = min(
            $breakMinutes,
            $this->duration(
                $scheduleStart,
                $scheduleEnd
            )
        );

        $breakEnd =
            $scheduleEnd->copy();

        $breakStart =
            $breakEnd->copy()
                ->subMinutes(
                    $breakDuration
                );

        $actualBreakMinutes =
            $this->overlap(
                $actualIn,
                $actualOut,
                $breakStart,
                $breakEnd
            );

        return max(
            0,
            $workedMinutes
            - $actualBreakMinutes
        );
    }

    private function bounds(
        string $date,
        string $start,
        string $end
    ): array {
        $from = Carbon::parse(
            $date
            . ' '
            . substr($start, 0, 5)
        );

        $to = Carbon::parse(
            $date
            . ' '
            . substr($end, 0, 5)
        );

        if (
            $this->timeMinutes($end)
            <=
            $this->timeMinutes($start)
        ) {
            $to->addDay();
        }

        return [
            'from' => $from,
            'to' => $to,
        ];
    }

    private function attendanceBounds(
        $timeIn,
        $timeOut
    ): ?array {
        if (! $timeIn || ! $timeOut) {
            return null;
        }

        $from =
            $timeIn instanceof CarbonInterface
                ? $timeIn->copy()
                : Carbon::parse($timeIn);

        $to =
            $timeOut instanceof CarbonInterface
                ? $timeOut->copy()
                : Carbon::parse($timeOut);

        if (
            $to->lessThanOrEqualTo($from)
        ) {
            $to->addDay();
        }

        return [
            'from' => $from,
            'to' => $to,
        ];
    }

    private function timeMinutes(
        string $value
    ): int {
        [
            $hours,
            $minutes
        ] = array_map(
            'intval',
            explode(
                ':',
                substr($value, 0, 5)
            )
        );

        return ($hours * 60) + $minutes;
    }

    private function duration(
        CarbonInterface $start,
        CarbonInterface $end
    ): int {
        return max(
            0,
            (int) round(
                $start->diffInSeconds($end) / 60
            )
        );
    }

    private function roundedMinutesBetween(
        CarbonInterface $from,
        CarbonInterface $to
    ): int {
        return (int) round(
            $from->diffInSeconds($to) / 60
        );
    }

    private function overlap(
        CarbonInterface $a,
        CarbonInterface $b,
        CarbonInterface $c,
        CarbonInterface $d
    ): int {
        $start = max(
            $a->getTimestamp(),
            $c->getTimestamp()
        );

        $end = min(
            $b->getTimestamp(),
            $d->getTimestamp()
        );

        return max(
            0,
            (int) round(
                ($end - $start) / 60
            )
        );
    }

    private function money(float $value): float
    {
        return (float) number_format(
            $value,
            2,
            '.',
            ''
        );
    }
}
