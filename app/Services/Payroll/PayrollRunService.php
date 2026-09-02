<?php

namespace App\Services\Payroll;

use App\Models\Employee;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use App\Models\PayrollScheduleDetail;
use App\Models\PayrollSetting;
use App\Models\SssContribution;
use Illuminate\Support\Facades\DB;

class PayrollRunService
{
    public function __construct(
        private PayrollCalculator $calculator,
        private SssContributionCalculator $sssContributionCalculator,
    ) {
    }

    /**
     * Create a new draft payroll run.
     */
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
            $settings = PayrollSetting::query()
                ->findOrFail(1);

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

    /**
     * Recalculate every item while the payroll run is still a draft.
     *
     * This is important because statutory deductions such as SSS can be
     * configured or updated after the draft was initially created.
     */
    public function ensureItems(
        PayrollRun $run
    ): PayrollRun {
        if ($run->status !== 'draft') {
            return $run->load([
                'items.employee',
                'items.scheduleDetails',
            ]);
        }

        return DB::transaction(function () use ($run) {
            $settings = PayrollSetting::query()
                ->findOrFail(1);

            $this->buildItems(
                $run,
                $settings
            );

            return $run->fresh([
                'items.employee',
                'items.scheduleDetails',
            ]);
        });
    }

    /**
     * Build payroll items for all employees.
     */
    private function buildItems(
        PayrollRun $run,
        PayrollSetting $settings
    ): void {
        $employees = Employee::query()
            ->orderBy('full_name')
            ->get();

        foreach ($employees as $employee) {
            $calculation = $this->calculator->calculate(
                $run,
                $settings,
                $employee
            );

            $item = PayrollItem::updateOrCreate(
                [
                    'payroll_run_id' => $run->id,
                    'employee_id' => $employee->id,
                ],
                $calculation->item()
            );

            $this->saveSssContribution(
                $run,
                $item,
                $employee,
            );

            $this->saveScheduleDetails(
                $item,
                $calculation->scheduleDetails()
            );
        }
    }

    /**
     * Save the SSS contribution snapshot used by the payroll item.
     */
    private function saveSssContribution(
        PayrollRun $run,
        PayrollItem $item,
        Employee $employee,
    ): void {
        $contribution = $this->sssContributionCalculator->calculate(
            $employee,
            $run,
        );

        if ($contribution === null) {
            SssContribution::query()
                ->where('payroll_item_id', $item->id)
                ->delete();

            return;
        }

        SssContribution::updateOrCreate(
            [
                'payroll_item_id' => $item->id,
            ],
            [
                'employee_id' => $employee->id,
                'payroll_run_id' => $run->id,
                ...$contribution,
            ]
        );
    }

    /**
     * Replace schedule details for a payroll item.
     */
    private function saveScheduleDetails(
        PayrollItem $item,
        array $details
    ): void {
        $item->scheduleDetails()->delete();

        foreach ($details as $detail) {
            PayrollScheduleDetail::create([
                'payroll_item_id' =>
                    $item->id,

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
