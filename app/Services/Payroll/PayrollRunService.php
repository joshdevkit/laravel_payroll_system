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
    public function createDraft(string $cutoffStart, string $cutoffEnd, string $payDate): PayrollRun
    {
        return DB::transaction(function () use ($cutoffStart, $cutoffEnd, $payDate) {
            $settings = PayrollSetting::query()->findOrFail(1);

            $run = PayrollRun::create([
                'cutoff_start' => $cutoffStart,
                'cutoff_end' => $cutoffEnd,
                'pay_date' => $payDate,
                'status' => 'draft',
                'settings_snapshot' => $settings->toArray(),
            ]);

            $this->buildItems($run, $settings);

            return $run->load(['items.employee', 'items.scheduleDetails']);
        });
    }

    public function ensureItems(PayrollRun $run): PayrollRun
    {
        if ($run->status !== 'draft') {
            return $run->load(['items.employee', 'items.scheduleDetails']);
        }

        $employeeIds = Employee::query()->pluck('id');
        $existingEmployeeIds = $run->items()->pluck('employee_id');
        $missingEmployees = $employeeIds->diff($existingEmployeeIds);

        if ($missingEmployees->isEmpty()) {
            return $run->load(['items.employee', 'items.scheduleDetails']);
        }

        return DB::transaction(function () use ($run) {
            $settings = PayrollSetting::query()->findOrFail(1);
            $this->buildItems($run, $settings);

            return $run->fresh(['items.employee', 'items.scheduleDetails']);
        });
    }

    private function buildItems(PayrollRun $run, PayrollSetting $settings): void
    {
        $start = Carbon::parse($run->cutoff_start)->toDateString();
        $end = Carbon::parse($run->cutoff_end)->toDateString();

        $employees = Employee::query()
            ->orderBy('full_name')
            ->get();

        foreach ($employees as $employee) {
            $calculated = $this->calculateEmployee($run, $settings, $employee, $start, $end);

            $item = PayrollItem::updateOrCreate(
                [
                    'payroll_run_id' => $run->id,
                    'employee_id' => $employee->id,
                ],
                array_merge($calculated['item'], [
                    'calculation_snapshot' => $calculated['summary'],
                ]),
            );

            $item->scheduleDetails()->delete();

            foreach ($calculated['summary']['scheduleDetails'] as $detail) {
                PayrollScheduleDetail::create([
                    'payroll_item_id' => $item->id,
                    'work_date' => $detail['date'],
                    'segment_no' => $detail['segmentNo'],
                    'scheduled_start' => $detail['scheduledStart'],
                    'scheduled_end' => $detail['scheduledEnd'],
                    'actual_in' => $detail['actualIn'],
                    'actual_out' => $detail['actualOut'],
                    'scheduled_minutes' => $detail['scheduledMinutes'],
                    'break_minutes' => $detail['breakMinutes'],
                    'worked_minutes' => $detail['workedMinutes'],
                    'late_minutes' => $detail['lateMinutes'],
                    'undertime_minutes' => $detail['undertimeMinutes'],
                    'overtime_minutes' => $detail['overtimeMinutes'],
                    'night_diff_minutes' => $detail['nightDiffMinutes'],
                    'is_present' => $detail['isPresent'],
                    'overtime_pay' => $detail['overtimePay'],
                    'night_diff_pay' => $detail['nightDiffPay'],
                    'calculation_notes' => null,
                ]);
            }
        }
    }

    /**
     * Port of payroll_system_v1's V2 payroll calculation.
     *
     * The important rules here are intentionally kept separate from
     * persistence so the same calculation can be used for payroll items
     * and attendance summaries.
     */
    private function calculateEmployee(
        PayrollRun $run,
        PayrollSetting $settings,
        Employee $employee,
        string $start,
        string $end,
    ): array {
        $rate = $employee->rate_type === 'daily'
            ? (float) ($employee->daily_rate ?? $employee->basic_rate ?? 0)
            : (float) ($employee->basic_rate ?? 0) / max(1, (float) $settings->monthly_daily_rate_divisor);

        $schedules = EmployeeSchedule::query()
            ->where('employee_id', $employee->id)
            ->whereBetween('work_date', [$start, $end])
            ->where('is_working_day', true)
            ->orderBy('work_date')
            ->orderBy('segment_no')
            ->get();

        $attendance = Attendance::query()
            ->where('employee_id', $employee->id)
            ->whereBetween('work_date', [
                Carbon::parse($start)->subDay()->toDateString(),
                Carbon::parse($end)->addDay()->toDateString(),
            ])
            ->get();

        $details = [];
        $usedAttendance = [];
        $presentDates = [];
        $scheduledDates = [];

        $regularPaidMinutes = 0;
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

        foreach ($schedules as $schedule) {
            $date = Carbon::parse($schedule->work_date)->toDateString();
            $scheduledDates[$date] = true;

            $scheduleTime = $this->bounds(
                $date,
                (string) $schedule->start_time,
                (string) $schedule->end_time,
            );

            $grossMinutes = $this->duration($scheduleTime['from'], $scheduleTime['to']);
            $scheduledMinutes = max(
                0,
                $grossMinutes - min((int) $schedule->break_minutes, $grossMinutes),
            );

            $record = null;

            foreach ($attendance as $candidate) {
                if (isset($usedAttendance[$candidate->id])) {
                    continue;
                }

                if (
                    Carbon::parse($candidate->work_date)->toDateString() !== $date ||
                    (int) $candidate->segment_no !== (int) $schedule->segment_no ||
                    $candidate->status !== 'present'
                ) {
                    continue;
                }

                $actual = $this->attendanceBounds($candidate->time_in, $candidate->time_out);

                if (! $actual) {
                    continue;
                }

                if (
                    $this->overlap(
                        $actual['from'],
                        $actual['to'],
                        $scheduleTime['from'],
                        $scheduleTime['to'],
                    ) > 0
                ) {
                    $record = $candidate;
                    break;
                }
            }

            if (! $record) {
                $details[] = [
                    'date' => $date,
                    'segmentNo' => (int) $schedule->segment_no,
                    'start' => substr((string) $schedule->start_time, 0, 5),
                    'end' => substr((string) $schedule->end_time, 0, 5),
                    'scheduledStart' => $scheduleTime['from'],
                    'scheduledEnd' => $scheduleTime['to'],
                    'scheduledMinutes' => $scheduledMinutes,
                    'breakMinutes' => (int) $schedule->break_minutes,
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

            $actual = $this->attendanceBounds($record->time_in, $record->time_out);

            if (! $actual) {
                continue;
            }

            $usedAttendance[$record->id] = true;
            $presentSegments++;

            $workedMinutes = $this->overlap(
                $actual['from'],
                $actual['to'],
                $scheduleTime['from'],
                $scheduleTime['to'],
            );

            $regularMinutes = $this->calculateRegularPaidMinutes(
                $actual['from'],
                $actual['to'],
                $scheduleTime['from'],
                $scheduleTime['to'],
                (int) $schedule->break_minutes,
            );

            $regularPaidMinutes += $regularMinutes;

            $late = max(
                0,
                $this->roundedMinutesBetween($scheduleTime['from'], $actual['from'])
                    - (int) $settings->late_grace_minutes,
            );

            $undertime = max(
                0,
                $this->roundedMinutesBetween($actual['to'], $scheduleTime['to']),
            );

            $rawOvertime = max(
                0,
                $this->roundedMinutesBetween($scheduleTime['to'], $actual['to']),
            );

            $overtime = (bool) $settings->overtime_enabled
                && $rawOvertime >= max(0, (int) $settings->overtime_threshold_minutes)
                ? $rawOvertime
                : 0;

            $hourlyRate = (float) $settings->daily_work_hours > 0
                ? $rate / (float) $settings->daily_work_hours
                : 0;

            $nsd = $this->calculateNightDiffMinutes(
                $actual['from'],
                $actual['to'],
                $scheduleTime['from'],
                $scheduleTime['to'],
                $scheduledMinutes,
                (int) $schedule->break_minutes,
                $overtime,
                $settings,
            );

            $segmentOvertimePay = ($overtime / 60) * $hourlyRate * (float) $settings->overtime_multiplier;
            $segmentNightDiffPay = ($nsd / 60) * $hourlyRate * (float) $settings->night_diff_multiplier;

            $presentDates[$date] = true;
            $lateMinutes += $late;
            $undertimeMinutes += $undertime;
            $overtimeMinutes += $overtime;
            $nightDiffMinutes += $nsd;
            $overtimePay += $segmentOvertimePay;
            $nightDiffPay += $segmentNightDiffPay;

            $details[] = [
                'date' => $date,
                'segmentNo' => (int) $schedule->segment_no,
                'start' => substr((string) $schedule->start_time, 0, 5),
                'end' => substr((string) $schedule->end_time, 0, 5),
                'scheduledStart' => $scheduleTime['from'],
                'scheduledEnd' => $scheduleTime['to'],
                'scheduledMinutes' => $scheduledMinutes,
                'breakMinutes' => (int) $schedule->break_minutes,
                'workedMinutes' => $workedMinutes,
                'regularMinutes' => $regularMinutes,
                'actualIn' => $record->time_in,
                'actualOut' => $record->time_out,
                'lateMinutes' => $late,
                'undertimeMinutes' => $undertime,
                'overtimeMinutes' => $overtime,
                'nightDiffMinutes' => $nsd,
                'isPresent' => true,
                'overtimePay' => $this->money($segmentOvertimePay),
                'nightDiffPay' => $this->money($segmentNightDiffPay),
            ];
        }

        $presentDays = count($presentDates);
        $dailyWorkMinutes = max(0, (float) $settings->daily_work_hours * 60);

        // A present schedule segment earns one daily-rate equivalent.
        // This is important for split shifts: an employee working both
        // 8 AM-5 PM and 7 PM-3 AM earns two daily-rate equivalents (₱1,000
        // at a ₱500 daily rate). Breaks remain excluded from worked/NSD
        // minutes and do not reduce the daily-rate equivalent of a present
        // scheduled segment.
        $basicPay = $presentSegments * $rate;

        $absentDays = count(array_diff_key($scheduledDates, $presentDates));

        $leaveRequests = DB::table('leave_requests')
            ->where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->where('start_date', '<=', $end)
            ->where('end_date', '>=', $start)
            ->get();

        foreach ($leaveRequests as $leave) {
            $isPaid = (bool) DB::table('leave_types')
                ->where('id', $leave->leave_type_id)
                ->value('is_paid');

            $day = Carbon::parse($leave->start_date);
            $leaveEnd = Carbon::parse($leave->end_date);

            while ($day->lte($leaveEnd)) {
                $date = $day->toDateString();

                if ($date >= $start && $date <= $end) {
                    if ($isPaid) {
                        $paidLeaveDays++;

                        if ((bool) $settings->leave_pay_enabled) {
                            $leavePay += $rate;
                        }
                    } else {
                        $unpaidLeaveDays++;
                    }
                }

                $day->addDay();
            }
        }

        $holidays = DB::table('holidays')
            ->whereBetween('date', [$start, $end])
            ->get();

        foreach ($holidays as $holiday) {
            $holidayDate = Carbon::parse($holiday->date)->toDateString();

            if (! isset($presentDates[$holidayDate])) {
                continue;
            }

            $holidayDays++;

            $multiplier = $holiday->type === 'regular'
                ? (float) $settings->holiday_regular_multiplier
                : (float) $settings->holiday_special_multiplier;

            if ((bool) $settings->holiday_pay_enabled) {
                $holidayPay += $rate * max(0, $multiplier - 1);
            }
        }

        $totalEarnings = $basicPay + $overtimePay + $holidayPay + $nightDiffPay + $leavePay;

        $summary = [
            'presentDays' => $presentDays,
            'absentDays' => $absentDays,
            'leaveDays' => $paidLeaveDays + $unpaidLeaveDays,
            'paidLeaveDays' => $paidLeaveDays,
            'unpaidLeaveDays' => $unpaidLeaveDays,
            'holidayDays' => $holidayDays,
            'lateMinutes' => $lateMinutes,
            'undertimeMinutes' => $undertimeMinutes,
            'overtimeMinutes' => $overtimeMinutes,
            'nightDiffMinutes' => $nightDiffMinutes,
            'overtimePay' => $this->money($overtimePay),
            'nightDiffPay' => $this->money($nightDiffPay),
            'holidayPay' => $this->money($holidayPay),
            'leavePay' => $this->money($leavePay),
            'scheduledWorkdays' => count($scheduledDates),
            'paidDays' => $presentDays + $paidLeaveDays,
            'scheduleDetails' => $details,
        ];

        return [
            'summary' => $summary,
            'item' => [
                'employee_id' => $employee->id,
                'scheduled_workdays' => count($scheduledDates),
                'present_days' => $presentDays,
                'absent_days' => $absentDays,
                'leave_days' => $paidLeaveDays + $unpaidLeaveDays,
                'paid_leave_days' => $paidLeaveDays,
                'unpaid_leave_days' => $unpaidLeaveDays,
                'holiday_days' => $holidayDays,
                'late_minutes' => $lateMinutes,
                'undertime_minutes' => $undertimeMinutes,
                'overtime_minutes' => $overtimeMinutes,
                'night_diff_minutes' => $nightDiffMinutes,
                'basic_pay' => $this->money($basicPay),
                'overtime_pay' => $this->money($overtimePay),
                'holiday_pay' => $this->money($holidayPay),
                'night_diff' => $this->money($nightDiffPay),
                'leave_pay' => $this->money($leavePay),
                'bonus' => 0,
                'sss_deduction' => 0,
                'philhealth_deduction' => 0,
                'pagibig_deduction' => 0,
                'tax_deduction' => 0,
                'leave_deduction' => 0,
                'other_deductions' => 0,
            ],
            'calculatedTotalEarnings' => $this->money($totalEarnings),
        ];
    }

    private function calculateRegularPaidMinutes(
        CarbonInterface $actualIn,
        CarbonInterface $actualOut,
        CarbonInterface $scheduleStart,
        CarbonInterface $scheduleEnd,
        int $breakMinutes,
    ): int {
        $workedMinutes = $this->overlap($actualIn, $actualOut, $scheduleStart, $scheduleEnd);

        if ($workedMinutes <= 0 || $breakMinutes <= 0) {
            return max(0, $workedMinutes);
        }

        $breakDuration = min($breakMinutes, $this->duration($scheduleStart, $scheduleEnd));
        $breakEnd = $scheduleEnd->copy();
        $breakStart = $breakEnd->copy()->subMinutes($breakDuration);

        $actualBreakMinutes = $this->overlap(
            $actualIn,
            $actualOut,
            $breakStart,
            $breakEnd,
        );

        return max(0, $workedMinutes - $actualBreakMinutes);
    }

    private function calculateNightDiffMinutes(
        CarbonInterface $actualIn,
        CarbonInterface $actualOut,
        CarbonInterface $scheduleStart,
        CarbonInterface $scheduleEnd,
        int $scheduledMinutes,
        int $breakMinutes,
        int $overtimeMinutes,
        PayrollSetting $settings,
    ): int {
        if (! (bool) $settings->night_diff_enabled || $actualOut->lessThanOrEqualTo($actualIn)) {
            return 0;
        }

        $overtimeEnd = $scheduleEnd->copy()->addMinutes(max(0, $overtimeMinutes));
        $total = 0;

        // Same bounded-window algorithm as payroll_system_v1. This avoids
        // iterating once per minute while preserving the exact overlap rule.
        $baseDay = $scheduleStart->copy()->startOfDay();

        for ($offset = -1; $offset <= 2; $offset++) {
            $day = $baseDay->copy()->addDays($offset);
            $window = $this->nightWindow(
                $day,
                (string) $settings->night_diff_start,
                (string) $settings->night_diff_end,
            );

            $workedNight = $this->overlap(
                $actualIn,
                $actualOut,
                $window['from'],
                $window['to'],
            );

            if ($workedNight <= 0) {
                continue;
            }

            $scheduledNight = $this->overlap(
                $scheduleStart,
                $scheduleEnd,
                $window['from'],
                $window['to'],
            );

            $overtimeNight = $this->overlap(
                $scheduleEnd,
                $overtimeEnd,
                $window['from'],
                $window['to'],
            );

            $scheduledEligible = min($scheduledNight, $scheduledMinutes);
            $breakToRemove = min($breakMinutes, $scheduledEligible);
            $paidScheduledNight = max(0, $scheduledEligible - $breakToRemove);

            $total += min($workedNight, $paidScheduledNight + $overtimeNight);
        }

        return max(0, (int) round($total));
    }

    private function bounds(string $date, string $start, string $end): array
    {
        $from = Carbon::parse($date . ' ' . substr($start, 0, 5));
        $to = Carbon::parse($date . ' ' . substr($end, 0, 5));

        if ($this->timeMinutes($end) <= $this->timeMinutes($start)) {
            $to->addDay();
        }

        return ['from' => $from, 'to' => $to];
    }

    private function attendanceBounds($timeIn, $timeOut): ?array
    {
        if (! $timeIn || ! $timeOut) {
            return null;
        }

        $from = $timeIn instanceof CarbonInterface ? $timeIn->copy() : Carbon::parse($timeIn);
        $to = $timeOut instanceof CarbonInterface ? $timeOut->copy() : Carbon::parse($timeOut);

        if ($to->lessThanOrEqualTo($from)) {
            $to->addDay();
        }

        return ['from' => $from, 'to' => $to];
    }

    private function nightWindow(CarbonInterface $date, string $start, string $end): array
    {
        $day = $date->toDateString();
        $from = Carbon::parse($day . ' ' . substr($start, 0, 5));
        $to = Carbon::parse($day . ' ' . substr($end, 0, 5));

        if ($this->timeMinutes($end) <= $this->timeMinutes($start)) {
            $to->addDay();
        }

        return ['from' => $from, 'to' => $to];
    }

    private function timeMinutes(string $value): int
    {
        [$hours, $minutes] = array_map('intval', explode(':', substr($value, 0, 5)));

        return ($hours * 60) + $minutes;
    }

    private function duration(CarbonInterface $start, CarbonInterface $end): int
    {
        return max(0, (int) round($start->diffInSeconds($end) / 60));
    }

    private function roundedMinutesBetween(CarbonInterface $from, CarbonInterface $to): int
    {
        return (int) round($from->diffInSeconds($to) / 60);
    }

    private function overlap(
        CarbonInterface $a,
        CarbonInterface $b,
        CarbonInterface $c,
        CarbonInterface $d,
    ): int {
        $start = max($a->getTimestamp(), $c->getTimestamp());
        $end = min($b->getTimestamp(), $d->getTimestamp());

        return max(0, (int) round(($end - $start) / 60));
    }

    private function money(float $value): float
    {
        return (float) number_format($value, 2, '.', '');
    }
}
