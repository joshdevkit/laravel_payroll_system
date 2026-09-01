<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Employee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function index(): Response
    {
        return inertia('Employees/Index', [
            'employees' => Employee::query()->with('category')
                ->orderBy('full_name')
                ->get(),
            'categories' => Category::query()
                ->select(['id', 'name'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $employee = $this->validatedData($request);

        Employee::create($employee);

        return back()->with('success', 'Employee added successfully.');
    }

    public function update(
        Request $request,
        Employee $employee
    ): RedirectResponse {
        $validated = $request->validate([
            'employee_id' => [
                'required',
                'string',
                'max:50',
                'unique:employees,employee_id,' . $employee->id,
            ],

            'category_id' => [
                'required',
                'integer',
                'exists:categories,id',
            ],

            'full_name' => [
                'required',
                'string',
                'max:255',
            ],

            'employment_type' => [
                'required',
                'in:regular,probationary,contractual',
            ],

            'rate_type' => [
                'required',
                'in:daily,monthly',
            ],

            'basic_rate' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'daily_rate' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'sss_no' => [
                'nullable',
                'string',
                'max:50',
            ],

            'philhealth_no' => [
                'nullable',
                'string',
                'max:50',
            ],

            'pagibig_no' => [
                'nullable',
                'string',
                'max:50',
            ],

            'tin' => [
                'nullable',
                'string',
                'max:50',
            ],

            'date_hired' => [
                'required',
                'date',
            ],
        ]);

        /*
         * Keep only the appropriate rate.
         */
        if ($validated['rate_type'] === 'daily') {
            $validated['basic_rate'] = null;
        } else {
            $validated['daily_rate'] = null;
        }

        $employee->update($validated);

        return back()->with(
            'success',
            'Employee updated successfully.'
        );
    }

    public function destroy(Employee $employee): RedirectResponse
    {
        $employee->delete();

        return back()->with('success', 'Employee deleted successfully.');
    }

    private function validatedData(Request $request): array
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'full_name' => ['required', 'string', 'min:2', 'max:255'],
            'employment_type' => ['required', 'in:regular,probationary,contractual'],
            'rate_type' => ['required', 'in:daily,monthly'],
            'basic_rate' => ['nullable', 'numeric', 'min:0'],
            'daily_rate' => ['nullable', 'numeric', 'min:0'],
            'sss_no' => ['nullable', 'string', 'max:255'],
            'philhealth_no' => ['nullable', 'string', 'max:255'],
            'pagibig_no' => ['nullable', 'string', 'max:255'],
            'tin' => ['nullable', 'string', 'max:255'],
            'date_hired' => ['required', 'date'],
        ]);

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
