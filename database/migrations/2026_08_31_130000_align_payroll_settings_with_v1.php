<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('payroll_settings')) {
            return;
        }

        // Existing Laravel installs were created with a 0-minute OT threshold.
        // V1's current payroll behavior qualifies overtime only after 60 minutes.
        DB::table('payroll_settings')
            ->where('overtime_threshold_minutes', 0)
            ->update(['overtime_threshold_minutes' => 60]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('payroll_settings')) {
            return;
        }

        DB::table('payroll_settings')
            ->where('overtime_threshold_minutes', 60)
            ->update(['overtime_threshold_minutes' => 0]);
    }
};
