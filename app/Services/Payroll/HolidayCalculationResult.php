<?php

namespace App\Services\Payroll;

class HolidayCalculationResult
{
    public function __construct(
        private int $days,
        private float $pay,
    ) {
    }

    public function days(): int
    {
        return $this->days;
    }

    public function pay(): float
    {
        return $this->pay;
    }
}