<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\EmployeeSchedule;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AugustPayrollTestSeeder extends Seeder
{
    /**
     * Repeatable test data for the August 14-28, 2026 cutoff.
     *
     * Uses the first three existing employees. It intentionally creates:
     * - regular daytime attendance
     * - tardy attendance
     * - a split shift that crosses into NSD
     * - an attendance that ends before NSD starts
     * - an overnight schedule/attendance crossing midnight
     *
     * It does not delete employees or other master data.
     */
    public function run(): void
    {
        $employees = Employee::query()
            ->orderBy('employee_id')
            ->limit(3)
            ->get();

        if ($employees->count() < 3) {
            throw new \RuntimeException('AugustPayrollTestSeeder requires at least 3 existing employees.');
        }

        $employeeOne = $employees[0];
        $employeeTwo = $employees[1];
        $employeeThree = $employees[2];

        $start = Carbon::create(2026, 8, 14);
        $end = Carbon::create(2026, 8, 28);

        DB::transaction(function () use ($employeeOne, $employeeTwo, $employeeThree, $start, $end): void {
            // Remove only test-period schedules/attendance for these three employees.
            Attendance::query()
                ->whereIn('employee_id', [$employeeOne->id, $employeeTwo->id, $employeeThree->id])
                ->whereBetween('work_date', [$start->toDateString(), $end->toDateString()])
                ->delete();

            EmployeeSchedule::query()
                ->whereIn('employee_id', [$employeeOne->id, $employeeTwo->id, $employeeThree->id])
                ->whereBetween('work_date', [$start->toDateString(), $end->toDateString()])
                ->delete();

            $day = $start->copy();
            $workingDayIndex = 0;

            while ($day->lte($end)) {
                // Monday-Friday only for this test dataset.
                if ($day->isWeekday()) {
                    $date = $day->toDateString();
                    $workingDayIndex++;

                    // Employee 1: normal day shift, with deliberate tardy on every 3rd workday.
                    $this->schedule($employeeOne->id, $date, 1, '08:00:00', '17:00:00', 60);
                    $this->attendance(
                        $employeeOne->id,
                        $date,
                        1,
                        $workingDayIndex % 3 === 0 ? '08:15:00' : '08:00:00',
                        '17:00:00',
                    );

                    // Employee 2: day shift + evening/overnight segment.
                    $this->schedule($employeeTwo->id, $date, 1, '08:00:00', '17:00:00', 60);
                    $this->attendance(
                        $employeeTwo->id,
                        $date,
                        1,
                        $workingDayIndex % 4 === 0 ? '08:20:00' : '08:00:00',
                        '17:00:00',
                    );

                    $this->schedule($employeeTwo->id, $date, 2, '19:00:00', '03:00:00', 60);

                    // First evening test ends before 22:00: no NSD should be generated.
                    // Other days work through the NSD window.
                    if ($workingDayIndex === 1) {
                        $this->attendance($employeeTwo->id, $date, 2, '19:00:00', '21:30:00');
                    } else {
                        $this->attendance(
                            $employeeTwo->id,
                            $date,
                            2,
                            $workingDayIndex % 3 === 0 ? '19:30:00' : '19:00:00',
                            '03:00:00',
                        );
                    }

                    // Employee 3: pure overnight shift, deliberately crosses midnight.
                    $this->schedule($employeeThree->id, $date, 1, '22:00:00', '07:00:00', 60);
                    $this->attendance(
                        $employeeThree->id,
                        $date,
                        1,
                        $workingDayIndex % 4 === 0 ? '22:15:00' : '22:00:00',
                        '07:00:00',
                    );
                }

                $day->addDay();
            }
        });

        $this->command?->info('August 14-28, 2026 payroll test data seeded for the first 3 employees.');
    }

    private function schedule(
        string $employeeId,
        string $workDate,
        int $segmentNo,
        string $startTime,
        string $endTime,
        int $breakMinutes,
    ): void {
        EmployeeSchedule::create([
            'employee_id' => $employeeId,
            'work_date' => $workDate,
            'segment_no' => $segmentNo,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'break_minutes' => $breakMinutes,
            'is_working_day' => true,
            'notes' => 'August payroll calculation test data',
        ]);
    }

    private function attendance(
        string $employeeId,
        string $workDate,
        int $segmentNo,
        string $timeIn,
        string $timeOut,
    ): void {
        Attendance::create([
            'employee_id' => $employeeId,
            'work_date' => $workDate,
            'segment_no' => $segmentNo,
            'time_in' => Carbon::parse($workDate . ' ' . $timeIn),
            'time_out' => Carbon::parse($workDate . ' ' . $timeOut)->addDayIf($timeOut < $timeIn),
            'status' => 'present',
            'source' => 'seeder',
            'notes' => 'August payroll calculation test data',
        ]);
    }
}
