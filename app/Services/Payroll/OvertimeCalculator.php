<?php

namespace App\Services\Payroll;

use App\Models\PayrollSetting;
use Carbon\CarbonInterface;

class OvertimeCalculator
{
    /**
     * Calculate approved overtime minutes.
     *
     * Rules:
     *
     * - OT must be enabled.
     * - Raw OT must reach the configured threshold.
     * - OT below the threshold = 0.
     * - Once the threshold is reached, OT is counted
     *   in 30-minute increments.
     *
     * Examples:
     *
     * 59 minutes  = 0
     * 60 minutes  = 60
     * 89 minutes  = 60
     * 90 minutes  = 90
     * 100 minutes = 90
     * 119 minutes = 90
     * 120 minutes = 120
     * 149 minutes = 120
     * 150 minutes = 150
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

        /*
         * OT must be enabled.
         */
        if (
            ! (bool) $settings->overtime_enabled
        ) {
            return 0;
        }

        /*
         * Minimum OT threshold.
         *
         * Example:
         * threshold = 60
         *
         * 59 minutes  -> 0
         * 60 minutes  -> continue
         */
        $threshold = max(
            0,
            (int) $settings->overtime_threshold_minutes
        );

        if ($rawOvertime < $threshold) {
            return 0;
        }

        /*
         * ==========================================================
         * ROUND OT DOWN TO 30-MINUTE BLOCKS
         * ==========================================================
         *
         * 60  -> 60
         * 89  -> 60
         * 90  -> 90
         * 119 -> 90
         * 120 -> 120
         * 149 -> 120
         * 150 -> 150
         */
        return intdiv(
            $rawOvertime,
            30
        ) * 30;
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