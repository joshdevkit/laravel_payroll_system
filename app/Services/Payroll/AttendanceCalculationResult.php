<?php

namespace App\Services\Payroll;

class AttendanceCalculationResult
{
    public function __construct(
        private array $details,
        private array $presentDates,
        private array $scheduledDates,
        private int $presentSegments,
        private float $presentDays,
        private int $scheduledWorkdays,
        private int $absentDays,
        private int $lateMinutes,
        private int $undertimeMinutes,
        private int $overtimeMinutes,
        private int $nightDiffMinutes,
        private float $tardyDeduction,
        private float $overtimePay,
        private float $nightDiffPay,
    ) {
    }

    public function details(): array
    {
        return $this->details;
    }

    public function presentDates(): array
    {
        return $this->presentDates;
    }

    public function scheduledDates(): array
    {
        return $this->scheduledDates;
    }

    public function presentSegments(): int
    {
        return $this->presentSegments;
    }

    public function presentDays(): float
    {
        return $this->presentDays;
    }

    public function scheduledWorkdays(): int
    {
        return $this->scheduledWorkdays;
    }

    public function absentDays(): int
    {
        return $this->absentDays;
    }

    public function lateMinutes(): int
    {
        return $this->lateMinutes;
    }

    public function undertimeMinutes(): int
    {
        return $this->undertimeMinutes;
    }

    public function overtimeMinutes(): int
    {
        return $this->overtimeMinutes;
    }

    public function nightDiffMinutes(): int
    {
        return $this->nightDiffMinutes;
    }

    public function tardyDeduction(): float
    {
        return $this->tardyDeduction;
    }

    public function overtimePay(): float
    {
        return $this->overtimePay;
    }

    public function nightDiffPay(): float
    {
        return $this->nightDiffPay;
    }
}
