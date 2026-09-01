<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SssContributionTable extends Model
{
    protected $table = 'sss_contribution_tables';

    protected $fillable = [
        'effective_from',
        'effective_to',
        'compensation_min',
        'compensation_max',
        'monthly_salary_credit',
        'employee_regular_ss',
        'employee_mpf',
        'employee_total',
        'employer_regular_ss',
        'employer_mpf',
        'employer_ec',
        'employer_total',
        'source',
    ];

    protected $casts = [
        'effective_from' => 'date:Y-m-d',
        'effective_to' => 'date:Y-m-d',
        'compensation_min' => 'decimal:2',
        'compensation_max' => 'decimal:2',
        'monthly_salary_credit' => 'decimal:2',
        'employee_regular_ss' => 'decimal:2',
        'employee_mpf' => 'decimal:2',
        'employee_total' => 'decimal:2',
        'employer_regular_ss' => 'decimal:2',
        'employer_mpf' => 'decimal:2',
        'employer_ec' => 'decimal:2',
        'employer_total' => 'decimal:2',
    ];
}
