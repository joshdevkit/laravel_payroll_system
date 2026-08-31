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
        $existingEmployeeIds = $run->items()->pluck('employee_id');

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
                ),
            );

            $item->scheduleDetails()->delete();

            foreach (
                $calculated['summary']['scheduleDetails']
                as $detail
            ) {
                PayrollScheduleDetail::create([
                    'payroll_item_id' => $item->id,
                    'work_date' => $detail['date'],
                    'segment_no' => $detail['segmentNo'],
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
                    'calculation_notes' => null,
                ]);
            }
        }
    }

    /**
     * Calculate one employee's payroll.
     *
     * Important rules:
     *
     * - Basic pay is based on PRESENT SCHEDULE SEGMENTS.
     * - A split shift can therefore contain multiple paid
     *   schedule segments.
     * - NSD is additional compensation.
     * - Tardy is a SEPARATE deduction.
     * - Tardy does NOT reduce basic_pay.
     * - Tardy is calculated from employee_schedule start_time
     *   versus actual attendance time_in.
     * - Total deductions include tardy.
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
         * Date-specific employee schedules.
         */
        $schedules = EmployeeSchedule::query()
            ->where('employee_id', $employee->id)
            ->whereBetween(
                'work_date',
                [$start, $end]
            )
            ->where('is_working_day', true)
            ->orderBy('work_date')
            ->orderBy('segment_no')
            ->get();

        /*
         * Include one day before and one day after the cutoff
         * because an overnight shift may cross midnight.
         */
        $attendance = Attendance::query()
            ->where('employee_id', $employee->id)
            ->whereBetween('work_date', [
                Carbon::parse($start)
                    ->subDay()
                    ->toDateString(),

                Carbon::parse($end)
                    ->addDay()
                    ->toDateString(),
            ])
            ->get();

        $details = [];

        $usedAttendance = [];

        $presentDates = [];
        $scheduledDates = [];

        /*
         * Keep the existing split-shift basic-pay behavior.
         *
         * One successfully matched schedule segment =
         * one daily-rate equivalent.
         */
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
         * Total tardy deduction.
         *
         * This is kept separate from basic pay.
         */
        $tardyDeduction = 0.0;

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
             * Scheduled paid minutes after the schedule's break.
             *
             * This is used for NSD eligibility.
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
             * Match attendance to the EXACT schedule:
             *
             * - employee
             * - work date
             * - segment number
             * - present status
             * - actual attendance overlaps schedule
             */
            foreach ($attendance as $candidate) {
                if (isset($usedAttendance[$candidate->id])) {
                    continue;
                }

                if (
                    Carbon::parse(
                        $candidate->work_date
                    )->toDateString() !== $date
                    ||
                    (int) $candidate->segment_no
                    !== (int) $schedule->segment_no
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
             * No attendance record for this schedule.
             */
            if (! $record) {
                $details[] = [
                    'date' => $date,
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

                    'workedMinutes' => 0,
                    'regularMinutes' => 0,

                    'actualIn' => null,
                    'actualOut' => null,

                    'lateMinutes' => 0,
                    'undertimeMinutes' => 0,
                    'overtimeMinutes' => 0,
                    'nightDiffMinutes' => 0,

                    'isPresent' => false,

                    'overtimePay' => 0,
                    'nightDiffPay' => 0,
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

            /*
             * IMPORTANT:
             *
             * Keep this as one PRESENT SEGMENT.
             *
             * This preserves the existing payroll behavior
             * where Joshua's:
             *
             * 8 AM - 5 PM
             * 7 PM - 3 AM
             *
             * can represent two paid schedule segments.
             */
            $presentSegments++;

            /*
             * Actual worked time inside this schedule.
             */
            $workedMinutes = $this->overlap(
                $actual['from'],
                $actual['to'],
                $scheduleTime['from'],
                $scheduleTime['to']
            );

            /*
             * Regular minutes are used for attendance detail.
             *
             * The scheduled break is only removed when the
             * actual attendance overlaps the break period.
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
 * TARDY
 *
 * Calculate tardy strictly from the scheduled START TIME
 * and the employee's actual TIME-IN.
 *
 * Example:
 *
 * Scheduled: 08:00
 * Actual:    08:10
 *
 * Tardy = 10 minutes
 *
 * Daily rate:
 * ₱500 / 8 hours = ₱62.50/hour
 * ₱62.50 / 60 = ₱1.041666/minute
 *
 * 10 × ₱1.041666 = ₱10.42
 */

            /*
 * Get the scheduled start clock time.
 */
            $scheduledStartMinutes =
                $this->timeMinutes(
                    (string) $schedule->start_time
                );

            /*
 * Get the actual TIME-IN clock time.
 */
            $actualTimeIn = Carbon::parse(
                $record->time_in
            );

            $actualStartMinutes =
                ($actualTimeIn->hour * 60)
                + $actualTimeIn->minute;

            /*
 * Raw tardy.
 *
 * Only count minutes when the employee actually
 * clocked in AFTER the scheduled start.
 */
            $late = max(
                0,
                $actualStartMinutes
                    - $scheduledStartMinutes
            );

            /*
 * Apply grace period.
 *
 * Example:
 * 10 minutes late
 * 0 minute grace
 * = 10 tardy minutes
 *
 * If grace is 5:
 * 10 - 5 = 5 tardy minutes
 */
            $late = max(
                0,
                $late
                    - max(
                        0,
                        (int) $settings->late_grace_minutes
                    )
            );

            /*
 * Tardy deduction.
 *
 * ₱500 / 8 = ₱62.50/hour
 * ₱62.50 / 60 = ₱1.041666/minute
 */
            $dailyWorkHours = max(
                1,
                (float) $settings->daily_work_hours
            );

            $hourlyRate =
                $rate / $dailyWorkHours;

            $tardyPerMinute =
                $hourlyRate / 60;

            $segmentTardyDeduction =
                $late * $tardyPerMinute;

            $tardyDeduction +=
                $segmentTardyDeduction;

            /*
             * Tardy deduction:
             *
             * ₱500 / 8 hours = ₱62.50/hour
             *
             * ₱62.50 / 60 = ₱1.041666/minute
             *
             * 10 minutes:
             *
             * ₱1.041666 × 10 = ₱10.42
             *
             * IMPORTANT:
             * This does NOT reduce basic_pay.
             */
            $hourlyRate = (float) $settings->daily_work_hours > 0
                ? $rate / (float) $settings->daily_work_hours
                : 0;

            $tardyPerMinute = $hourlyRate / 60;

            $segmentTardyDeduction =
                $late * $tardyPerMinute;

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
             * Overtime begins after scheduled end.
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
             * Night Shift Differential.
             *
             * NSD is an additional compensation:
             *
             * hourly rate × NSD multiplier × eligible NSD hours.
             *
             * Example:
             *
             * ₱500 / 8 = ₱62.50
             *
             * ₱62.50 × 10% = ₱6.25/hour
             *
             * 5 hours in NSD window
             * less 1-hour break
             * = 4 eligible hours
             *
             * ₱6.25 × 4 = ₱25.00
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

            $overtimePay +=
                $segmentOvertimePay;

            $nightDiffPay +=
                $segmentNightDiffPay;

            $details[] = [
                'date' => $date,

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
                 * Keep tardy calculation visible in
                 * the calculation snapshot even though
                 * payroll_schedule_details does not
                 * currently have a tardy_deduction column.
                 */
                'tardyDeduction' =>
                $this->money(
                    $segmentTardyDeduction
                ),
            ];
        }

        /*
         * Present days remain CALENDAR DAYS.
         *
         * Multiple schedule segments on the same date
         * still count as one present day.
         */
        $presentDays = count($presentDates);

        /*
         * IMPORTANT:
         *
         * Do NOT use regularPaidMinutes here.
         *
         * The previous change caused Joshua's earnings
         * to become ₱921.88.
         *
         * The existing intended behavior is:
         *
         * present schedule segment × daily rate.
         *
         * Therefore:
         *
         * 2 present segments × ₱500
         * = ₱1,000 basic pay.
         */
        $basicPay =
            $presentSegments * $rate;

        /*
         * Scheduled dates that have no attendance.
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
                $date = $day->toDateString();

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
         *
         * Only the additional holiday premium is added.
         * Basic pay already contains the regular amount.
         */
        $holidays = DB::table('holidays')
            ->whereBetween(
                'date',
                [$start, $end]
            )
            ->get();

        foreach ($holidays as $holiday) {
            $holidayDate = Carbon::parse(
                $holiday->date
            )->toDateString();

            if (! isset(
                $presentDates[$holidayDate]
            )) {
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
         * TOTAL EARNINGS
         *
         * Tardy is NOT deducted here.
         */
        $totalEarnings =
            $basicPay
            + $overtimePay
            + $holidayPay
            + $nightDiffPay
            + $leavePay;

        /*
         * Other deductions currently configured
         * by this service.
         */
        $sssDeduction = 0.0;
        $philhealthDeduction = 0.0;
        $pagibigDeduction = 0.0;
        $taxDeduction = 0.0;
        $leaveDeduction = 0.0;
        $otherDeductions = 0.0;

        /*
         * TOTAL DEDUCTIONS
         *
         * Tardy is now included.
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
         * NET PAY
         */
        $netPay =
            $totalEarnings
            - $totalDeductions;

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

            'lateMinutes' =>
            $lateMinutes,

            'tardyMinutes' =>
            $lateMinutes,

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

                'late_minutes' =>
                $lateMinutes,

                'undertime_minutes' =>
                $undertimeMinutes,

                'overtime_minutes' =>
                $overtimeMinutes,

                'night_diff_minutes' =>
                $nightDiffMinutes,

                /*
                 * BASIC PAY IS PRESERVED.
                 *
                 * Joshua:
                 * 2 present segments × ₱500
                 * = ₱1,000.
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
                 * If your payroll_items table contains these
                 * columns, they will persist the calculated
                 * tardy/earnings values directly.
                 *
                 * The existing service's generated columns
                 * can also derive these from the component
                 * columns if your migration defines them
                 * as generated columns.
                 */
                'tardy_deduction' =>
                $this->money(
                    $tardyDeduction
                ),

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
     * The break is only deducted when the actual attendance
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

        /*
         * Break is positioned immediately before
         * the scheduled end.
         *
         * Example:
         *
         * 08:00-17:00
         * 60 minute break
         *
         * => 16:00-17:00
         *
         * For the payroll's schedule definition,
         * this preserves the existing break behavior.
         */
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

    /**
     * Calculate NSD minutes.
     *
     * NSD:
     *
     *   hourly rate × NSD multiplier × NSD hours
     *
     * The scheduled break is removed from the scheduled
     * NSD eligibility.
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

        /*
         * Extend the NSD calculation through approved
         * overtime.
         */
        $overtimeEnd =
            $scheduleEnd->copy()
            ->addMinutes(
                max(
                    0,
                    $overtimeMinutes
                )
            );

        $total = 0;

        /*
         * Check night windows around the schedule.
         *
         * This handles overnight schedules such as:
         *
         * 7 PM - 3 AM
         */
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

            /*
             * Actual time inside NSD window.
             */
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

            /*
             * Scheduled portion inside NSD.
             */
            $scheduledNight =
                $this->overlap(
                    $scheduleStart,
                    $scheduleEnd,
                    $window['from'],
                    $window['to']
                );

            /*
             * Overtime portion inside NSD.
             */
            $overtimeNight =
                $this->overlap(
                    $scheduleEnd,
                    $overtimeEnd,
                    $window['from'],
                    $window['to']
                );

            /*
             * Only scheduled paid minutes are eligible.
             */
            $scheduledEligible =
                min(
                    $scheduledNight,
                    $scheduledMinutes
                );

            /*
             * Remove the schedule break.
             *
             * Example:
             *
             * 10 PM - 3 AM = 5 NSD hours
             * less 1 hour break
             * = 4 NSD hours
             */
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

            /*
             * Actual NSD cannot exceed eligible scheduled
             * NSD plus eligible overtime NSD.
             */
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
     *
     * If end time is equal to or earlier than start time,
     * the schedule crosses midnight.
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
            'from' => $from,
            'to' => $to,
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

        /*
         * Overnight NSD window.
         *
         * Example:
         *
         * 22:00 - 06:00
         */
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

    /**
     * Convert HH:MM into minutes from midnight.
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
     * Difference between two datetimes in whole minutes.
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
     * Return overlapping minutes between two datetime ranges.
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
