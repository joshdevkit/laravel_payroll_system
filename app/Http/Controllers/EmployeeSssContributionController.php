<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Inertia\Response;

class EmployeeSssContributionController extends Controller
{
    public function index(Employee $employee): Response
    {
        $contributions = $employee->sssContributions()
            ->with('payrollRun:id,cutoff_start,cutoff_end,pay_date,status')
            ->orderByDesc('contribution_date')
            ->get([
                'id',
                'employee_id',
                'payroll_run_id',
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
            ],
            'contributions' => $contributions,
        ]);
    }
}
