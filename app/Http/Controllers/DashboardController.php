<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use App\Services\Dashboard\HolidayApiService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(HolidayApiService $holidayApi): Response
    {
        $today = Carbon::today();

        /*
         * =========================================================
         * LATEST PAYROLL SUMMARY
         * =========================================================
         *
         * The latest payroll summary is based on the latest pay date.
         *
         * Multiple payroll runs can exist for the same pay date
         * because each category has its own payroll run.
         *
         * All branches sharing the latest pay date are included
         * in this overall dashboard summary.
         */
        $latestPayDate = PayrollRun::query()
            ->whereNotNull('pay_date')
            ->max('pay_date');

        $summary = null;

        if ($latestPayDate) {
            $latestPayrollRuns = PayrollRun::query()
                ->whereDate('pay_date', $latestPayDate)
                ->withCount('items')
                ->get();

            $runIds = $latestPayrollRuns->pluck('id');

            $items = PayrollItem::query()
                ->whereIn('payroll_run_id', $runIds)
                ->get();

            $calculated = $this->calculatePayrollRegisterTotals($items);

            $summary = [
                /*
                 * There may be multiple payroll runs.
                 * Therefore, don't use a payroll_run ID as the
                 * summary ID.
                 */
                'id' => Carbon::parse($latestPayDate)->toDateString(),

                'cutoffStart' => $latestPayrollRuns
                    ->min('cutoff_start')
                    ?->toDateString(),

                'cutoffEnd' => $latestPayrollRuns
                    ->max('cutoff_end')
                    ?->toDateString(),

                'payDate' => Carbon::parse($latestPayDate)
                    ->toDateString(),

                /*
                 * Payroll Register rows are PayrollItems,
                 * therefore employee count follows the number
                 * of payroll items exactly.
                 */
                'employeeCount' => $items->count(),

                'payrollRunCount' => $latestPayrollRuns->count(),

                /*
                 * Exact PayrollRegisterTable calculations.
                 */
                'totalEarnings' => $calculated['totalEarnings'],

                'grossPay' => $calculated['totalGrossEarning'],

                'deductions' => $calculated['totalDeductions'],

                'others' => $calculated['others'],

                'netPay' => $calculated['totalNetEarnings'],

                /*
                 * PayrollRegisterTable does not calculate bonuses.
                 *
                 * Keep the property so the existing Dashboard
                 * frontend does not break.
                 */
                'bonuses' => 0,

                /*
                 * If every payroll run belonging to this pay date
                 * is completed, the overall summary is completed.
                 */
                'status' => $latestPayrollRuns->every(
                    fn (PayrollRun $run) =>
                        $run->status === 'completed'
                )
                    ? 'completed'
                    : 'draft',
            ];
        }

        /*
         * =========================================================
         * RECENT PAYROLL PERIODS
         * =========================================================
         *
         * IMPORTANT:
         *
         * The grouping key is:
         *
         *     branch_id + pay_date
         *
         * This means:
         *
         * Branch A + September 5 = ONE payroll period
         * Branch B + September 5 = ONE separate payroll period
         *
         * Categories/runs belonging to the same branch and pay date
         * are combined.
         */
        $recentPayrollRuns = PayrollRun::query()
            ->select('branch_id', 'pay_date')
            ->selectRaw('MIN(cutoff_start) as cutoff_start')
            ->selectRaw('MAX(cutoff_end) as cutoff_end')
            ->whereNotNull('pay_date')
            ->groupBy('branch_id', 'pay_date')
            ->orderByDesc('pay_date')
            ->orderBy('branch_id')
            ->limit(5)
            ->get()
            ->map(function ($period): array {
                /*
                 * Get all payroll runs belonging to this exact:
                 *
                 * branch + pay date
                 */
                $runs = PayrollRun::query()
                    ->where('branch_id', $period->branch_id)
                    ->whereDate('pay_date', $period->pay_date)
                    ->withCount('items')
                    ->get();

                $runIds = $runs->pluck('id');

                /*
                 * Get the actual PayrollItems.
                 *
                 * The PayrollRegisterTable operates on PayrollItem[],
                 * so the Dashboard must calculate from these same rows.
                 */
                $items = PayrollItem::query()
                    ->whereIn('payroll_run_id', $runIds)
                    ->get();

                /*
                 * Exact PayrollRegisterTable calculations.
                 */
                $calculated = $this->calculatePayrollRegisterTotals(
                    $items
                );

                /*
                 * Branch name.
                 *
                 * We intentionally resolve this from the first payroll
                 * run rather than changing the existing query structure.
                 */
                $branchName = '-';

                $firstRun = $runs->first();

                if ($firstRun && $firstRun->relationLoaded('branch')) {
                    $branchName = $firstRun->branch?->name ?? '-';
                } elseif ($firstRun && method_exists($firstRun, 'branch')) {
                    $firstRun->load('branch');

                    $branchName = $firstRun->branch?->name ?? '-';
                }

                return [
                    /*
                     * Since this is a branch + pay-date group,
                     * create a composite ID instead of using only
                     * the pay date.
                     */
                    'id' =>
                        $period->branch_id .
                        '_' .
                        Carbon::parse($period->pay_date)->toDateString(),

                    'branchId' => $period->branch_id,

                    'branchName' => $branchName,

                    'cutoffStart' => $period->cutoff_start
                        ? Carbon::parse($period->cutoff_start)
                            ->toDateString()
                        : null,

                    'cutoffEnd' => $period->cutoff_end
                        ? Carbon::parse($period->cutoff_end)
                            ->toDateString()
                        : null,

                    'payDate' => Carbon::parse($period->pay_date)
                        ->toDateString(),

                    /*
                     * Number of actual PayrollRegister rows.
                     */
                    'employeeCount' => $items->count(),

                    /*
                     * Number of category payroll runs combined
                     * inside this branch + pay-date group.
                     */
                    'payrollRunCount' => $runs->count(),

                    /*
                     * Exact PayrollRegisterTable totals.
                     */
                    'totalEarnings' => $calculated['totalEarnings'],

                    'grossPay' => $calculated['totalGrossEarning'],

                    'deductions' => $calculated['totalDeductions'],

                    'others' => $calculated['others'],

                    'netTotal' => $calculated['totalNetEarnings'],

                    /*
                     * Keep netPay as well for compatibility if the
                     * Dashboard frontend currently expects it.
                     */
                    'netPay' => $calculated['totalNetEarnings'],

                    /*
                     * PayrollRegisterTable has no bonus calculation.
                     */
                    'bonuses' => 0,

                    'status' => $runs->every(
                        fn (PayrollRun $run) =>
                            $run->status === 'completed'
                    )
                        ? 'completed'
                        : 'draft',
                ];
            })
            ->values();

        return inertia('Dashboard/Index', [
            'dashboard' => [
                'employeeCount' => Employee::query()->count(),

                'payrollSummary' => $summary,

                'recentPayrollRuns' => $recentPayrollRuns,

                'pendingLeaveRequests' => [],

                'upcomingHolidays' => $holidayApi->upcoming(
                    $today->year,
                    $today->toDateString(),
                    5,
                ),
            ],
        ]);
    }

    /*
     * =============================================================
     * PAYROLL REGISTER CALCULATIONS
     * =============================================================
     *
     * These formulas intentionally mirror PayrollRegisterTable.tsx.
     *
     * PayrollRegisterTable:
     *
     * totalEarningsOf
     *     = basic_pay - tardy_deduction
     *
     * totalGrossEarningOf
     *     = totalEarnings
     *     + overtime_pay
     *     + holiday_pay
     *     + night_diff
     *
     * totalDeductionsOf
     *     = philhealth_deduction
     *     + pagibig_deduction
     *     + sss_deduction
     *     + sss_loan_deduction
     *     + pagibig_loan_deduction
     *     + cash_advance_deduction
     *     + tardy_deduction
     *
     * othersEarningsOf
     *     = cola
     *     + overtime_pay
     *     + holiday_pay
     *     + night_diff
     *
     * totalNetEarningsOf
     *     = totalGrossEarning
     *     + cola
     *     - totalDeductions
     */
    private function calculatePayrollRegisterTotals(
        Collection $items
    ): array {
        /*
         * ---------------------------------------------------------
         * NUMBER HELPER
         * ---------------------------------------------------------
         */
        $number = static function ($value): float {
            return (float) ($value ?? 0);
        };

        /*
         * ---------------------------------------------------------
         * COLA
         * ---------------------------------------------------------
         *
         * Same as:
         *
         * const colaOf = (item) => number(item.cola)
         */
        $colaOf = static function (PayrollItem $item) use ($number): float {
            return $number($item->cola);
        };

        /*
         * ---------------------------------------------------------
         * TOTAL EARNINGS
         *
         * Basic Salary - Tardy
         * ---------------------------------------------------------
         */
        $totalEarningsOf = static function (
            PayrollItem $item
        ) use ($number): float {
            return $number($item->basic_pay)
                - $number($item->tardy_deduction);
        };

        /*
         * ---------------------------------------------------------
         * TOTAL GROSS EARNING
         *
         * Total Earnings
         * + Overtime
         * + Holiday
         * + Night Shift
         *
         * COLA is NOT included.
         * ---------------------------------------------------------
         */
        $totalGrossEarningOf = static function (
            PayrollItem $item
        ) use (
            $number,
            $totalEarningsOf
        ): float {
            return $totalEarningsOf($item)
                + $number($item->overtime_pay)
                + $number($item->holiday_pay)
                + $number($item->night_diff);
        };

        /*
         * ---------------------------------------------------------
         * TOTAL DEDUCTIONS
         *
         * EXACTLY mirrors PayrollRegisterTable.tsx.
         *
         * Notice that tardy_deduction IS included here because
         * this is what the actual TypeScript calculation does.
         * ---------------------------------------------------------
         */
        $totalDeductionsOf = static function (
            PayrollItem $item
        ) use ($number): float {
            return $number($item->philhealth_deduction)
                + $number($item->pagibig_deduction)
                + $number($item->sss_deduction)
                + $number($item->sss_loan_deduction)
                + $number($item->pagibig_loan_deduction)
                + $number($item->cash_advance_deduction)
                + $number($item->tardy_deduction);
        };

        /*
         * ---------------------------------------------------------
         * OTHERS
         *
         * COLA
         * + Overtime
         * + Holiday
         * + Night Shift
         * ---------------------------------------------------------
         */
        $othersEarningsOf = static function (
            PayrollItem $item
        ) use (
            $number,
            $colaOf
        ): float {
            return $colaOf($item)
                + $number($item->overtime_pay)
                + $number($item->holiday_pay)
                + $number($item->night_diff);
        };

        /*
         * ---------------------------------------------------------
         * TOTAL NET EARNINGS
         *
         * Total Gross Earning
         * + COLA
         * - Total Deductions
         * ---------------------------------------------------------
         */
        $totalNetEarningsOf = static function (
            PayrollItem $item
        ) use (
            $totalGrossEarningOf,
            $colaOf,
            $totalDeductionsOf
        ): float {
            return $totalGrossEarningOf($item)
                + $colaOf($item)
                - $totalDeductionsOf($item);
        };

        /*
         * ---------------------------------------------------------
         * SUM ALL PAYROLL REGISTER ROWS
         * ---------------------------------------------------------
         */
        return [
            'totalEarnings' => $items->sum(
                fn (PayrollItem $item) =>
                    $totalEarningsOf($item)
            ),

            'totalGrossEarning' => $items->sum(
                fn (PayrollItem $item) =>
                    $totalGrossEarningOf($item)
            ),

            'totalDeductions' => $items->sum(
                fn (PayrollItem $item) =>
                    $totalDeductionsOf($item)
            ),

            'others' => $items->sum(
                fn (PayrollItem $item) =>
                    $othersEarningsOf($item)
            ),

            'totalNetEarnings' => $items->sum(
                fn (PayrollItem $item) =>
                    $totalNetEarningsOf($item)
            ),
        ];
    }
}