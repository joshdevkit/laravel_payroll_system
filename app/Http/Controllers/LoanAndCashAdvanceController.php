<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLoanAndCashAdvanceRequest;
use App\Http\Requests\UpdateLoanAndCashAdvanceRequest;
use App\Models\Employee;
use App\Models\LoanAndCashAdvance;
use Illuminate\Http\RedirectResponse;
use Inertia\Response;

class LoanAndCashAdvanceController extends Controller
{
    /**
     * Display an employee's loans and cash advances.
     */
    public function index(Employee $employee): Response
    {
        $loansAndCashAdvances = $employee
            ->loansAndCashAdvances()
            ->with([
                'deductions.payrollRun',
            ])
            ->orderByDesc('date')
            ->get();

        return inertia('Employees/LoansAndCashAdvances', [
            'employee' => $employee->only([
                'id',
                'employee_id',
                'full_name',
            ]),

            'loansAndCashAdvances' => $loansAndCashAdvances,
        ]);
    }

    /**
     * Store a new loan or cash advance.
     */
    public function store(
        StoreLoanAndCashAdvanceRequest $request,
        Employee $employee
    ): RedirectResponse {
        $validated = $request->validated();

        $employee->loansAndCashAdvances()->create([
            ...$validated,

            'balance' => $validated['principal_amount'],

            'status' => 'active',
        ]);

        return back()->with(
            'success',
            'Loan or cash advance added successfully.'
        );
    }

    /**
     * Update an existing loan or cash advance.
     */
    public function update(
        UpdateLoanAndCashAdvanceRequest $request,
        Employee $employee,
        LoanAndCashAdvance $loanAndCashAdvance
    ): RedirectResponse {
        abort_unless(
            $loanAndCashAdvance->employee_id === $employee->id,
            404
        );

        $loanAndCashAdvance->update(
            $request->validated()
        );

        return back()->with(
            'success',
            'Loan or cash advance updated successfully.'
        );
    }

    /**
     * Delete a loan or cash advance.
     */
    public function destroy(
        Employee $employee,
        LoanAndCashAdvance $loanAndCashAdvance
    ): RedirectResponse {
        abort_unless(
            $loanAndCashAdvance->employee_id === $employee->id,
            404
        );

        $loanAndCashAdvance->delete();

        return back()->with(
            'success',
            'Loan or cash advance deleted successfully.'
        );
    }
}