<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the final payroll_system_v1 schema in Laravel form.
     *
     * This is a consolidated migration. The original project used a series
     * of Supabase migrations; this migration represents the final schema
     * after those migrations and cleanup/alignment changes were applied.
     */
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('employee_id')->unique();
            $table->string('full_name');
            $table->string('employment_type');
            $table->string('rate_type');
            $table->decimal('basic_rate', 14, 2)->nullable();
            $table->decimal('daily_rate', 14, 2)->nullable();
            $table->string('sss_no')->nullable();
            $table->string('philhealth_no')->nullable();
            $table->string('pagibig_no')->nullable();
            $table->string('tin')->nullable();
            $table->date('date_hired');
            $table->timestamps();
        });

        Schema::create('employee_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();
            $table->date('work_date');
            $table->unsignedInteger('segment_no')->default(1);
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedInteger('break_minutes')->default(0);
            $table->boolean('is_working_day')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'work_date', 'segment_no']);
            $table->index('work_date', 'employee_schedules_date_idx');
            $table->index(['employee_id', 'work_date'], 'employee_schedules_employee_date_idx');
        });

        Schema::create('attendance', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();
            $table->date('work_date');
            $table->unsignedInteger('segment_no')->default(1);
            $table->timestampTz('time_in')->nullable();
            $table->timestampTz('time_out')->nullable();
            $table->string('status')->default('present');
            $table->string('source')->default('manual');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(
                ['employee_id', 'work_date', 'segment_no'],
                'attendance_employee_work_date_segment_unique'
            );
            $table->index(['employee_id', 'work_date'], 'attendance_employee_date_idx');
            $table->index('work_date', 'attendance_date_idx');
        });

        Schema::create('leave_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->boolean('is_paid')->default(false);
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('leave_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();
            $table->foreignUuid('leave_type_id')
                ->constrained('leave_types')
                ->restrictOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(
                ['employee_id', 'start_date', 'end_date'],
                'leave_requests_employee_dates_idx'
            );
        });

        Schema::create('holidays', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('date')->unique();
            $table->string('name');
            $table->string('type');
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('payroll_settings', function (Blueprint $table) {
            $table->id();

            $table->decimal('daily_work_hours', 6, 2)->default(8);

            $table->boolean('late_enabled')->default(true);
            $table->boolean('undertime_enabled')->default(true);
            $table->boolean('overtime_enabled')->default(true);

            $table->decimal('overtime_multiplier', 8, 4)->default(1.25);
            $table->unsignedInteger('overtime_threshold_minutes')->default(0);
            $table->unsignedInteger('late_grace_minutes')->default(0);
            $table->unsignedInteger('unpaid_break_minutes')->default(60);

            $table->boolean('night_diff_enabled')->default(true);
            $table->time('night_diff_start')->default('22:00:00');
            $table->time('night_diff_end')->default('06:00:00');
            $table->decimal('night_diff_multiplier', 8, 4)->default(0.10);

            $table->boolean('holiday_pay_enabled')->default(true);
            $table->decimal('holiday_regular_multiplier', 8, 4)->default(2.00);
            $table->decimal('holiday_special_multiplier', 8, 4)->default(1.30);

            $table->boolean('leave_pay_enabled')->default(true);
            $table->decimal('monthly_daily_rate_divisor', 8, 2)->default(26);

            $table->json('work_schedule')->nullable();
            $table->json('shift_options')->nullable();

            $table->string('attendance_import_start_cell')->default('C3');
            $table->string('schedule_import_start_cell')->default('C3');

            $table->timestamps();
        });

        DB::table('payroll_settings')->insert([
            'daily_work_hours' => 8,
            'late_enabled' => true,
            'undertime_enabled' => true,
            'overtime_enabled' => true,
            'overtime_multiplier' => 1.25,
            'overtime_threshold_minutes' => 0,
            'late_grace_minutes' => 0,
            'unpaid_break_minutes' => 60,
            'night_diff_enabled' => true,
            'night_diff_start' => '22:00:00',
            'night_diff_end' => '06:00:00',
            'night_diff_multiplier' => 0.10,
            'holiday_pay_enabled' => true,
            'holiday_regular_multiplier' => 2.00,
            'holiday_special_multiplier' => 1.30,
            'leave_pay_enabled' => true,
            'monthly_daily_rate_divisor' => 26,
            'work_schedule' => null,
            'shift_options' => null,
            'attendance_import_start_cell' => 'C3',
            'schedule_import_start_cell' => 'C3',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Schema::create('payroll_runs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('cutoff_start');
            $table->date('cutoff_end');
            $table->date('pay_date');
            $table->string('status')->default('draft');
            $table->json('settings_snapshot')->nullable();
            $table->timestamps();

            $table->index('pay_date', 'payroll_runs_pay_date_idx');
        });

        Schema::create('payroll_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('payroll_run_id')
                ->constrained('payroll_runs')
                ->cascadeOnDelete();
            $table->foreignUuid('employee_id')
                ->constrained('employees')
                ->restrictOnDelete();

            $table->decimal('scheduled_workdays', 14, 2)->default(0);
            $table->decimal('present_days', 14, 2)->default(0);
            $table->decimal('absent_days', 14, 2)->default(0);
            $table->decimal('leave_days', 14, 2)->default(0);
            $table->decimal('paid_leave_days', 14, 2)->default(0);
            $table->decimal('unpaid_leave_days', 14, 2)->default(0);
            $table->decimal('holiday_days', 14, 2)->default(0);
            $table->unsignedInteger('late_minutes')->default(0);
            $table->unsignedInteger('undertime_minutes')->default(0);
            $table->unsignedInteger('overtime_minutes')->default(0);
            $table->unsignedInteger('night_diff_minutes')->default(0);

            $table->decimal('basic_pay', 14, 2)->default(0);
            $table->decimal('overtime_pay', 14, 2)->default(0);
            $table->decimal('holiday_pay', 14, 2)->default(0);
            $table->decimal('night_diff', 14, 2)->default(0);
            $table->decimal('leave_pay', 14, 2)->default(0);
            $table->decimal('bonus', 14, 2)->default(0);
            $table->decimal('sss_deduction', 14, 2)->default(0);
            $table->decimal('philhealth_deduction', 14, 2)->default(0);
            $table->decimal('pagibig_deduction', 14, 2)->default(0);
            $table->decimal('tax_deduction', 14, 2)->default(0);
            $table->decimal('leave_deduction', 14, 2)->default(0);
            $table->decimal('other_deductions', 14, 2)->default(0);

            $table->decimal('total_earnings', 14, 2)
                ->storedAs('(basic_pay + overtime_pay + holiday_pay + night_diff + leave_pay + bonus)');
            $table->decimal('total_deductions', 14, 2)
                ->storedAs('(sss_deduction + philhealth_deduction + pagibig_deduction + tax_deduction + leave_deduction + other_deductions)');
            $table->decimal('net_pay', 14, 2)
                ->storedAs('((basic_pay + overtime_pay + holiday_pay + night_diff + leave_pay + bonus) - (sss_deduction + philhealth_deduction + pagibig_deduction + tax_deduction + leave_deduction + other_deductions))');

            $table->json('calculation_snapshot')->nullable();
            $table->timestamps();

            $table->unique(['payroll_run_id', 'employee_id']);
            $table->index('payroll_run_id', 'payroll_items_run_idx');
        });

        Schema::create('payroll_schedule_details', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('payroll_item_id')
                ->constrained('payroll_items')
                ->cascadeOnDelete();
            $table->date('work_date');
            $table->unsignedInteger('segment_no');
            $table->timestampTz('scheduled_start');
            $table->timestampTz('scheduled_end');
            $table->timestampTz('actual_in')->nullable();
            $table->timestampTz('actual_out')->nullable();
            $table->integer('scheduled_minutes')->default(0);
            $table->integer('break_minutes')->default(0);
            $table->integer('worked_minutes')->default(0);
            $table->integer('late_minutes')->default(0);
            $table->integer('undertime_minutes')->default(0);
            $table->integer('overtime_minutes')->default(0);
            $table->integer('night_diff_minutes')->default(0);
            $table->boolean('is_present')->default(false);
            $table->decimal('overtime_pay', 12, 2)->default(0);
            $table->decimal('night_diff_pay', 12, 2)->default(0);
            $table->text('calculation_notes')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(
                ['payroll_item_id', 'work_date', 'segment_no'],
                'payroll_schedule_details_item_date_segment_key'
            );
            $table->index('payroll_item_id', 'idx_payroll_schedule_details_item');
            $table->index('work_date', 'idx_payroll_schedule_details_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_schedule_details');
        Schema::dropIfExists('payroll_items');
        Schema::dropIfExists('payroll_runs');
        Schema::dropIfExists('payroll_settings');
        Schema::dropIfExists('holidays');
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('leave_types');
        Schema::dropIfExists('attendance');
        Schema::dropIfExists('employee_schedules');
        Schema::dropIfExists('employees');
    }
};
