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

    /**
     * Ensure an existing draft contains an item for every employee.
     * This also repairs drafts created before payroll item generation was fixed.
     */
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
            $schedules = EmployeeSchedule::query()
                ->where('employee_id', $employee->id)
                ->whereBetween('work_date', [$start, $end])
                ->orderBy('work_date')
                ->orderBy('segment_no')
                ->get();

            $item = PayrollItem::firstOrCreate(
                [
                    'payroll_run_id' => $run->id,
                    'employee_id' => $employee->id,
                ],
                [
                    'scheduled_workdays' => 0,
                    'present_days' => 0,
                    'absent_days' => 0,
                    'leave_days' => 0,
                    'paid_leave_days' => 0,
                    'unpaid_leave_days' => 0,
                    'holiday_days' => 0,
                    'late_minutes' => 0,
                    'undertime_minutes' => 0,
                    'overtime_minutes' => 0,
                    'night_diff_minutes' => 0,
                    'basic_pay' => 0,
                    'overtime_pay' => 0,
                    'holiday_pay' => 0,
                    'night_diff' => 0,
                    'leave_pay' => 0,
                    'bonus' => 0,
                    'sss_deduction' => 0,
                    'philhealth_deduction' => 0,
                    'pagibig_deduction' => 0,
                    'tax_deduction' => 0,
                    'leave_deduction' => 0,
                    'other_deductions' => 0,
                ],
            );

            $totals = [
                'scheduled_workdays' => 0,
                'present_days' => 0,
                'absent_days' => 0,
                'late_minutes' => 0,
                'undertime_minutes' => 0,
                'overtime_minutes' => 0,
                'night_diff_minutes' => 0,
                'basic_pay' => 0,
                'overtime_pay' => 0,
                'night_diff' => 0,
            ];

            if ($schedules->isNotEmpty()) {
                $workingDates = $schedules
                    ->where('is_working_day', true)
                    ->groupBy(fn ($schedule) => Carbon::parse($schedule->work_date)->toDateString());

                $presentDates = [];

                foreach ($schedules as $schedule) {
                    $detail = $this->calculateDetail($employee, $schedule, $settings);

                    PayrollScheduleDetail::updateOrCreate(
                        [
                            'payroll_item_id' => $item->id,
                            'work_date' => $detail['work_date'],
                            'segment_no' => $detail['segment_no'],
                        ],
                        $detail,
                    );

                    $totals['scheduled_workdays'] += $schedule->is_working_day ? 1 : 0;
                    $totals['late_minutes'] += $detail['late_minutes'];
                    $totals['undertime_minutes'] += $detail['undertime_minutes'];
                    $totals['overtime_minutes'] += $detail['overtime_minutes'];
                    $totals['night_diff_minutes'] += $detail['night_diff_minutes'];
                    $totals['overtime_pay'] += $detail['overtime_pay'];
                    $totals['night_diff'] += $detail['night_diff_pay'];

                    if ($detail['is_present']) {
                        $presentDates[$detail['work_date']] = true;
                    }
                }

                $totals['present_days'] = count($presentDates);
                $totals['absent_days'] = max(0, $workingDates->count() - $totals['present_days']);
            } else {
                $totals['present_days'] = Attendance::query()
                    ->where('employee_id', $employee->id)
                    ->whereBetween('work_date', [$start, $end])
                    ->where('status', 'present')
                    ->whereNotNull('time_in')
                    ->whereNotNull('time_out')
                    ->select('work_date')
                    ->distinct()
                    ->count('work_date');
            }

            $totals['basic_pay'] = $this->basicPay($employee, $totals['present_days'], $settings);

            $item->update($totals + [
                'calculation_snapshot' => [
                    'settings' => $settings->toArray(),
                    'generated_at' => now()->toIso8601String(),
                    'schedule_source' => $schedules->isNotEmpty() ? 'employee_schedules' : 'attendance_only',
                ],
            ]);
        }
    }

    private function calculateDetail(Employee $employee, EmployeeSchedule $schedule, PayrollSetting $settings): array
    {
        $date = Carbon::parse($schedule->work_date)->toDateString();
        $scheduledStart = Carbon::parse($date . ' ' . $schedule->start_time);
        $scheduledEnd = Carbon::parse($date . ' ' . $schedule->end_time);

        if ($scheduledEnd->lessThanOrEqualTo($scheduledStart)) {
            $scheduledEnd->addDay();
        }

        $scheduledMinutes = $schedule->is_working_day
            ? max(0, $scheduledStart->diffInMinutes($scheduledEnd) - $schedule->break_minutes)
            : 0;

        $attendance = Attendance::query()
            ->where('employee_id', $employee->id)
            ->whereDate('work_date', $date)
            ->where('segment_no', $schedule->segment_no)
            ->first();

        $actualIn = $attendance?->time_in;
        $actualOut = $attendance?->time_out;
        $isPresent = $schedule->is_working_day
            && $actualIn
            && $actualOut
            && ($attendance?->status ?? 'present') === 'present';

        $workedMinutes = 0;
        $lateMinutes = 0;
        $undertimeMinutes = 0;
        $overtimeMinutes = 0;

        if ($isPresent) {
            $workedMinutes = max(0, $actualIn->diffInMinutes($actualOut) - $schedule->break_minutes);
            $lateMinutes = $settings->late_enabled
                ? max(0, $scheduledStart->diffInMinutes($actualIn) - $settings->late_grace_minutes)
                : 0;
            $undertimeMinutes = $settings->undertime_enabled
                ? max(0, $scheduledMinutes - $workedMinutes)
                : 0;
            $overtimeMinutes = $settings->overtime_enabled
                ? max(0, $workedMinutes - $scheduledMinutes - $settings->overtime_threshold_minutes)
                : 0;
        }

        $hourlyRate = $this->hourlyRate($employee, $settings);
        $overtimePay = ($overtimeMinutes / 60) * $hourlyRate * (float) $settings->overtime_multiplier;
        $nightDiffMinutes = $isPresent ? $this->nightDiffMinutes($actualIn, $actualOut, $settings) : 0;
        $nightDiffPay = ($nightDiffMinutes / 60) * $hourlyRate * (float) $settings->night_diff_multiplier;

        return [
            'work_date' => $date,
            'segment_no' => $schedule->segment_no,
            'scheduled_start' => $scheduledStart,
            'scheduled_end' => $scheduledEnd,
            'actual_in' => $actualIn,
            'actual_out' => $actualOut,
            'scheduled_minutes' => $scheduledMinutes,
            'break_minutes' => $schedule->break_minutes,
            'worked_minutes' => $workedMinutes,
            'late_minutes' => $lateMinutes,
            'undertime_minutes' => $undertimeMinutes,
            'overtime_minutes' => $overtimeMinutes,
            'night_diff_minutes' => $nightDiffMinutes,
            'is_present' => $isPresent,
            'overtime_pay' => round($overtimePay, 2),
            'night_diff_pay' => round($nightDiffPay, 2),
            'calculation_notes' => null,
        ];
    }

    private function basicPay(Employee $employee, int $presentDays, PayrollSetting $settings): float
    {
        if ($employee->rate_type === 'monthly') {
            return round(($presentDays * (float) $employee->basic_rate) / max(1, (float) $settings->monthly_daily_rate_divisor), 2);
        }

        return round($presentDays * (float) $employee->daily_rate, 2);
    }

    private function hourlyRate(Employee $employee, PayrollSetting $settings): float
    {
        $dailyRate = $employee->rate_type === 'monthly'
            ? (float) $employee->basic_rate / max(1, (float) $settings->monthly_daily_rate_divisor)
            : (float) $employee->daily_rate;

        return $dailyRate / max(0.01, (float) $settings->daily_work_hours);
    }

    private function nightDiffMinutes(
        ?CarbonInterface $actualIn,
        ?CarbonInterface $actualOut,
        PayrollSetting $settings
    ): int {
        if (
            ! $settings->night_diff_enabled ||
            ! $actualIn ||
            ! $actualOut ||
            $actualOut->lessThanOrEqualTo($actualIn)
        ) {
            return 0;
        }

        $start = $actualIn->copy()->startOfMinute();
        $end = $actualOut->copy()->startOfMinute();

        $total = 0;

        $nightStart = $start->copy()->startOfDay()->setTime(22, 0);
        $nightEnd = $nightStart->copy()->addHours(8);

        if ($end->greaterThan($nightStart) && $start->lessThan($nightEnd)) {
            $overlapStart = $start->greaterThan($nightStart) ? $start : $nightStart;
            $overlapEnd = $end->lessThan($nightEnd) ? $end : $nightEnd;

            if ($overlapEnd->greaterThan($overlapStart)) {
                $total += $overlapStart->diffInMinutes($overlapEnd);
            }
        }

        $nightStart = $nightStart->copy()->addDay();

        while ($nightStart->lessThan($end)) {
            $nightEnd = $nightStart->copy()->addHours(8);

            $overlapStart = $start->greaterThan($nightStart) ? $start : $nightStart;
            $overlapEnd = $end->lessThan($nightEnd) ? $end : $nightEnd;

            if ($overlapEnd->greaterThan($overlapStart)) {
                $total += $overlapStart->diffInMinutes($overlapEnd);
            }

            $nightStart->addDay();
        }

        return $total;
    }
}
