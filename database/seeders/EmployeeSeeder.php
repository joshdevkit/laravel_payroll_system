<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Employee;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EmployeeSeeder extends Seeder
{
    /**
     * Seed employees.
     */
    public function run(): void
    {
        $regularStaff = Category::where('name', 'Regular Staff')->firstOrFail();
        $supervisor = Category::where('name', 'Supervisor')->firstOrFail();
        $manager = Category::where('name', 'Manager')->firstOrFail();

        $employees = [
            [
                'employee_id' => '0001',
                'category_id' => $regularStaff->id,
                'full_name' => 'John Doe',
                'employment_type' => 'Regular',
                'rate_type' => 'Daily',
                'basic_rate' => 500.00,
                'daily_rate' => 500.00,
                'sss_no' => '34-1234567-8',
                'philhealth_no' => '12-345678901-2',
                'pagibig_no' => '1234-5678-9012',
                'tin' => '123-456-789-000',
                'date_hired' => '2025-01-15',
            ],
            [
                'employee_id' => '0002',
                'category_id' => $supervisor->id,
                'full_name' => 'Jane Smith',
                'employment_type' => 'Regular',
                'rate_type' => 'Daily',
                'basic_rate' => 650.00,
                'daily_rate' => 650.00,
                'sss_no' => '34-2345678-9',
                'philhealth_no' => '12-456789012-3',
                'pagibig_no' => '2345-6789-0123',
                'tin' => '234-567-890-000',
                'date_hired' => '2024-06-01',
            ],
            [
                'employee_id' => '0003',
                'category_id' => $manager->id,
                'full_name' => 'Michael Johnson',
                'employment_type' => 'Regular',
                'rate_type' => 'Daily',
                'basic_rate' => 800.00,
                'daily_rate' => 800.00,
                'sss_no' => '34-3456789-0',
                'philhealth_no' => '12-567890123-4',
                'pagibig_no' => '3456-7890-1234',
                'tin' => '345-678-901-000',
                'date_hired' => '2023-03-20',
            ],
        ];

        foreach ($employees as $employee) {
            Employee::updateOrCreate(
                [
                    'employee_id' => $employee['employee_id'],
                ],
                array_merge(
                    [
                        'id' => (string) Str::uuid(),
                    ],
                    $employee,
                ),
            );
        }
    }
}
