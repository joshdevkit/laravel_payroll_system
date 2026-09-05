import { Branch } from "../employees/BranchDialog";

export type PayrollScheduleDetail = {
    id: string;
    work_date: string;
    segment_no: number;
    scheduled_start: string;
    scheduled_end: string;
    actual_in: string | null;
    actual_out: string | null;
    scheduled_minutes: number;
    break_minutes: number;
    worked_minutes: number;
    late_minutes: number;
    undertime_minutes: number;
    overtime_minutes: number;
    night_diff_minutes: number;
    is_present: boolean;
    overtime_pay: string | number;
    night_diff_pay: string | number;
    calculation_notes?: string | null;
};

export type PayrollEmployee = {
    id: string;
    employee_id: string;
    category: Category;
    full_name: string;
    rate_type: string;
    daily_rate?: string | number | null;
    basic_rate?: string | number | null;
    sss_deduction_cutoff?: 'first' | 'second' | null;
};

export type PayrollItem = {
    id: string;
    employee_id: string;
    employee: PayrollEmployee;
    scheduled_workdays: string | number;
    present_days: string | number;
    absent_days: string | number;
    leave_days?: string | number;
    paid_leave_days?: string | number;
    unpaid_leave_days?: string | number;
    holiday_days?: string | number;
    late_minutes: number;
    undertime_minutes: number;
    overtime_minutes: number;
    night_diff_minutes: number;
    basic_pay: string | number;
    overtime_pay: string | number;
    holiday_pay?: string | number;
    night_diff: string | number;
    leave_pay?: string | number;
    bonus?: string | number;
    sss_deduction?: string | number;
    philhealth_deduction?: string | number;
    pagibig_deduction?: string | number;
    tax_deduction?: string | number;
    leave_deduction?: string | number;
    other_deductions?: string | number;
    total_earnings: string | number;
    total_deductions: string | number;
    net_pay: string | number;
    tardy_deduction: string | number;
    schedule_details: PayrollScheduleDetail[];
    totalEarnings: string | number;
    cash_advance_deduction: string | number;
    sss_loan_deduction: string | number;
    pagibig_loan_deduction: string | number;
    cola: number
};

export type PayrollRun = {
    id: string;
    cutoff_start: string;
    cutoff_end: string;
    pay_date: string;
    status: 'draft' | 'processing' | 'completed' | 'cancelled' | string;
    items: PayrollItem[];
    branch: Branch;
    department: Category
};


export type Category = {
    id: number | string;
    name: string;
}

export const money = (value: string | number | null | undefined) =>
    `₱${Number(value ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const minutes = (value: number | string | null | undefined) =>
    `${Number(value ?? 0)}m`;
