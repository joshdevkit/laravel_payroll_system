<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sss_contributions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();
            $table->foreignUuid('payroll_run_id')
                ->constrained('payroll_runs')
                ->cascadeOnDelete();
            $table->foreignUuid('payroll_item_id')
                ->constrained('payroll_items')
                ->cascadeOnDelete();
            $table->foreignId('sss_contribution_table_id')
                ->constrained('sss_contribution_tables')
                ->restrictOnDelete();

            $table->date('contribution_date');
            $table->decimal('monthly_compensation', 14, 2);
            $table->decimal('monthly_salary_credit', 14, 2);
            $table->decimal('employee_regular_ss', 14, 2)->default(0);
            $table->decimal('employee_mpf', 14, 2)->default(0);
            $table->decimal('employee_total', 14, 2)->default(0);
            $table->decimal('employer_regular_ss', 14, 2)->default(0);
            $table->decimal('employer_mpf', 14, 2)->default(0);
            $table->decimal('employer_ec', 14, 2)->default(0);
            $table->decimal('employer_total', 14, 2)->default(0);
            $table->date('effective_from');
            $table->string('source')->nullable();
            $table->timestamps();

            $table->unique('payroll_item_id', 'sss_contributions_payroll_item_unique');
            $table->index(['employee_id', 'contribution_date'], 'sss_contributions_employee_date_idx');
            $table->index(['payroll_run_id', 'employee_id'], 'sss_contributions_run_employee_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sss_contributions');
    }
};
