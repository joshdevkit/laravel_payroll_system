<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_settings', function (Blueprint $table) {
            $table->boolean('late_enabled')->default(true)->after('daily_work_hours');
            $table->boolean('undertime_enabled')->default(true)->after('late_enabled');
            $table->unsignedInteger('unpaid_break_minutes')->default(60)->after('late_grace_minutes');
            $table->json('work_schedule')->nullable()->after('monthly_daily_rate_divisor');
            $table->json('shift_options')->nullable()->after('work_schedule');
        });
    }

    public function down(): void
    {
        Schema::table('payroll_settings', function (Blueprint $table) {
            $table->dropColumn([
                'late_enabled',
                'undertime_enabled',
                'unpaid_break_minutes',
                'work_schedule',
                'shift_options',
            ]);
        });
    }
};
