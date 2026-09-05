import { Branch } from "@/components/employees/BranchDialog";

export interface Category {
    id: number;
    name: string;
}

export interface Employee {
    id: string;
    employee_id: string;
    branch_id: string;
    category_id: number | string;
    category?: Category | null;

    full_name: string;

    employment_type: "regular" | "probationary" | "contractual";
    rate_type: "daily" | "monthly";

    basic_rate: string | number | null;
    daily_rate: string | number | null;

    sss_no: string | null;
    philhealth_no: string | null;
    pagibig_no: string | null;
    tin: string | null;

    date_hired: string;

    birthday: string | null;
    place_of_birth: string | null;
    sex: "male" | "female" | null;
    civil_status: "single" | "married" | "widow" | "separated" | null;
    nationality: string | null;
    home_address: string | null;
    contact_number: string | null;
    email_address: string | null;
    is_cola_eligible: boolean
    cola_amount: number
    created_at: string;
    branch?: Branch;
}

export type EmployeeFormData = {
    employee_id: string;
    category_id: number;
    branch_id: string;

    full_name: string;

    employment_type: Employee["employment_type"];
    rate_type: Employee["rate_type"];

    basic_rate: string | number | null;
    daily_rate: string | number | null;

    date_hired: string;

    birthday: string;
    place_of_birth: string;
    sex: "" | "male" | "female";
    civil_status: "" | "single" | "married" | "widow" | "separated";

    nationality: string;
    home_address: string;
    contact_number: string;
    email_address: string;
    is_cola_eligible: boolean
    cola_amount: number
    sss_no: string;
    philhealth_no: string;
    pagibig_no: string;
    tin: string;
};

/** Convenience alias so field components don't need to know about Inertia's setData overloads. */
export type SetFieldValue = <K extends keyof EmployeeFormData>(
    field: K,
    value: EmployeeFormData[K],
) => void;

export type FormErrors = Record<string, string | undefined>;