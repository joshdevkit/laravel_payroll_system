export type LoanType = "sss" | "pag_ibig" | "cash_advance";

export type DeductionFrequency = "per_cutoff" | "monthly" | "one_time";

export type DeductionCutoff = "first" | "second" | "both";

export type LoanStatus = "active" | "paid" | "cancelled";

export interface Employee {
    id: string;
    employee_id: string;
    full_name: string;
}

/**
 * Minimal shape used for displaying loan deduction history.
 *
 * NOTE: assumed shape — the payroll_runs schema wasn't provided,
 * so adjust field names here to match your actual PayrollRun model.
 */
export interface PayrollRun {
    id: number;
    period_start?: string;
    period_end?: string;
    pay_date?: string;
    status?: string;
}

export interface LoanDeduction {
    id: number;
    loan_and_cash_advance_id: number;
    employee_id: string;
    payroll_run_id: number;
    payroll_item_id: number;
    amount: string | number;
    deduction_date: string;
    notes: string | null;
    payroll_run?: PayrollRun;
}

export interface LoanAndCashAdvance {
    id: number;
    employee_id: string;
    type: LoanType;
    reference_no: string | null;
    principal_amount: string | number;
    balance: string | number;
    deduction_amount: string | number;
    deduction_frequency: DeductionFrequency;
    deduction_cutoff: DeductionCutoff;
    start_date: string;
    end_date: string | null;
    status: LoanStatus;
    date: string;
    notes: string | null;
    created_at?: string;
    updated_at?: string;
    deductions?: LoanDeduction[];
}

/**
 * Form-bound representation — every numeric/date value is a string
 * since it's driven by plain <input> elements via Inertia's useForm.
 */
export interface LoanFormData {
    type: LoanType;
    reference_no: string;
    principal_amount: string;
    deduction_amount: string;
    deduction_frequency: DeductionFrequency;
    deduction_cutoff: DeductionCutoff;
    start_date: string;
    end_date: string;
    date: string;
    status: LoanStatus;
    notes: string;
}

export const emptyLoanForm: LoanFormData = {
    type: "cash_advance",
    reference_no: "",
    principal_amount: "",
    deduction_amount: "",
    deduction_frequency: "per_cutoff",
    deduction_cutoff: "second",
    start_date: "",
    end_date: "",
    date: "",
    status: "active",
    notes: "",
};