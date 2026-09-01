<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sss_deductions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->decimal('amount', 12, 2);
            $table->string('deduction_schedule', 30)->default('every_payroll');
            $table->date('effective_from');
            $table->date('effective_until')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('employee_id')
                ->references('id')
                ->on('employees')
                ->cascadeOnDelete();

            $table->index(['employee_id', 'is_active']);
            $table->index(['deduction_schedule', 'effective_from']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sss_deductions');
    }
};
