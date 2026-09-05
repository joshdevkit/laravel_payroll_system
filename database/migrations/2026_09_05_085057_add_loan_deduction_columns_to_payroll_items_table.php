<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            $table->decimal('cash_advance_deduction', 12, 2)
                ->default(0)
                ->after('pagibig_deduction');

            $table->decimal('sss_loan_deduction', 12, 2)
                ->default(0)
                ->after('cash_advance_deduction');

            $table->decimal('pagibig_loan_deduction', 12, 2)
                ->default(0)
                ->after('sss_loan_deduction');
        });
    }

    public function down(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            $table->dropColumn([
                'cash_advance_deduction',
                'sss_loan_deduction',
                'pagibig_loan_deduction',
            ]);
        });
    }
};