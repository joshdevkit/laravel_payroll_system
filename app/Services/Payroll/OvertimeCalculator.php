<?php

namespace App\Services\Payroll;

use App\Models\PayrollSetting;
use Carbon\CarbonInterface;

class OvertimeCalculator
{
    /**
     * Calculate approved overtime minutes.
     *
     * Existing rule:
     *
     * - OT must be enabled.
     * - Raw OT must reach the configured threshold.
     * - If it doesn't reach the threshold, OT = 0.
     */
    public function calculate(
        CarbonInterface $scheduledEnd,
        CarbonInterface $actualOut,
        PayrollSetting $settings
    ): int {
        $rawOvertime = max(
            0,
            $this->minutesBetween(
                $scheduledEnd,
                $actualOut
            )
        );

        if (
            ! (bool) $settings->overtime_enabled
        ) {
            return 0;
        }

        $threshold = max(
            0,
            (int) $settings->overtime_threshold_minutes
        );

        if ($rawOvertime < $threshold) {
            return 0;
        }

        return $rawOvertime;
    }

    private function minutesBetween(
        CarbonInterface $from,
        CarbonInterface $to
    ): int {
        return (int) round(
            $from->diffInSeconds($to) / 60
        );
    }
}