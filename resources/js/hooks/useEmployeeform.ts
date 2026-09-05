import { FormEvent, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { Employee, EmployeeFormData, FormErrors } from "@/types/employee";

export const emptyDefaults: EmployeeFormData = {
    employee_id: "",
    category_id: 0,
    branch_id: "",

    full_name: "",

    employment_type: "regular",
    rate_type: "daily",

    basic_rate: null,
    daily_rate: null,

    date_hired: "",

    birthday: "",
    place_of_birth: "",
    sex: "",
    civil_status: "",

    nationality: "",
    home_address: "",
    contact_number: "",
    email_address: "",

    is_cola_eligible: false,
    cola_amount: 0.00,
    sss_no: "",
    philhealth_no: "",
    pagibig_no: "",
    tin: "",
};

interface UseEmployeeFormArgs {
    open: boolean;
    employee: Employee | null;
    /** Called after a successful create/update so the dialog can close. */
    onSuccess: () => void;
}

/**
 * Owns the Inertia form state for the employee dialog: loading an
 * existing employee into the form, the rate-type toggle, and submit.
 */
export function useEmployeeForm({
    open,
    employee,
    onSuccess,
}: UseEmployeeFormArgs) {
    const isEditMode = employee !== null;

    const form = useForm<EmployeeFormData>(emptyDefaults);

    /**
     * Load employee data when editing, or reset to blank when adding.
     */
    useEffect(() => {
        if (!open) {
            return;
        }

        if (!employee) {
            form.setData({ ...emptyDefaults });
            form.clearErrors();
            return;
        }

        const employmentType: Employee["employment_type"] =
            employee.employment_type === "probationary"
                ? "probationary"
                : employee.employment_type === "contractual"
                  ? "contractual"
                  : "regular";

        const rateType: Employee["rate_type"] =
            employee.rate_type === "monthly" ? "monthly" : "daily";

        const categoryId = Number(employee.category_id);

        const sex: EmployeeFormData["sex"] =
            employee.sex === "male" || employee.sex === "female"
                ? employee.sex
                : "";

        const civilStatus: EmployeeFormData["civil_status"] =
            employee.civil_status === "single" ||
            employee.civil_status === "married" ||
            employee.civil_status === "widow" ||
            employee.civil_status === "separated"
                ? employee.civil_status
                : "";

        form.setData({
            employee_id: employee.employee_id ?? "",
            category_id: Number.isNaN(categoryId) ? 0 : categoryId,
            branch_id: employee.branch_id ?? "",
            full_name: employee.full_name ?? "",
            employment_type: employmentType,
            rate_type: rateType,

            /*
             * Only load the rate relevant to the selected rate type.
             */
            basic_rate:
                rateType === "monthly" ? (employee.basic_rate ?? null) : null,

            daily_rate:
                rateType === "daily"
                    ? (employee.daily_rate ?? employee.basic_rate ?? null)
                    : null,

            date_hired: employee.date_hired
                ? employee.date_hired.substring(0, 10)
                : "",

            birthday: employee.birthday
                ? employee.birthday.substring(0, 10)
                : "",

            place_of_birth: employee.place_of_birth ?? "",
            sex,
            civil_status: civilStatus,
            nationality: employee.nationality ?? "",
            home_address: employee.home_address ?? "",
            contact_number: employee.contact_number ?? "",
            email_address: employee.email_address ?? "",
            is_cola_eligible: employee.is_cola_eligible ?? false,
            cola_amount: employee.cola_amount ?? 0.0,
            sss_no: employee.sss_no ?? "",
            philhealth_no: employee.philhealth_no ?? "",
            pagibig_no: employee.pagibig_no ?? "",
            tin: employee.tin ?? "",
        });

        form.clearErrors();
        // form is intentionally omitted: useForm returns a new reference each
        // render and including it would re-run this effect in a loop.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, employee]);

    /**
     * Rate type changed.
     *
     * Clear the irrelevant rate so we never accidentally
     * submit both daily_rate and basic_rate.
     */
    const handleRateTypeChange = (value: Employee["rate_type"]) => {
        form.setData("rate_type", value);

        if (value === "daily") {
            form.setData("basic_rate", null);
            return;
        }

        form.setData("daily_rate", null);
    };

    /**
     * Submit employee form (create or update depending on isEditMode).
     */
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const payload: EmployeeFormData = {
            ...form.data,
            category_id: Number(form.data.category_id),

            basic_rate:
                form.data.rate_type === "monthly"
                    ? form.data.basic_rate || null
                    : null,

            daily_rate:
                form.data.rate_type === "daily"
                    ? form.data.daily_rate || null
                    : null,

            birthday: form.data.birthday || "",
            place_of_birth: form.data.place_of_birth || "",
            sex: form.data.sex || "",
            civil_status: form.data.civil_status || "",
            nationality: form.data.nationality || "",
            home_address: form.data.home_address || "",
            contact_number: form.data.contact_number || "",
            email_address: form.data.email_address || "",
            is_cola_eligible: form.data.is_cola_eligible || false,
            cola_amount: form.data.cola_amount || 0.0
        };

        form.transform(() => payload);

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                onSuccess();
                form.reset();
                form.clearErrors();
            },
        };

        if (isEditMode && employee) {
            form.put(`/employees/${employee.id}`, options);
            return;
        }

        form.post("/employees", options);
    };

    return {
        form,
        isEditMode,
        handleRateTypeChange,
        submit,
        errors: form.errors as FormErrors,
    };
}