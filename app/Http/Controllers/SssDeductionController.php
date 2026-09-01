<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\SssDeduction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;

class SssDeductionController extends Controller
{
    public function index(): Response
    {
        return inertia('SssDeductions/Index', [
            'deductions' => SssDeduction::query()
                ->with('employee:id,employee_id,full_name,sss_no')
                ->orderByDesc('is_active')
                ->orderBy('effective_from')
                ->orderBy('created_at')
                ->get(),
            'employees' => Employee::query()
                ->select(['id', 'employee_id', 'full_name', 'sss_no'])
                ->orderBy('full_name')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateDeduction($request);

        SssDeduction::create($validated);

        return back()->with('success', 'SSS deduction schedule added successfully.');
    }

    public function update(Request $request, SssDeduction $sssDeduction): RedirectResponse
    {
        $validated = $this->validateDeduction($request);

        $sssDeduction->update($validated);

        return back()->with('success', 'SSS deduction schedule updated successfully.');
    }

    public function destroy(SssDeduction $sssDeduction): RedirectResponse
    {
        $sssDeduction->delete();

        return back()->with('success', 'SSS deduction schedule deleted successfully.');
    }

    private function validateDeduction(Request $request): array
    {
        return $request->validate([
            'employee_id' => ['required', 'uuid', 'exists:employees,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'deduction_schedule' => ['required', 'in:every_payroll,first_cutoff,second_cutoff'],
            'effective_from' => ['required', 'date'],
            'effective_until' => ['nullable', 'date', 'after_or_equal:effective_from'],
            'is_active' => ['required', 'boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);
    }
}
