<?php

namespace App\Services\Payroll;

class PayrollCalculationResult
{
    public function __construct(
        private array $item,
        private array $summary,
        private array $scheduleDetails,
    ) {}

    public function item(): array
    {
        return $this->item;
    }

    public function summary(): array
    {
        return $this->summary;
    }

    public function loanDeductions(): array
    {
        return $this->summary['loanDeductions'] ?? [];
    }

    public function scheduleDetails(): array
    {
        return $this->scheduleDetails;
    }
}
