<?php

namespace App\Http\Controllers;

use App\Models\PayrollRun;
use App\Services\Payroll\PayrollRunService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;

class PayrollRunController extends Controller
{
    public function index(): Response
    {
        return inertia('PayrollRuns/Index', [
            'payrollRuns' => PayrollRun::query()
                ->withCount('items')
                ->orderByDesc('pay_date')
                ->orderByDesc('created_at')
                ->get(),
        ]);
    }

    public function store(Request $request, PayrollRunService $service): RedirectResponse
    {
        $validated = $request->validate([
            'cutoff_start' => ['required', 'date'],
            'cutoff_end' => ['required', 'date', 'after_or_equal:cutoff_start'],
            'pay_date' => ['required', 'date'],
        ]);

        $service->createDraft($validated['cutoff_start'], $validated['cutoff_end'], $validated['pay_date']);

        return back()->with('success', 'Payroll run created successfully.');
    }

    public function show(PayrollRun $payrollRun): Response
    {
        $payrollRun->load(['items.employee', 'items.scheduleDetails']);

        return inertia('PayrollRuns/Show', ['payrollRun' => $payrollRun]);
    }

    public function confirm(PayrollRun $payrollRun): RedirectResponse
    {
        if ($payrollRun->status !== 'draft') {
            return back()->with('error', 'Only draft payroll runs can be confirmed.');
        }

        $payrollRun->update(['status' => 'completed']);

        return back()->with('success', 'Payroll confirmed successfully.');
    }

    public function destroy(PayrollRun $payrollRun): RedirectResponse
    {
        if ($payrollRun->status !== 'draft') {
            return back()->with('error', 'Only draft payroll runs can be deleted.');
        }

        $payrollRun->delete();

        return back()->with('success', 'Payroll run deleted successfully.');
    }
}
