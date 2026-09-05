<?php

namespace App\Http\Controllers;

use App\Models\PayrollRun;
use App\Services\Payroll\PayrollRunService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;
use App\Models\Branch;
class PayrollRunController extends Controller
{
    public function index(): Response
    {
        return inertia('PayrollRuns/Index', [
            'payrollRuns' => PayrollRun::query()
                ->with(['branch', 'category'])
                ->withCount('items')
                ->orderByDesc('pay_date')
                ->orderByDesc('created_at')
                ->get(),
            'branches' => Branch::query()->select(['id', 'name'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(
        Request $request,
        PayrollRunService $service
    ): RedirectResponse {
        $validated = $request->validate([
            'branch_id' => [
                'required',
                'exists:branches,id',
            ],

            'cutoff_start' => [
                'required',
                'date',
            ],

            'cutoff_end' => [
                'required',
                'date',
                'after_or_equal:cutoff_start',
            ],

            'pay_date' => [
                'required',
                'date',
            ],
        ]);

        $service->createDraft(
            $validated['branch_id'],
            $validated['cutoff_start'],
            $validated['cutoff_end'],
            $validated['pay_date'],
        );

        return back()->with(
            'success',
            'Payroll run created successfully.'
        );
    }

    public function show(
        PayrollRun $payrollRun,
        PayrollRunService $service
    ): Response {
        /*
         * IMPORTANT:
         *
         * Draft payrolls are recalculated every time they
         * are opened.
         *
         * This means if you add an SSS deduction after
         * creating the payroll run, opening Review Payroll
         * will pick it up.
         */
        $payrollRun = $service->ensureItems(
            $payrollRun
        );

        // dd($payrollRun);

        return inertia(
            'PayrollRuns/Show',
            [
                'payrollRun' =>
                $payrollRun,
            ]
        );
    }

    public function confirm(
        PayrollRun $payrollRun,
        PayrollRunService $service
    ): RedirectResponse {
        try {
            $service->confirm($payrollRun);

            return back()->with(
                'success',
                'Payroll confirmed successfully.'
            );
        } catch (\Throwable $e) {
            report($e);

            return back()->with(
                'error',
                'Unable to confirm payroll: '
                    . $e->getMessage()
            );
        }
    }

    public function destroy(
        PayrollRun $payrollRun
    ): RedirectResponse {
        if (
            $payrollRun->status !== 'draft'
        ) {
            return back()->with(
                'error',
                'Only draft payroll runs can be deleted.'
            );
        }

        $payrollRun->delete();

        return back()->with(
            'success',
            'Payroll run deleted successfully.'
        );
    }
}
