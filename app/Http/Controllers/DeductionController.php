<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\SssContributionTable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;

class DeductionController extends Controller
{
    public function index(): Response
    {
        return inertia('Deductions/Index', [
            'employees' => Employee::query()
                ->select([
                    'id',
                    'employee_id',
                    'full_name',
                    'sss_no',
                    'sss_deduction_cutoff',
                    'philhealth_no',
                    'philhealth_deduction_cutoff',
                    'pagibig_no',
                    'pagibig_deduction_cutoff',
                ])
                ->where(function ($query) {
                    $query
                        ->whereNotNull('sss_no')
                        ->orWhereNotNull('philhealth_no')
                        ->orWhereNotNull('pagibig_no');
                })
                ->orderBy('full_name')
                ->get(),
            'sssContributionTables' => SssContributionTable::query()
                ->orderByDesc('effective_from')
                ->orderBy('compensation_min')
                ->get(),
        ]);
    }

    public function updateSssCutoff(
        Request $request,
        Employee $employee
    ): RedirectResponse {
        $validated = $request->validate([
            'sss_deduction_cutoff' => [
                'nullable',
                'in:first,second',
            ],
        ]);

        $employee->update($validated);

        return back()->with(
            'success',
            $validated['sss_deduction_cutoff'] === null
                ? 'SSS deduction cutoff cleared.'
                : 'SSS deduction cutoff updated.'
        );
    }

    public function updateGovernmentCutoffs(
        Request $request,
        Employee $employee
    ): RedirectResponse {
        $validated = $request->validate([
            'philhealth_deduction_cutoff' => [
                'nullable',
                'in:first,second',
            ],
            'pagibig_deduction_cutoff' => [
                'nullable',
                'in:first,second',
            ],
        ]);

        $employee->update($validated);

        return back()->with(
            'success',
            'Government contribution deduction cutoffs updated.'
        );
    }
}
