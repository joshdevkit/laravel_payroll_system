<?php

namespace App\Services\Payroll;

use App\Models\Employee;
use App\Models\PayrollSetting;
use App\Services\Payroll\LeaveCalculationResult;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LeaveCalculator
{
    public function calculate(
        Employee $employee,
        PayrollSetting $settings,
        string $start,
        string $end,
        float $rate
    ): LeaveCalculationResult {
        $paidDays = 0;
        $unpaidDays = 0;
        $pay = 0.0;

        $leaveRequests = DB::table(
            'leave_requests'
        )
            ->where(
                'employee_id',
                $employee->id
            )
            ->where(
                'status',
                'approved'
            )
            ->where(
                'start_date',
                '<=',
                $end
            )
            ->where(
                'end_date',
                '>=',
                $start
            )
            ->get();

        foreach ($leaveRequests as $leave) {
            $isPaid = (bool) DB::table(
                'leave_types'
            )
                ->where(
                    'id',
                    $leave->leave_type_id
                )
                ->value('is_paid');

            $day = Carbon::parse(
                $leave->start_date
            );

            $leaveEnd = Carbon::parse(
                $leave->end_date
            );

            while ($day->lte($leaveEnd)) {
                $date = $day->toDateString();

                if (
                    $date >= $start
                    &&
                    $date <= $end
                ) {
                    if ($isPaid) {
                        $paidDays++;

                        if (
                            (bool)
                                $settings->leave_pay_enabled
                        ) {
                            $pay += $rate;
                        }
                    } else {
                        $unpaidDays++;
                    }
                }

                $day->addDay();
            }
        }

        return new LeaveCalculationResult(
            paidDays: $paidDays,
            unpaidDays: $unpaidDays,
            pay: $pay,
        );
    }
}