<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            $table->dropColumn([
                'total_deductions',
                'net_pay',
            ]);
        });

        Schema::table('payroll_items', function (Blueprint $table) {
            $table->decimal('total_deductions', 14, 2)
                ->storedAs(
                    '(tardy_deduction + sss_deduction + philhealth_deduction + pagibig_deduction + tax_deduction + leave_deduction + other_deductions)'
                );

            $table->decimal('net_pay', 14, 2)
                ->storedAs(
                    '((basic_pay + overtime_pay + holiday_pay + night_diff + leave_pay + bonus) - (tardy_deduction + sss_deduction + philhealth_deduction + pagibig_deduction + tax_deduction + leave_deduction + other_deductions))'
                );
        });
    }

    public function down(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            $table->dropColumn([
                'total_deductions',
                'net_pay',
            ]);
        });

        Schema::table('payroll_items', function (Blueprint $table) {
            $table->decimal('total_deductions', 14, 2)
                ->storedAs(
                    '(sss_deduction + philhealth_deduction + pagibig_deduction + tax_deduction + leave_deduction + other_deductions)'
                );

            $table->decimal('net_pay', 14, 2)
                ->storedAs(
                    '((basic_pay + overtime_pay + holiday_pay + night_diff + leave_pay + bonus) - (sss_deduction + philhealth_deduction + pagibig_deduction + tax_deduction + leave_deduction + other_deductions))'
                );
        });
    }
};
