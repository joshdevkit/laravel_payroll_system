<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\PayrollRun;
use App\Services\Dashboard\HolidayApiService;
use Carbon\Carbon;
use Inertia\Response;

use App\Models\PayrollItem;
class DashboardController extends Controller
{
    public function index(HolidayApiService $holidayApi): Response
    {
        $today = Carbon::today();

        /*
         * Get the latest pay date.
         *
         * Multiple payroll runs can have the same pay date
         * because each category has its own payroll run.
         */
        $latestPayDate = PayrollRun::query()
            ->max('pay_date');

        $summary = null;

        if ($latestPayDate) {
            $latestPayrollRuns = PayrollRun::query()
                ->whereDate('pay_date', $latestPayDate)
                ->withCount('items')
                ->get();

            $runIds = $latestPayrollRuns->pluck('id');

            $totals = \App\Models\PayrollItem::query()
                ->whereIn('payroll_run_id', $runIds)
                ->selectRaw(
                    'COALESCE(SUM(total_earnings), 0) as gross_pay'
                )
                ->selectRaw(
                    'COALESCE(SUM(bonus), 0) as bonuses'
                )
                ->selectRaw(
                    'COALESCE(SUM(total_deductions), 0) as deductions'
                )
                ->selectRaw(
                    'COALESCE(SUM(net_pay), 0) as net_pay'
                )
                ->first();

            $summary = [
                'id' => $latestPayrollRuns->first()?->id,

                'cutoffStart' => $latestPayrollRuns
                    ->min('cutoff_start')
                    ?->toDateString(),

                'cutoffEnd' => $latestPayrollRuns
                    ->max('cutoff_end')
                    ?->toDateString(),

                'payDate' => Carbon::parse($latestPayDate)
                    ->toDateString(),

                'employeeCount' => (int) $latestPayrollRuns
                    ->sum('items_count'),

                'payrollRunCount' => $latestPayrollRuns->count(),

                'grossPay' => (float) $totals->gross_pay,

                'bonuses' => (float) $totals->bonuses,

                'deductions' => (float) $totals->deductions,

                'netPay' => (float) $totals->net_pay,

                /*
                 * If all runs are completed, show completed.
                 * Otherwise the overall group remains draft.
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
         * Recent payroll periods.
         *
         * Instead of showing individual category runs,
         * group payroll runs by pay_date.
         */
        $recentPayrollRuns = PayrollRun::query()
            ->select('pay_date')
            ->selectRaw('MIN(cutoff_start) as cutoff_start')
            ->selectRaw('MAX(cutoff_end) as cutoff_end')
            ->selectRaw('COUNT(*) as payroll_run_count')
            ->whereNotNull('pay_date')
            ->groupBy('pay_date')
            ->orderByDesc('pay_date')
            ->limit(5)
            ->get()
            ->map(function ($period): array {
                $runs = PayrollRun::query()
                    ->whereDate('pay_date', $period->pay_date)
                    ->withCount('items')
                    ->get();

                $runIds = $runs->pluck('id');

                $totals = \App\Models\PayrollItem::query()
                    ->whereIn('payroll_run_id', $runIds)
                    ->selectRaw(
                        'COALESCE(SUM(net_pay), 0) as net_total'
                    )
                    ->first();

                return [
                    /*
                     * There can be multiple payroll runs,
                     * so don't pretend this is one run ID.
                     */
                    'id' => $period->pay_date,

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

                    'netTotal' => (float) $totals->net_total,

                    'employeeCount' => (int) $runs->sum('items_count'),

                    'payrollRunCount' => $runs->count(),

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
}