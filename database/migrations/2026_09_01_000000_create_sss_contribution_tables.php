<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sss_contribution_tables', function (Blueprint $table) {
            $table->id();
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->decimal('compensation_min', 14, 2)->default(0);
            $table->decimal('compensation_max', 14, 2)->nullable();
            $table->decimal('monthly_salary_credit', 14, 2);
            $table->decimal('employee_regular_ss', 14, 2)->default(0);
            $table->decimal('employee_mpf', 14, 2)->default(0);
            $table->decimal('employee_total', 14, 2)->default(0);
            $table->decimal('employer_regular_ss', 14, 2)->default(0);
            $table->decimal('employer_mpf', 14, 2)->default(0);
            $table->decimal('employer_ec', 14, 2)->default(0);
            $table->decimal('employer_total', 14, 2)->default(0);
            $table->string('source')->nullable();
            $table->timestamps();

            $table->index(
                ['effective_from', 'effective_to'],
                'sss_contribution_effective_idx'
            );

            $table->index(
                ['compensation_min', 'compensation_max'],
                'sss_contribution_compensation_idx'
            );

            $table->unique(
                ['effective_from', 'compensation_min'],
                'sss_contribution_effective_compensation_unique'
            );
        });

        // SSS Circular No. 2024-006: Business Employers and Employees,
        // effective January 1, 2025.
        //
        // The official schedule has 500-peso MSC increments. Compensation
        // below 5,250 maps to MSC 5,000; each following bracket is 500 wide,
        // and 34,750 and above maps to the maximum MSC of 35,000.
        $rows = [];
        $now = now();

        for ($i = 0; $i <= 60; $i++) {
            $msc = 5_000 + ($i * 500);

            $minimum = $i === 0
                ? 0
                : 5_250 + (($i - 1) * 500);

            $maximum = $i === 60
                ? null
                : $minimum + 499.99;

            $regularMsc = min($msc, 20_000);
            $mpfMsc = max(0, $msc - 20_000);

            $employeeRegularSs = $regularMsc * 0.05;
            $employeeMpf = $mpfMsc * 0.05;
            $employeeTotal = $employeeRegularSs + $employeeMpf;

            $employerRegularSs = $regularMsc * 0.10;
            $employerMpf = $mpfMsc * 0.10;
            $employerEc = $msc <= 14_500 ? 10.00 : 30.00;
            $employerTotal =
                $employerRegularSs
                + $employerMpf
                + $employerEc;

            $rows[] = [
                'effective_from' => '2025-01-01',
                'effective_to' => null,
                'compensation_min' => $minimum,
                'compensation_max' => $maximum,
                'monthly_salary_credit' => $msc,
                'employee_regular_ss' => $employeeRegularSs,
                'employee_mpf' => $employeeMpf,
                'employee_total' => $employeeTotal,
                'employer_regular_ss' => $employerRegularSs,
                'employer_mpf' => $employerMpf,
                'employer_ec' => $employerEc,
                'employer_total' => $employerTotal,
                'source' => 'SSS Circular No. 2024-006',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('sss_contribution_tables')->insert($rows);
    }

    public function down(): void
    {
        Schema::dropIfExists('sss_contribution_tables');
    }
};
