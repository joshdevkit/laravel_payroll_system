<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        /*
         * Drop the generated-column definitions first.
         *
         * MySQL does not allow us to simply insert into
         * a generated column.
         */

        DB::statement("
            ALTER TABLE payroll_items
            DROP COLUMN total_earnings
        ");

        DB::statement("
            ALTER TABLE payroll_items
            DROP COLUMN total_deductions
        ");

        DB::statement("
            ALTER TABLE payroll_items
            DROP COLUMN net_pay
        ");

        /*
         * Re-create them as normal decimal columns.
         */
        Schema::table('payroll_items', function (Blueprint $table) {
            $table->decimal('total_earnings', 14, 2)
                ->default(0)
                ->after('tardy_deduction');

            $table->decimal('total_deductions', 14, 2)
                ->default(0)
                ->after('total_earnings');

            $table->decimal('net_pay', 14, 2)
                ->default(0)
                ->after('total_deductions');
        });
    }

    public function down(): void
    {
        /*
         * Remove the normal columns.
         */
        Schema::table('payroll_items', function (Blueprint $table) {
            $table->dropColumn([
                'total_earnings',
                'total_deductions',
                'net_pay',
            ]);
        });

        /*
         * Restore generated columns.
         */
        DB::statement("
            ALTER TABLE payroll_items
            ADD total_earnings DECIMAL(14,2)
            GENERATED ALWAYS AS (
                basic_pay
                + overtime_pay
                + holiday_pay
                + night_diff
                + leave_pay
                + bonus
            ) STORED
        ");

        DB::statement("
            ALTER TABLE payroll_items
            ADD total_deductions DECIMAL(14,2)
            GENERATED ALWAYS AS (
                sss_deduction
                + philhealth_deduction
                + pagibig_deduction
                + tax_deduction
                + leave_deduction
                + other_deductions
                + tardy_deduction
            ) STORED
        ");

        DB::statement("
            ALTER TABLE payroll_items
            ADD net_pay DECIMAL(14,2)
            GENERATED ALWAYS AS (
                total_earnings - total_deductions
            ) STORED
        ");
    }
};
