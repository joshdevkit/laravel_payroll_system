<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Employee;
use App\Models\PayrollItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function index(): Response
    {
        return inertia('Employees/Index', [
            'employees' => Employee::query()->with(['category', 'branch'])
                ->orderBy('full_name')
                ->get(),
            'categories' => Category::query()
                ->select(['id', 'name'])
                ->orderBy('name')
                ->get(),
            'branches' => Branch::query()
                ->select(['id', 'name'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatedData($request);

        Employee::create($validated);

        return back()->with('success', 'Employee added successfully.');
    }

    public function update(
        Request $request,
        Employee $employee
    ): RedirectResponse {
        $validated = $this->validatedData($request, $employee->id);

        $employee->update($validated);

        return back()->with(
            'success',
            'Employee updated successfully.'
        );
    }

    public function destroy(Employee $employee): RedirectResponse
    {
        DB::transaction(function () use ($employee) {

            /*
         * ---------------------------------------------------------
         * LOAN DEDUCTIONS
         * ---------------------------------------------------------
         *
         * Delete the employee's loan deduction history first.
         */
            $employee->loanDeductions()->delete();

            /*
         * ---------------------------------------------------------
         * LOANS / CASH ADVANCES
         * ---------------------------------------------------------
         *
         * loan_deductions has a foreign key to
         * loan_and_cash_advances.
         */
            $employee->loansAndCashAdvances()->delete();

            /*
         * ---------------------------------------------------------
         * PAYROLL ITEMS
         * ---------------------------------------------------------
         *
         * Payroll items have their own child records.
         */
            $employee->payrollItems()->each(function (PayrollItem $item) {

                // Delete payroll schedule details
                $item->scheduleDetails()->delete();

                // Delete loan deductions attached to this payroll item
                $item->loanDeductions()->delete();

                // Delete the payroll item
                $item->delete();
            });

            /*
         * ---------------------------------------------------------
         * SSS
         * ---------------------------------------------------------
         */
            $employee->sssDeductions()->delete();
            $employee->sssContributions()->delete();

            /*
         * ---------------------------------------------------------
         * ATTENDANCE
         * ---------------------------------------------------------
         */
            $employee->attendance()->delete();

            /*
         * ---------------------------------------------------------
         * EMPLOYEE SCHEDULES
         * ---------------------------------------------------------
         */
            $employee->schedules()->delete();

            /*
         * ---------------------------------------------------------
         * EMPLOYEE
         * ---------------------------------------------------------
         */
            $employee->delete();
        });

        return back()->with(
            'success',
            'Employee and all related records deleted successfully.'
        );
    }

    /**
     * Shared validation for store() and update().
     *
     * $employeeId is null on create, and the employee's id on update
     * (so the employee_id uniqueness check ignores the current record).
     */
    private function validatedData(Request $request, ?string $employeeId = null): array
    {
        $validated = $request->validate([
            'employee_id' => [
                'required',
                'string',
                'max:50',
                $employeeId
                    ? 'unique:employees,employee_id,' . $employeeId
                    : 'unique:employees,employee_id',
            ],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'branch_id' => ['required', 'string', 'exists:branches,id'],
            'full_name' => ['required', 'string', 'min:2', 'max:255'],
            'employment_type' => ['required', 'in:regular,probationary,contractual'],
            'rate_type' => ['required', 'in:daily,monthly'],
            'basic_rate' => ['nullable', 'numeric', 'min:0'],
            'daily_rate' => ['nullable', 'numeric', 'min:0'],
            'date_hired' => ['required', 'date'],

            // Personal information
            'birthday' => ['nullable', 'date'],
            'place_of_birth' => ['nullable', 'string', 'max:255'],
            'sex' => ['nullable', 'in:male,female'],
            'civil_status' => ['nullable', 'in:single,married,widow,separated'],
            'nationality' => ['nullable', 'string', 'max:255'],
            'home_address' => ['nullable', 'string', 'max:500'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'email_address' => ['nullable', 'email', 'max:255'],

            // Government IDs
            'sss_no' => ['nullable', 'string', 'max:50'],
            'philhealth_no' => ['nullable', 'string', 'max:50'],
            'pagibig_no' => ['nullable', 'string', 'max:50'],
            'tin' => ['nullable', 'string', 'max:50'],

            // Payroll configuration
            // NOTE: cutoff columns are assumed to be a day-of-month (1-31).
            // Adjust the rule/type here if they're actually stored differently.
            'is_cola_eligible' => ['sometimes', 'boolean'],
            'cola_amount' => ['sometimes', 'numeric', 'min:0'],
            'sss_deduction_cutoff' => ['nullable', 'integer', 'between:1,31'],
            'sss_msc_override' => ['nullable', 'numeric', 'min:0'],
            'philhealth_deduction_cutoff' => ['nullable', 'integer', 'between:1,31'],
            'pagibig_deduction_cutoff' => ['nullable', 'integer', 'between:1,31'],
        ], [
            'category_id.required' => 'Please select a department.',
            'category_id.exists' => 'Department not selected',
            'branch_id.required' => 'Branch is mandatory to save.',
            'branch_id.exists' => 'Branch not selected',
        ]);

        /*
         * Keep only the rate relevant to the selected rate type, and
         * require that one to actually be filled in.
         */
        if ($validated['rate_type'] === 'daily') {
            $request->validate([
                'daily_rate' => ['required', 'numeric', 'gt:0'],
            ]);

            $validated['basic_rate'] = null;
        } else {
            $request->validate([
                'basic_rate' => ['required', 'numeric', 'gt:0'],
            ]);

            $validated['daily_rate'] = null;
        }

        return $validated;
    }
}