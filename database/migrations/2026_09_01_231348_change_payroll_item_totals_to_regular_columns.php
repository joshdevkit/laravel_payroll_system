<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            $table->decimal('total_earnings', 14, 2)
                ->default(0)
                ->change();

            $table->decimal('total_deductions', 14, 2)
                ->default(0)
                ->change();

            $table->decimal('net_pay', 14, 2)
                ->default(0)
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            $table->decimal('total_earnings', 14, 2)
                ->storedAs(
                    '(basic_pay + overtime_pay + holiday_pay + night_diff + leave_pay + bonus)'
                )
                ->change();

            $table->decimal('total_deductions', 14, 2)
                ->storedAs(
                    '(sss_deduction + philhealth_deduction + pagibig_deduction + tax_deduction + leave_deduction + other_deductions)'
                )
                ->change();

            $table->decimal('net_pay', 14, 2)
                ->storedAs(
                    '((basic_pay + overtime_pay + holiday_pay + night_diff + leave_pay + bonus) - (sss_deduction + philhealth_deduction + pagibig_deduction + tax_deduction + leave_deduction + other_deductions))'
                )
                ->change();
        });
    }
};