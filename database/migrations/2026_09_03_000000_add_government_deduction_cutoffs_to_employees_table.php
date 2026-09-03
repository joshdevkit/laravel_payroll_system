<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('philhealth_deduction_cutoff', 10)
                ->nullable()
                ->after('philhealth_no');

            $table->string('pagibig_deduction_cutoff', 10)
                ->nullable()
                ->after('pagibig_no');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'philhealth_deduction_cutoff',
                'pagibig_deduction_cutoff',
            ]);
        });
    }
};
