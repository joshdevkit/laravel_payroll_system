<?php

namespace App\Services\Payroll;

use App\Models\PayrollSetting;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class NightDifferentialCalculator
{
    /**
     * Calculate NSD minutes.
     *
     * Existing behavior:
     *
     * - NSD must be enabled.
     * - Overnight attendance is supported.
     * - Scheduled NSD excludes the scheduled break.
     * - Approved overtime NSD is included.
     */
    public function calculate(
        CarbonInterface $actualIn,
        CarbonInterface $actualOut,
        CarbonInterface $scheduleStart,
        CarbonInterface $scheduleEnd,
        int $scheduledMinutes,
        int $breakMinutes,
        int $overtimeMinutes,
        PayrollSetting $settings
    ): int {
        if (
            ! (bool) $settings->night_diff_enabled
            ||
            $actualOut->lessThanOrEqualTo(
                $actualIn
            )
        ) {
            return 0;
        }

        $overtimeEnd =
            $scheduleEnd->copy()
            ->addMinutes(
                max(
                    0,
                    $overtimeMinutes
                )
            );

        $total = 0;

        $baseDay =
            $scheduleStart
            ->copy()
            ->startOfDay();

        /*
         * Search around the schedule date so
         * overnight NSD windows are detected.
         */
        for (
            $offset = -1;
            $offset <= 2;
            $offset++
        ) {
            $day =
                $baseDay
                ->copy()
                ->addDays($offset);

            $window =
                $this->nightWindow(
                    $day,
                    (string)
                    $settings->night_diff_start,
                    (string)
                    $settings->night_diff_end
                );

            $workedNight =
                $this->overlap(
                    $actualIn,
                    $actualOut,
                    $window['from'],
                    $window['to']
                );

            if ($workedNight <= 0) {
                continue;
            }

            $scheduledNight =
                $this->overlap(
                    $scheduleStart,
                    $scheduleEnd,
                    $window['from'],
                    $window['to']
                );

            $overtimeNight =
                $this->overlap(
                    $scheduleEnd,
                    $overtimeEnd,
                    $window['from'],
                    $window['to']
                );

            $scheduledEligible =
                min(
                    $scheduledNight,
                    $scheduledMinutes
                );

            $breakToRemove =
                min(
                    $breakMinutes,
                    $scheduledEligible
                );

            $paidScheduledNight =
                max(
                    0,
                    $scheduledEligible
                        - $breakToRemove
                );

            $total += min(
                $workedNight,
                $paidScheduledNight
                    + $overtimeNight
            );
        }

        return max(
            0,
            (int) round($total)
        );
    }

    private function nightWindow(
        CarbonInterface $date,
        string $start,
        string $end
    ): array {
        $day = $date->toDateString();

        $from = Carbon::parse(
            $day
                . ' '
                . substr($start, 0, 5)
        );

        $to = Carbon::parse(
            $day
                . ' '
                . substr($end, 0, 5)
        );

        if (
            $this->timeMinutes($end)
            <=
            $this->timeMinutes($start)
        ) {
            $to->addDay();
        }

        return [
            'from' => $from,
            'to' => $to,
        ];
    }

    private function timeMinutes(
        string $value
    ): int {
        [
            $hours,
            $minutes
        ] = array_map(
            'intval',
            explode(
                ':',
                substr($value, 0, 5)
            )
        );

        return ($hours * 60) + $minutes;
    }

    private function overlap(
        CarbonInterface $a,
        CarbonInterface $b,
        CarbonInterface $c,
        CarbonInterface $d
    ): int {
        $start = max(
            $a->getTimestamp(),
            $c->getTimestamp()
        );

        $end = min(
            $b->getTimestamp(),
            $d->getTimestamp()
        );

        return max(
            0,
            (int) round(
                ($end - $start) / 60
            )
        );
    }
}
