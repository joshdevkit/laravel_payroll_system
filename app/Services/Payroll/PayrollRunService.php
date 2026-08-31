<?php

namespace App\Services\Payroll;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\EmployeeSchedule;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use App\Models\PayrollScheduleDetail;
use App\Models\PayrollSetting;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

class PayrollRunService
{
    public function createDraft(
        string $cutoffStart,
        string $cutoffEnd,
        string $payDate
    ): PayrollRun {
        return DB::transaction(function () use (
            $cutoffStart,
            $cutoffEnd,
            $payDate
        ) {
            $settings = PayrollSetting::query()->findOrFail(1);

            $run = PayrollRun::create([
                'cutoff_start' => $cutoffStart,
                'cutoff_end' => $cutoffEnd,
                'pay_date' => $payDate,
                'status' => 'draft',
                'settings_snapshot' => $settings->toArray(),
            ]);

            $this->buildItems($run, $settings);

            return $run->load([
                'items.employee',
                'items.scheduleDetails',
            ]);
        });
    }

    public function ensureItems(PayrollRun $run): PayrollRun
    {
        if ($run->status !== 'draft') {
            return $run->load([
                'items.employee',
                'items.scheduleDetails',
            ]);
        }

        $employeeIds = Employee::query()->pluck('id');

        $existingEmployeeIds = $run
            ->items()
            ->pluck('employee_id');

        $missingEmployees = $employeeIds->diff(
            $existingEmployeeIds
        );

        if ($missingEmployees->isEmpty()) {
            return $run->load([
                'items.employee',
                'items.scheduleDetails',
            ]);
        }

        return DB::transaction(function () use ($run) {
            $settings = PayrollSetting::query()->findOrFail(1);

            $this->buildItems($run, $settings);

            return $run->fresh([
                'items.employee',
                'items.scheduleDetails',
            ]);
        });
    }

    private function buildItems(
        PayrollRun $run,
        PayrollSetting $settings
    ): void {
        $start = Carbon::parse(
            $run->cutoff_start
        )->toDateString();

        $end = Carbon::parse(
            $run->cutoff_end
        )->toDateString();

        $employees = Employee::query()
            ->orderBy('full_name')
            ->get();

        foreach ($employees as $employee) {
            $calculated = $this->calculateEmployee(
                $run,
                $settings,
                $employee,
                $start,
                $end
            );

            $item = PayrollItem::updateOrCreate(
                [
                    'payroll_run_id' => $run->id,
                    'employee_id' => $employee->id,
                ],
                array_merge(
                    $calculated['item'],
                    [
                        'calculation_snapshot' =>
                            $calculated['summary'],
                    ]
                )
            );

            $item->scheduleDetails()->delete();

            foreach (
                $calculated['summary']['scheduleDetails']
                as $detail
            ) {
                PayrollScheduleDetail::create([
                    'payroll_item_id' => $item->id,

                    'work_date' =>
                        $detail['date'],

                    'segment_no' =>
                        $detail['segmentNo'],

                    'scheduled_start' =>
                        $detail['scheduledStart'],

                    'scheduled_end' =>
                        $detail['scheduledEnd'],

                    'actual_in' =>
                        $detail['actualIn'],

                    'actual_out' =>
                        $detail['actualOut'],

                    'scheduled_minutes' =>
                        $detail['scheduledMinutes'],

                    'break_minutes' =>
                        $detail['breakMinutes'],

                    'worked_minutes' =>
                        $detail['workedMinutes'],

                    'late_minutes' =>
                        $detail['lateMinutes'],

                    'undertime_minutes' =>
                        $detail['undertimeMinutes'],

                    'overtime_minutes' =>
                        $detail['overtimeMinutes'],

                    'night_diff_minutes' =>
                        $detail['nightDiffMinutes'],

                    'is_present' =>
                        $detail['isPresent'],

                    'overtime_pay' =>
                        $detail['overtimePay'],

                    'night_diff_pay' =>
                        $detail['nightDiffPay'],

                    'calculation_notes' =>
                        $detail['calculationNotes'] ?? null,
                ]);
            }
        }
    }

    /**
     * Calculate one employee's payroll.
     *
     * Tardiness:
     *
     * - Calculated independently for every schedule segment.
     * - Sum of all segment tardiness becomes late_minutes.
     * - Sum of all segment tardy deductions becomes tardy_deduction.
     * - Tardy does NOT reduce basic_pay.
     * - Tardy IS included in total_deductions.
     * - Net pay = total earnings - total deductions.
     */
    private function calculateEmployee(
        PayrollRun $run,
        PayrollSetting $settings,
        Employee $employee,
        string $start,
        string $end
    ): array {
        /*
         * Daily rate.
         */
        $rate = $employee->rate_type === 'daily'
            ? (float) (
                $employee->daily_rate
                ?? $employee->basic_rate
                ?? 0
            )
            : (float) (
                $employee->basic_rate
                ?? 0
            ) / max(
                1,
                (float) $settings->monthly_daily_rate_divisor
            );

        /*
         * Date-specific schedules.
         */
        $schedules = EmployeeSchedule::query()
            ->where(
                'employee_id',
                $employee->id
            )
            ->whereBetween(
                'work_date',
                [$start, $end]
            )
            ->where(
                'is_working_day',
                true
            )
            ->orderBy('work_date')
            ->orderBy('segment_no')
            ->get();

        /*
         * Include one day before and one day after
         * because overnight shifts can cross midnight.
         */
        $attendance = Attendance::query()
            ->where(
                'employee_id',
                $employee->id
            )
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

        $overtimePay = 0.0;
        $nightDiffPay = 0.0;
        $holidayPay = 0.0;
        $leavePay = 0.0;

        $paidLeaveDays = 0;
        $unpaidLeaveDays = 0;
        $holidayDays = 0;

        /*
         * NEW:
         *
         * Total tardy monetary deduction.
         */
        $tardyDeduction = 0.0;

        /*
         * Hourly/minute rate used by tardiness,
         * overtime and NSD.
         */
        $dailyWorkHours = max(
            1,
            (float) $settings->daily_work_hours
        );

        $hourlyRate =
            $rate / $dailyWorkHours;

        $tardyPerMinute =
            $hourlyRate / 60;

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

            /*
             * Gross schedule duration.
             */
            $grossMinutes = $this->duration(
                $scheduleTime['from'],
                $scheduleTime['to']
            );

            /*
             * Scheduled paid minutes after break.
             */
            $scheduledMinutes = max(
                0,
                $grossMinutes
                    - min(
                        (int) $schedule->break_minutes,
                        $grossMinutes
                    )
            );

            $record = null;

            /*
             * Match attendance to exact schedule.
             */
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
             * No attendance.
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
             * Actual worked time.
             */
            $workedMinutes = $this->overlap(
                $actual['from'],
                $actual['to'],
                $scheduleTime['from'],
                $scheduleTime['to']
            );

            /*
             * Regular paid minutes.
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
             * ==================================================
             * TARDINESS
             * ==================================================
             *
             * IMPORTANT:
             *
             * We calculate tardiness from the schedule's
             * actual date/time, NOT just the clock time.
             *
             * This prevents overnight/multiple schedules
             * from interfering with each other.
             *
             * Example:
             *
             * Aug 24:
             * Schedule = 08:00
             * Time in  = 08:10:25
             *
             * Tardy = 10 minutes
             *
             * Aug 25:
             * Schedule = 19:00
             * Time in  = 19:04:31
             *
             * Tardy = 4 minutes
             *
             * Total = 14 minutes
             */

            $scheduledStart = $scheduleTime['from'];

            $actualTimeIn = $actual['from'];

            /*
             * Raw tardy.
             *
             * Use the exact datetime difference.
             */
            $rawLateSeconds =
                $scheduledStart->diffInSeconds(
                    $actualTimeIn,
                    false
                );

            $rawLateMinutes = max(
                0,
                (int) floor(
                    $rawLateSeconds / 60
                )
            );

            /*
             * Apply grace period.
             *
             * Example:
             *
             * Actual 08:10:25
             * Scheduled 08:00
             *
             * Raw = 10 minutes
             *
             * If grace = 0:
             * 10 minutes
             *
             * If grace = 5:
             * 5 minutes
             */
            $late = max(
                0,
                $rawLateMinutes
                    - max(
                        0,
                        (int) $settings->late_grace_minutes
                    )
            );

            /*
             * Monetary tardy deduction.
             */
            $segmentTardyDeduction =
                $late * $tardyPerMinute;

            /*
             * Add to employee totals.
             */
            $lateMinutes += $late;

            $tardyDeduction +=
                $segmentTardyDeduction;

            /*
             * Undertime.
             */
            $undertime = max(
                0,
                $this->roundedMinutesBetween(
                    $actual['to'],
                    $scheduleTime['to']
                )
            );

            /*
             * Overtime.
             */
            $rawOvertime = max(
                0,
                $this->roundedMinutesBetween(
                    $scheduleTime['to'],
                    $actual['to']
                )
            );

            $overtime =
                (bool) $settings->overtime_enabled
                &&
                $rawOvertime >= max(
                    0,
                    (int) $settings->overtime_threshold_minutes
                )
                ? $rawOvertime
                : 0;

            /*
             * NSD.
             */
            $nsd = $this->calculateNightDiffMinutes(
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
             * Overtime pay.
             */
            $segmentOvertimePay =
                ($overtime / 60)
                * $hourlyRate
                * (float) $settings->overtime_multiplier;

            /*
             * NSD pay.
             */
            $segmentNightDiffPay =
                ($nsd / 60)
                * $hourlyRate
                * (float) $settings->night_diff_multiplier;

            $presentDates[$date] = true;

            $undertimeMinutes += $undertime;
            $overtimeMinutes += $overtime;
            $nightDiffMinutes += $nsd;

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

                /*
                 * THIS is the per-schedule tardy.
                 */
                'lateMinutes' =>
                    $late,

                /*
                 * Raw tardy is useful for debugging.
                 */
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

                /*
                 * Monetary tardy for this schedule.
                 */
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
         * Present calendar days.
         */
        $presentDays =
            count($presentDates);

        /*
         * Basic pay remains based on
         * present schedule segments.
         */
        $basicPay =
            $presentSegments * $rate;

        /*
         * Absent days.
         */
        $absentDays = count(
            array_diff_key(
                $scheduledDates,
                $presentDates
            )
        );

        /*
         * Leave calculation.
         */
        $leaveRequests = DB::table(
            'leave_requests'
        )
            ->where(
                'employee_id',
                $employee->id
            )
            ->where(
                'status',
                'approved'
            )
            ->where(
                'start_date',
                '<=',
                $end
            )
            ->where(
                'end_date',
                '>=',
                $start
            )
            ->get();

        foreach ($leaveRequests as $leave) {
            $isPaid = (bool) DB::table(
                'leave_types'
            )
                ->where(
                    'id',
                    $leave->leave_type_id
                )
                ->value('is_paid');

            $day = Carbon::parse(
                $leave->start_date
            );

            $leaveEnd = Carbon::parse(
                $leave->end_date
            );

            while ($day->lte($leaveEnd)) {
                $date =
                    $day->toDateString();

                if (
                    $date >= $start
                    &&
                    $date <= $end
                ) {
                    if ($isPaid) {
                        $paidLeaveDays++;

                        if (
                            (bool)
                            $settings->leave_pay_enabled
                        ) {
                            $leavePay += $rate;
                        }
                    } else {
                        $unpaidLeaveDays++;
                    }
                }

                $day->addDay();
            }
        }

        /*
         * Holiday calculation.
         */
        $holidays = DB::table(
            'holidays'
        )
            ->whereBetween(
                'date',
                [$start, $end]
            )
            ->get();

        foreach ($holidays as $holiday) {
            $holidayDate =
                Carbon::parse(
                    $holiday->date
                )->toDateString();

            if (
                ! isset(
                    $presentDates[$holidayDate]
                )
            ) {
                continue;
            }

            $holidayDays++;

            $multiplier =
                $holiday->type === 'regular'
                ? (float)
                    $settings
                        ->holiday_regular_multiplier
                : (float)
                    $settings
                        ->holiday_special_multiplier;

            if (
                (bool)
                $settings->holiday_pay_enabled
            ) {
                $holidayPay +=
                    $rate
                    *
                    max(
                        0,
                        $multiplier - 1
                    );
            }
        }

        /*
         * ==================================================
         * TOTAL EARNINGS
         * ==================================================
         *
         * IMPORTANT:
         *
         * Tardy is NOT removed here.
         */
        $totalEarnings =
            $basicPay
            + $overtimePay
            + $holidayPay
            + $nightDiffPay
            + $leavePay;

        /*
         * Other deductions.
         */
        $sssDeduction = 0.0;
        $philhealthDeduction = 0.0;
        $pagibigDeduction = 0.0;
        $taxDeduction = 0.0;
        $leaveDeduction = 0.0;
        $otherDeductions = 0.0;

        /*
         * ==================================================
         * TOTAL DEDUCTIONS
         * ==================================================
         *
         * Tardy is explicitly included.
         */
        $totalDeductions =
            $tardyDeduction
            + $sssDeduction
            + $philhealthDeduction
            + $pagibigDeduction
            + $taxDeduction
            + $leaveDeduction
            + $otherDeductions;

        /*
         * ==================================================
         * NET PAY
         * ==================================================
         */
        $netPay =
            $totalEarnings
            - $totalDeductions;

        /*
         * Summary.
         */
        $summary = [
            'presentDays' =>
                $presentDays,

            'absentDays' =>
                $absentDays,

            'leaveDays' =>
                $paidLeaveDays
                + $unpaidLeaveDays,

            'paidLeaveDays' =>
                $paidLeaveDays,

            'unpaidLeaveDays' =>
                $unpaidLeaveDays,

            'holidayDays' =>
                $holidayDays,

            /*
             * Total tardy across ALL schedules.
             *
             * Example:
             * 10 + 4 = 14
             */
            'lateMinutes' =>
                $lateMinutes,

            'tardyMinutes' =>
                $lateMinutes,

            /*
             * Total monetary tardy deduction.
             */
            'tardyDeduction' =>
                $this->money(
                    $tardyDeduction
                ),

            'undertimeMinutes' =>
                $undertimeMinutes,

            'overtimeMinutes' =>
                $overtimeMinutes,

            'nightDiffMinutes' =>
                $nightDiffMinutes,

            'overtimePay' =>
                $this->money(
                    $overtimePay
                ),

            'nightDiffPay' =>
                $this->money(
                    $nightDiffPay
                ),

            'holidayPay' =>
                $this->money(
                    $holidayPay
                ),

            'leavePay' =>
                $this->money(
                    $leavePay
                ),

            'scheduledWorkdays' =>
                count($scheduledDates),

            'paidDays' =>
                $presentDays
                + $paidLeaveDays,

            'totalEarnings' =>
                $this->money(
                    $totalEarnings
                ),

            'totalDeductions' =>
                $this->money(
                    $totalDeductions
                ),

            'netPay' =>
                $this->money(
                    $netPay
                ),

            'scheduleDetails' =>
                $details,
        ];

        /*
         * Payroll item database values.
         */
        return [
            'summary' =>
                $summary,

            'item' => [
                'employee_id' =>
                    $employee->id,

                'scheduled_workdays' =>
                    count($scheduledDates),

                'present_days' =>
                    $presentDays,

                'absent_days' =>
                    $absentDays,

                'leave_days' =>
                    $paidLeaveDays
                    + $unpaidLeaveDays,

                'paid_leave_days' =>
                    $paidLeaveDays,

                'unpaid_leave_days' =>
                    $unpaidLeaveDays,

                'holiday_days' =>
                    $holidayDays,

                /*
                 * TOTAL TARDY MINUTES.
                 */
                'late_minutes' =>
                    $lateMinutes,

                'undertime_minutes' =>
                    $undertimeMinutes,

                'overtime_minutes' =>
                    $overtimeMinutes,

                'night_diff_minutes' =>
                    $nightDiffMinutes,

                /*
                 * Basic pay is NOT reduced by tardy.
                 */
                'basic_pay' =>
                    $this->money(
                        $basicPay
                    ),

                'overtime_pay' =>
                    $this->money(
                        $overtimePay
                    ),

                'holiday_pay' =>
                    $this->money(
                        $holidayPay
                    ),

                'night_diff' =>
                    $this->money(
                        $nightDiffPay
                    ),

                'leave_pay' =>
                    $this->money(
                        $leavePay
                    ),

                'bonus' =>
                    0,

                /*
                 * Existing deductions.
                 */
                'sss_deduction' =>
                    $this->money(
                        $sssDeduction
                    ),

                'philhealth_deduction' =>
                    $this->money(
                        $philhealthDeduction
                    ),

                'pagibig_deduction' =>
                    $this->money(
                        $pagibigDeduction
                    ),

                'tax_deduction' =>
                    $this->money(
                        $taxDeduction
                    ),

                'leave_deduction' =>
                    $this->money(
                        $leaveDeduction
                    ),

                'other_deductions' =>
                    $this->money(
                        $otherDeductions
                    ),

                /*
                 * NEW DATABASE COLUMN.
                 *
                 * This is the actual money deducted
                 * because of tardiness.
                 */
                'tardy_deduction' =>
                    $this->money(
                        $tardyDeduction
                    ),

                /*
                 * Final payroll values.
                 */
                'total_earnings' =>
                    $this->money(
                        $totalEarnings
                    ),

                'total_deductions' =>
                    $this->money(
                        $totalDeductions
                    ),

                'net_pay' =>
                    $this->money(
                        $netPay
                    ),
            ],

            'calculatedTotalEarnings' =>
                $this->money(
                    $totalEarnings
                ),

            'calculatedTotalDeductions' =>
                $this->money(
                    $totalDeductions
                ),

            'calculatedNetPay' =>
                $this->money(
                    $netPay
                ),
        ];
    }

    /**
     * Calculate paid regular minutes.
     *
     * Break is deducted only when the actual attendance
     * overlaps the scheduled break.
     */
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

        /*
         * Break is positioned immediately before
         * scheduled end.
         */
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

    /**
     * Calculate NSD minutes.
     */
    private function calculateNightDiffMinutes(
        CarbonInterface $actualIn,
        CarbonInterface $actualOut,
        CarbonInterface $scheduleStart,
        CarbonInterface $scheduleEnd,
        int $scheduledMinutes,
        int $breakMinutes,
        int $overtimeMinutes,
        PayrollSetting $settings
    ): int {
        if (
            ! (bool)
                $settings->night_diff_enabled
            ||
            $actualOut->lessThanOrEqualTo(
                $actualIn
            )
        ) {
            return 0;
        }

        $overtimeEnd =
            $scheduleEnd->copy()
                ->addMinutes(
                    max(
                        0,
                        $overtimeMinutes
                    )
                );

        $total = 0;

        $baseDay =
            $scheduleStart
                ->copy()
                ->startOfDay();

        for (
            $offset = -1;
            $offset <= 2;
            $offset++
        ) {
            $day =
                $baseDay
                    ->copy()
                    ->addDays($offset);

            $window =
                $this->nightWindow(
                    $day,
                    (string)
                        $settings->night_diff_start,
                    (string)
                        $settings->night_diff_end
                );

            $workedNight =
                $this->overlap(
                    $actualIn,
                    $actualOut,
                    $window['from'],
                    $window['to']
                );

            if ($workedNight <= 0) {
                continue;
            }

            $scheduledNight =
                $this->overlap(
                    $scheduleStart,
                    $scheduleEnd,
                    $window['from'],
                    $window['to']
                );

            $overtimeNight =
                $this->overlap(
                    $scheduleEnd,
                    $overtimeEnd,
                    $window['from'],
                    $window['to']
                );

            $scheduledEligible =
                min(
                    $scheduledNight,
                    $scheduledMinutes
                );

            $breakToRemove =
                min(
                    $breakMinutes,
                    $scheduledEligible
                );

            $paidScheduledNight =
                max(
                    0,
                    $scheduledEligible
                    - $breakToRemove
                );

            $total += min(
                $workedNight,
                $paidScheduledNight
                + $overtimeNight
            );
        }

        return max(
            0,
            (int) round($total)
        );
    }

    /**
     * Build schedule datetime bounds.
     */
    private function bounds(
        string $date,
        string $start,
        string $end
    ): array {
        $from = Carbon::parse(
            $date
            . ' '
            . substr(
                $start,
                0,
                5
            )
        );

        $to = Carbon::parse(
            $date
            . ' '
            . substr(
                $end,
                0,
                5
            )
        );

        /*
         * Overnight schedule.
         */
        if (
            $this->timeMinutes($end)
            <=
            $this->timeMinutes($start)
        ) {
            $to->addDay();
        }

        return [
            'from' =>
                $from,

            'to' =>
                $to,
        ];
    }

    /**
     * Build actual attendance datetime bounds.
     */
    private function attendanceBounds(
        $timeIn,
        $timeOut
    ): ?array {
        if (
            ! $timeIn
            ||
            ! $timeOut
        ) {
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

        /*
         * Overnight attendance.
         */
        if (
            $to->lessThanOrEqualTo($from)
        ) {
            $to->addDay();
        }

        return [
            'from' =>
                $from,

            'to' =>
                $to,
        ];
    }

    /**
     * Build NSD window.
     */
    private function nightWindow(
        CarbonInterface $date,
        string $start,
        string $end
    ): array {
        $day =
            $date->toDateString();

        $from =
            Carbon::parse(
                $day
                . ' '
                . substr(
                    $start,
                    0,
                    5
                )
            );

        $to =
            Carbon::parse(
                $day
                . ' '
                . substr(
                    $end,
                    0,
                    5
                )
            );

        if (
            $this->timeMinutes($end)
            <=
            $this->timeMinutes($start)
        ) {
            $to->addDay();
        }

        return [
            'from' =>
                $from,

            'to' =>
                $to,
        ];
    }

    /**
     * Convert HH:MM to minutes.
     */
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
                substr(
                    $value,
                    0,
                    5
                )
            )
        );

        return ($hours * 60)
            + $minutes;
    }

    /**
     * Duration in whole minutes.
     */
    private function duration(
        CarbonInterface $start,
        CarbonInterface $end
    ): int {
        return max(
            0,
            (int) round(
                $start->diffInSeconds(
                    $end
                ) / 60
            )
        );
    }

    /**
     * Difference between two datetimes.
     */
    private function roundedMinutesBetween(
        CarbonInterface $from,
        CarbonInterface $to
    ): int {
        return (int) round(
            $from->diffInSeconds(
                $to
            ) / 60
        );
    }

    /**
     * Return overlapping minutes.
     */
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

    /**
     * Money rounding.
     */
    private function money(
        float $value
    ): float {
        return (float) number_format(
            $value,
            2,
            '.',
            ''
        );
    }
}