<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;

class EmployeeSssContributionController extends Controller
{
    public function index(Employee $employee): Response
    {
        $contributions = $employee->sssContributions()
            ->with('payrollRun:id,cutoff_start,cutoff_end,pay_date,status')
            ->with('contributionTable:id,effective_from,effective_to,compensation_min,compensation_max,monthly_salary_credit,employee_regular_ss,employee_mpf,employee_total,employer_regular_ss,employer_mpf,employer_ec,employer_total,source')
            ->orderByDesc('contribution_date')
            ->get([
                'id',
                'employee_id',
                'payroll_run_id',
                'sss_contribution_table_id',
                'contribution_date',
                'monthly_compensation',
                'monthly_salary_credit',
                'employee_regular_ss',
                'employee_mpf',
                'employee_total',
                'employer_regular_ss',
                'employer_mpf',
                'employer_ec',
                'employer_total',
                'effective_from',
                'source',
            ]);

        return inertia('Employees/SssContributions', [
            'employee' => [
                'id' => $employee->id,
                'employee_id' => $employee->employee_id,
                'full_name' => $employee->full_name,
                'sss_no' => $employee->sss_no,
                'sss_deduction_cutoff' => $employee->sss_deduction_cutoff,
                'sss_msc_override' => $employee->sss_msc_override,
            ],
            'contributions' => $contributions,
        ]);
    }

    public function updateMsc(
        Request $request,
        Employee $employee,
    ): RedirectResponse {
        $validated = $request->validate([
            'sss_msc_override' => [
                'nullable',
                'numeric',
                'min:5000',
                'max:35000',
                'multiple_of:500',
            ],
        ]);

        $employee->update([
            'sss_msc_override' => $validated['sss_msc_override'] ?? null,
        ]);

        return back()->with(
            'success',
            $employee->sss_msc_override === null
                ? 'SSS MSC override cleared. Automatic MSC calculation is active again.'
                : 'SSS MSC override updated.'
        );
    }
}
