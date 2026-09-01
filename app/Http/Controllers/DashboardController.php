<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\PayrollRun;
use App\Services\Dashboard\HolidayApiService;
use Carbon\Carbon;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(HolidayApiService $holidayApi): Response
    {
        $today = Carbon::today();

        $latestPayroll = PayrollRun::query()
            ->withCount('items')
            ->latest('pay_date')
            ->latest('created_at')
            ->first();

        $summary = null;

        if ($latestPayroll) {
            $totals = $latestPayroll->items()
                ->selectRaw('COALESCE(SUM(total_earnings), 0) as gross_pay')
                ->selectRaw('COALESCE(SUM(bonus), 0) as bonuses')
                ->selectRaw('COALESCE(SUM(total_deductions), 0) as deductions')
                ->selectRaw('COALESCE(SUM(net_pay), 0) as net_pay')
                ->first();

            $summary = [
                'id' => $latestPayroll->id,
                'cutoffStart' => $latestPayroll->cutoff_start?->toDateString(),
                'cutoffEnd' => $latestPayroll->cutoff_end?->toDateString(),
                'payDate' => $latestPayroll->pay_date?->toDateString(),
                'employeeCount' => (int) $latestPayroll->items_count,
                'grossPay' => (float) $totals->gross_pay,
                'bonuses' => (float) $totals->bonuses,
                'deductions' => (float) $totals->deductions,
                'netPay' => (float) $totals->net_pay,
                'status' => $latestPayroll->status,
            ];
        }

        $recentPayrollRuns = PayrollRun::query()
            ->withCount('items')
            ->latest('pay_date')
            ->latest('created_at')
            ->limit(5)
            ->get()
            ->map(function (PayrollRun $run): array {
                $totals = $run->items()
                    ->selectRaw('COALESCE(SUM(net_pay), 0) as net_total')
                    ->first();

                return [
                    'id' => $run->id,
                    'cutoffStart' => $run->cutoff_start?->toDateString(),
                    'cutoffEnd' => $run->cutoff_end?->toDateString(),
                    'payDate' => $run->pay_date?->toDateString(),
                    'netTotal' => (float) $totals->net_total,
                    'employeeCount' => (int) $run->items_count,
                    'status' => $run->status,
                ];
            })
            ->values();

        return inertia('Dashboard/Index', [
            'dashboard' => [
                'employeeCount' => Employee::query()->count(),
                'payrollSummary' => $summary,
                'recentPayrollRuns' => $recentPayrollRuns,
                // Leave workflow is intentionally not connected yet.
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
