<?php

namespace App\Services\Payroll;

class DeductionCalculationResult
{
    public function __construct(
        private float $tardy,
        private float $sss,
        private float $philhealth,
        private float $pagibig,
        private float $tax,
        private float $leave,
        private float $other,
        private float $total,
        private ?array $sssContribution = null,
    ) {
    }

    public function tardy(): float
    {
        return $this->tardy;
    }

    public function sss(): float
    {
        return $this->sss;
    }

    public function philhealth(): float
    {
        return $this->philhealth;
    }

    public function pagibig(): float
    {
        return $this->pagibig;
    }

    public function tax(): float
    {
        return $this->tax;
    }

    public function leave(): float
    {
        return $this->leave;
    }

    public function other(): float
    {
        return $this->other;
    }

    public function total(): float
    {
        return $this->total;
    }

    public function sssContribution(): ?array
    {
        return $this->sssContribution;
    }
}
