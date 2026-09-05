<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('loan_deductions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('loan_and_cash_advance_id')
                ->constrained('loan_and_cash_advances')
                ->cascadeOnDelete();

            $table->foreignUuid('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            $table->foreignUuid('payroll_run_id')
                ->constrained('payroll_runs')
                ->cascadeOnDelete();

            $table->foreignUuid('payroll_item_id')
                ->constrained('payroll_items')
                ->cascadeOnDelete();

            $table->decimal('amount', 12, 2);

            $table->decimal('balance_before', 12, 2);

            $table->decimal('balance_after', 12, 2);

            $table->date('deduction_date');

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->unique([
                'loan_and_cash_advance_id',
                'payroll_run_id',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loan_deductions');
    }
};