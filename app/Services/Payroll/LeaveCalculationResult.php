<?php

namespace App\Services\Payroll;

class LeaveCalculationResult
{
    public function __construct(
        private int $paidDays,
        private int $unpaidDays,
        private float $pay,
    ) {
    }

    public function paidDays(): int
    {
        return $this->paidDays;
    }

    public function unpaidDays(): int
    {
        return $this->unpaidDays;
    }

    public function totalDays(): int
    {
        return $this->paidDays
            + $this->unpaidDays;
    }

    public function pay(): float
    {
        return $this->pay;
    }
}