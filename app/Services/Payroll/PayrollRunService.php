<?php

namespace App\Services\Payroll;

use App\Models\Employee;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use App\Models\PayrollScheduleDetail;
use App\Models\PayrollSetting;
use App\Models\SssContribution;
use Illuminate\Support\Facades\DB;

use Illuminate\Support\Str;
use App\Models\LoanAndCashAdvance;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

use App\Models\LoanDeduction;
use RuntimeException;

class PayrollRunService
{
    public function __construct(
        private PayrollCalculator $calculator,
        private SssContributionCalculator $sssContributionCalculator,
    ) {}

    /**
     * Create a new draft payroll run.
     */
    public function createDraft(
        string $branch_id,
        string $cutoffStart,
        string $cutoffEnd,
        string $payDate
    ): PayrollRun {
        return DB::transaction(function () use (
            $branch_id,
            $cutoffStart,
            $cutoffEnd,
            $payDate
        ) {
            $settings = PayrollSetting::query()
                ->findOrFail(1);

            $run = PayrollRun::create([
                'branch_id' => $branch_id,
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
                'items.employee.branch',
                'items.employee.category',
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
                'items.employee.branch',
                'items.employee.category',
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
        $employeeIds = Employee::query()
            ->where('branch_id', $run->branch_id)
            ->pluck('id');

        // Remove payroll items for employees who no longer
        // belong to this payroll run's category.
        PayrollItem::query()
            ->where('payroll_run_id', $run->id)
            ->whereNotIn('employee_id', $employeeIds)
            ->delete();

        $employees = Employee::query()
            ->whereIn('id', $employeeIds)
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
                $employee
            );

            $this->saveLoanDeductions(
                $run,
                $item,
                $calculation
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


    private function saveLoanDeductions(
        PayrollRun $run,
        PayrollItem $item,
        PayrollCalculationResult $calculation
    ): void {
        $details = $calculation->loanDeductions();

        /*
     * Rebuild loan deduction records for this payroll item.
     *
     * This is safe while the payroll is still a draft because
     * the records are recreated whenever the payroll is recalculated.
     */
        $item->loanDeductions()->delete();

        foreach ($details as $detail) {
            $item->loanDeductions()->create([
                'loan_and_cash_advance_id' =>
                $detail['loan_id'],

                'employee_id' =>
                $item->employee_id,

                'payroll_run_id' =>
                $run->id,

                'amount' =>
                $detail['deduction_amount'],

                'balance_before' =>
                $detail['balance_before'],

                'balance_after' =>
                $detail['balance_after'],

                'deduction_date' =>
                Carbon::parse($run->pay_date)->toDateString(),

                'notes' =>
                $detail['reference_no']
                    ? 'Reference: ' . $detail['reference_no']
                    : null,
            ]);
        }
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

    /**
     * Confirm/finalize a payroll run.
     *
     * Draft payrolls only calculate loan deductions.
     *
     * Confirmation is the point where the actual loan/cash advance
     * balance is reduced.
     */
    public function confirm(
        PayrollRun $run
    ): PayrollRun {
        if ($run->status !== 'draft') {
            throw new RuntimeException(
                'Only draft payroll runs can be confirmed.'
            );
        }

        return DB::transaction(function () use ($run) {

            /*
         * Lock the payroll run so two confirmation requests
         * cannot post the same deductions simultaneously.
         */
            $run = PayrollRun::query()
                ->lockForUpdate()
                ->findOrFail($run->id);

            /*
         * Recalculate the draft one final time.
         *
         * This ensures the loan deduction records represent
         * the latest payroll calculation before posting.
         */
            $this->ensureItems($run);

            /*
         * Reload the payroll items and their loan deductions.
         */
            $run->load([
                'items.employee',
                'items.loanDeductions',
            ]);

            foreach ($run->items as $item) {

                foreach ($item->loanDeductions as $deduction) {

                    /*
                 * Lock the actual loan/cash advance row.
                 *
                 * This prevents two payroll processes from
                 * modifying the same balance at the same time.
                 */
                    $loan = LoanAndCashAdvance::query()
                        ->lockForUpdate()
                        ->find(
                            $deduction->loan_and_cash_advance_id
                        );

                    if (! $loan) {
                        continue;
                    }

                    /*
                 * IMPORTANT:
                 *
                 * Do not post the same deduction twice.
                 */
                    $alreadyPosted = LoanDeduction::query()
                        ->where(
                            'loan_and_cash_advance_id',
                            $loan->id
                        )
                        ->where(
                            'payroll_run_id',
                            $run->id
                        )
                        ->where(
                            'id',
                            '!=',
                            $deduction->id
                        )
                        ->exists();

                    if ($alreadyPosted) {
                        continue;
                    }

                    /*
                 * Get the CURRENT balance.
                 *
                 * Do not blindly use balance_after from the
                 * draft snapshot because the balance may have
                 * changed since the draft was created.
                 */
                    $balanceBefore =
                        (float) $loan->balance;

                    /*
                 * Never deduct more than the remaining balance.
                 */
                    $amount = min(
                        (float) $deduction->amount,
                        $balanceBefore
                    );

                    $amount = max(
                        0,
                        $amount
                    );

                    if ($amount <= 0) {
                        continue;
                    }

                    $balanceAfter =
                        max(
                            0,
                            $balanceBefore - $amount
                        );

                    /*
                 * =================================================
                 * ACTUAL BALANCE UPDATE
                 * =================================================
                 */
                    $loan->update([
                        'balance' =>
                        $balanceAfter,

                        'status' =>
                        $balanceAfter <= 0
                            ? 'paid'
                            : 'active',
                    ]);

                    /*
                 * Update the deduction record with the
                 * ACTUAL posted balance values.
                 */
                    $deduction->update([
                        'amount' =>
                        $amount,

                        'balance_before' =>
                        $balanceBefore,

                        'balance_after' =>
                        $balanceAfter,

                        'notes' =>
                        trim(
                            ($deduction->notes ?? '')
                                . ' Payroll deduction posted.'
                        ),
                    ]);
                }
            }

            /*
         * Payroll is now officially finalized.
         */
            $run->update([
                'status' => 'completed',
            ]);

            return $run->fresh([
                'items.employee.category',
                'items.scheduleDetails',
                'items.loanDeductions',
                'loanDeductions',
            ]);
        });
    }
}
