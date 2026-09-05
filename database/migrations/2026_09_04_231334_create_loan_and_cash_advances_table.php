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
        Schema::create('loan_and_cash_advances', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();

            /*
             * Type of financial obligation.
             */
            $table->enum('type', [
                'sss',
                'pag_ibig',
                'cash_advance',
            ]);

            /*
             * Optional reference number from SSS,
             * Pag-IBIG, accounting, or internal records.
             */
            $table->string('reference_no')->nullable();

            /*
             * Original amount borrowed.
             */
            $table->decimal('principal_amount', 12, 2);

            /*
             * Remaining unpaid amount.
             *
             * This should ONLY be changed when an actual
             * payroll deduction/payment is posted.
             */
            $table->decimal('balance', 12, 2);

            /*
             * Amount to deduct per scheduled deduction.
             */
            $table->decimal('deduction_amount', 12, 2);

            /*
             * How frequently the deduction should occur.
             */
            $table->enum('deduction_frequency', [
                'per_cutoff',
                'monthly',
                'one_time',
            ])->default('per_cutoff');

            /*
             * Which payroll cutoff should receive the deduction.
             *
             * first  = 1st cutoff
             * second = 2nd cutoff
             * both   = every cutoff
             */
            $table->enum('deduction_cutoff', [
                'first',
                'second',
                'both',
            ])->default('second');

            /*
             * Date when automatic payroll deduction starts.
             */
            $table->date('start_date');

            /*
             * Optional date when the deduction schedule ends.
             */
            $table->date('end_date')->nullable();

            /*
             * active    = currently being deducted
             * paid     = fully paid
             * cancelled = no longer active
             */
            $table->enum('status', [
                'active',
                'paid',
                'cancelled',
            ])->default('active');

            /*
             * Original transaction/loan date.
             */
            $table->date('date');

            $table->text('notes')->nullable();

            $table->timestamps();

            /*
             * Useful indexes for payroll calculations.
             */
            $table->index([
                'employee_id',
                'status',
            ]);

            $table->index([
                'type',
                'status',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loan_and_cash_advances');
    }
};