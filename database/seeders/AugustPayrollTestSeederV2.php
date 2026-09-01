<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\EmployeeSchedule;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AugustPayrollTestSeederV2 extends Seeder
{
    public function run(): void
    {
        $employees = Employee::query()->orderBy('employee_id')->limit(3)->get();
        if ($employees->count() < 3) {
            throw new \RuntimeException('AugustPayrollTestSeederV2 requires at least 3 existing employees.');
        }

        [$employeeOne, $employeeTwo, $employeeThree] = $employees->all();
        $start = Carbon::create(2026, 8, 14);
        $end = Carbon::create(2026, 8, 28);

        DB::transaction(function () use ($employeeOne, $employeeTwo, $employeeThree, $start, $end): void {
            $ids = [$employeeOne->id, $employeeTwo->id, $employeeThree->id];
            Attendance::whereIn('employee_id', $ids)->whereBetween('work_date', [$start->toDateString(), $end->toDateString()])->delete();
            EmployeeSchedule::whereIn('employee_id', $ids)->whereBetween('work_date', [$start->toDateString(), $end->toDateString()])->delete();

            $day = $start->copy();
            $index = 0;
            while ($day->lte($end)) {
                if ($day->isWeekday()) {
                    $date = $day->toDateString();
                    $index++;
                    $this->schedule($employeeOne->id, $date, 1, '08:00:00', '17:00:00', 60);
                    $this->attendance($employeeOne->id, $date, 1, $index % 3 === 0 ? '08:15:00' : '08:00:00', '17:00:00');
                    $this->schedule($employeeTwo->id, $date, 1, '08:00:00', '17:00:00', 60);
                    $this->attendance($employeeTwo->id, $date, 1, $index % 4 === 0 ? '08:20:00' : '08:00:00', '17:00:00');
                    $this->schedule($employeeTwo->id, $date, 2, '19:00:00', '03:00:00', 60);
                    $this->attendance($employeeTwo->id, $date, 2, $index === 1 ? '19:00:00' : ($index % 3 === 0 ? '19:30:00' : '19:00:00'), $index === 1 ? '21:30:00' : '03:00:00');
                    $this->schedule($employeeThree->id, $date, 1, '22:00:00', '07:00:00', 60);
                    $this->attendance($employeeThree->id, $date, 1, $index % 4 === 0 ? '22:15:00' : '22:00:00', '07:00:00');
                }
                $day->addDay();
            }
        });

        $this->command?->info('August 14-28, 2026 payroll test data seeded for the first 3 employees.');
    }

    private function schedule(string $employeeId, string $workDate, int $segmentNo, string $startTime, string $endTime, int $breakMinutes): void
    {
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

    private function attendance(string $employeeId, string $workDate, int $segmentNo, string $timeIn, string $timeOut): void
    {
        $timeInAt = Carbon::parse($workDate . ' ' . $timeIn);
        $timeOutAt = Carbon::parse($workDate . ' ' . $timeOut);
        if ($timeOutAt->lessThanOrEqualTo($timeInAt)) {
            $timeOutAt = $timeOutAt->addDay();
        }

        Attendance::create([
            'employee_id' => $employeeId,
            'work_date' => $workDate,
            'segment_no' => $segmentNo,
            'time_in' => $timeInAt,
            'time_out' => $timeOutAt,
            'status' => 'present',
            'source' => 'seeder',
            'notes' => 'August payroll calculation test data',
        ]);
    }
}
