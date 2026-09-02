export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
};

export type Auth = {
    user: User;
};



export type PayrollRun = {
    id: string
    cutoff_start: string
    cutoff_end: string
    pay_date: string | null
    status: string
}

export type ContributionTable = {
    id: number
    effective_from: string
    effective_to: string | null
    compensation_min: string | number
    compensation_max: string | number | null
    monthly_salary_credit: string | number
    employee_regular_ss: string | number
    employee_mpf: string | number
    employee_total: string | number
    employer_regular_ss: string | number
    employer_mpf: string | number
    employer_ec: string | number
    employer_total: string | number
    source: string | null
}

export type Contribution = {
    id: string
    contribution_date: string
    monthly_compensation: string | number
    monthly_salary_credit: string | number
    employee_regular_ss: string | number
    employee_mpf: string | number
    employee_total: string | number
    employer_regular_ss: string | number
    employer_mpf: string | number
    employer_ec: string | number
    employer_total: string | number
    effective_from: string
    source: string | null
    payroll_run: PayrollRun | null
    contribution_table: ContributionTable | null
}