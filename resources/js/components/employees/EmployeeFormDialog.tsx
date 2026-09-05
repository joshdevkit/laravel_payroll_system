import { FormEvent, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { Building2, CalendarDays, IdCard, UserRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Branch } from "./BranchDialog";

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
    sss_no: string;
    philhealth_no: string;
    pagibig_no: string;
    tin: string;
    date_hired: string;
};

interface EmployeeFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: Employee | null;
    category: Category[] | null;
    branches: Branch[] | null;
}

const emptyDefaults: EmployeeFormData = {
    employee_id: "",
    category_id: 0,
    branch_id: "",
    full_name: "",
    employment_type: "regular",
    rate_type: "daily",
    basic_rate: null,
    daily_rate: null,
    sss_no: "",
    philhealth_no: "",
    pagibig_no: "",
    tin: "",
    date_hired: "",
};

export function EmployeeFormDialog({
    open,
    onOpenChange,
    employee,
    category,
    branches,
}: EmployeeFormDialogProps) {
    const isEditMode = employee !== null;
    const form = useForm<EmployeeFormData>(emptyDefaults);
    /**
     * Load employee values into the form.
     *
     * We normalize values coming from Laravel because database
     * values can sometimes arrive as strings.
     */
    useEffect(() => {
        if (!open) {
            return;
        }

        if (!employee) {
            form.setData({
                ...emptyDefaults,
            });

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

        form.setData({
            employee_id: employee.employee_id ?? "",
            category_id: Number.isNaN(categoryId) ? 0 : categoryId,
            full_name: employee.full_name ?? "",
            branch_id: employee.branch_id,
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

            sss_no: employee.sss_no ?? "",
            philhealth_no: employee.philhealth_no ?? "",
            pagibig_no: employee.pagibig_no ?? "",
            tin: employee.tin ?? "",
            date_hired: employee.date_hired
                ? employee.date_hired.substring(0, 10)
                : "",
        });

        form.clearErrors();
    }, [open, employee]);

    /**
     * Rate type changed.
     *
     * Clear the irrelevant rate so we never accidentally submit
     * both daily_rate and basic_rate.
     */
    const handleRateTypeChange = (value: Employee["rate_type"]) => {
        form.setData("rate_type", value);

        if (value === "daily") {
            form.setData("basic_rate", null);

            return;
        }

        form.setData("daily_rate", null);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        /*
         * Normalize the payload before sending it to Laravel.
         */
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
        };

        form.transform(() => payload);

        if (isEditMode && employee) {
            form.put(`/employees/${employee.id}`, {
                preserveScroll: true,

                onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                    form.clearErrors();
                },
            });

            return;
        }

        form.post("/employees", {
            preserveScroll: true,

            onSuccess: () => {
                onOpenChange(false);

                form.reset();
                form.clearErrors();
            },
        });
    };

    if (!open) {
        return null;
    }

    const errors = form.errors as Record<string, string | undefined>;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-5">
                    <div className="flex items-center gap-4">
                        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <UserRound className="size-5" />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">
                                {isEditMode ? "Edit employee" : "Add employee"}
                            </h2>

                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {isEditMode
                                    ? "Update employee information and payroll details."
                                    : "Create a new employee record for payroll."}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Close"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Form */}
                <form
                    id="employee-form"
                    onSubmit={submit}
                    className="flex-1 overflow-y-auto"
                >
                    <div className="space-y-8 p-6">
                        {/* BASIC INFORMATION */}
                        <section>
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <IdCard className="size-4" />
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold">
                                        Basic Information
                                    </h3>

                                    <p className="text-xs text-muted-foreground">
                                        Employee identification and department.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-card p-5">
                                <FieldGroup>
                                    {/* Employee ID */}
                                    <div className="grid gap-5 sm:grid-cols-3">
                                        <Field
                                            data-invalid={!!errors.employee_id}
                                        >
                                            <FieldLabel htmlFor="employee-employee_id">
                                                Employee ID
                                            </FieldLabel>

                                            <Input
                                                id="employee-employee_id"
                                                placeholder="e.g. EMP-001"
                                                value={form.data.employee_id}
                                                onChange={(event) =>
                                                    form.setData(
                                                        "employee_id",
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={
                                                    !!errors.employee_id
                                                }
                                            />

                                            {errors.employee_id && (
                                                <p className="text-xs text-destructive">
                                                    {errors.employee_id}
                                                </p>
                                            )}
                                        </Field>

                                        {/* Department */}
                                        <Field
                                            data-invalid={!!errors.branch_id}
                                        >
                                            <FieldLabel htmlFor="employee-branch_id">
                                                Branch
                                            </FieldLabel>

                                            <select
                                                id="employee-branch_id"
                                                value={form.data.branch_id}
                                                onChange={(event) =>
                                                    form.setData(
                                                        "branch_id",
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={
                                                    !!errors.branch_id
                                                }
                                                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            >
                                                <option value="" disabled>
                                                    Select Branch
                                                </option>

                                                {branches?.map((item) => (
                                                    <option
                                                        key={item.id}
                                                        value={item.id}
                                                    >
                                                        {item.name}
                                                    </option>
                                                ))}
                                            </select>

                                            {errors.branch_id && (
                                                <p className="text-xs text-destructive">
                                                    {errors.branch_id}
                                                </p>
                                            )}
                                        </Field>

                                        {/* Department */}
                                        <Field
                                            data-invalid={!!errors.category_id}
                                        >
                                            <FieldLabel htmlFor="employee-category_id">
                                                Department
                                            </FieldLabel>

                                            <select
                                                id="employee-category_id"
                                                value={form.data.category_id}
                                                onChange={(event) =>
                                                    form.setData(
                                                        "category_id",
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                aria-invalid={
                                                    !!errors.category_id
                                                }
                                                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            >
                                                <option value={0} disabled>
                                                    Select department
                                                </option>

                                                {category?.map((item) => (
                                                    <option
                                                        key={item.id}
                                                        value={item.id}
                                                    >
                                                        {item.name}
                                                    </option>
                                                ))}
                                            </select>

                                            {errors.category_id && (
                                                <p className="text-xs text-destructive">
                                                    {errors.category_id}
                                                </p>
                                            )}
                                        </Field>
                                    </div>

                                    {/* Full name */}
                                    <Field data-invalid={!!errors.full_name}>
                                        <FieldLabel htmlFor="employee-full_name">
                                            Full name
                                        </FieldLabel>

                                        <Input
                                            id="employee-full_name"
                                            placeholder="Juan Dela Cruz"
                                            value={form.data.full_name}
                                            onChange={(event) =>
                                                form.setData(
                                                    "full_name",
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={!!errors.full_name}
                                        />

                                        {errors.full_name && (
                                            <p className="text-xs text-destructive">
                                                {errors.full_name}
                                            </p>
                                        )}
                                    </Field>
                                </FieldGroup>
                            </div>
                        </section>

                        {/* EMPLOYMENT */}
                        <section>
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Building2 className="size-4" />
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold">
                                        Employment & Compensation
                                    </h3>

                                    <p className="text-xs text-muted-foreground">
                                        Employment status and payroll rate.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-card p-5">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    {/* Employment Type */}
                                    <Field>
                                        <FieldLabel htmlFor="employee-employment_type">
                                            Employment type
                                        </FieldLabel>

                                        <select
                                            id="employee-employment_type"
                                            value={form.data.employment_type}
                                            onChange={(event) =>
                                                form.setData(
                                                    "employment_type",
                                                    event.target
                                                        .value as Employee["employment_type"],
                                                )
                                            }
                                            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        >
                                            <option value="regular">
                                                Regular
                                            </option>

                                            <option value="probationary">
                                                Probationary
                                            </option>

                                            <option value="contractual">
                                                Contractual
                                            </option>
                                        </select>

                                        {errors.employment_type && (
                                            <p className="text-xs text-destructive">
                                                {errors.employment_type}
                                            </p>
                                        )}
                                    </Field>

                                    {/* Rate Type */}
                                    <Field>
                                        <FieldLabel htmlFor="employee-rate_type">
                                            Rate type
                                        </FieldLabel>

                                        <select
                                            id="employee-rate_type"
                                            value={form.data.rate_type}
                                            onChange={(event) =>
                                                handleRateTypeChange(
                                                    event.target
                                                        .value as Employee["rate_type"],
                                                )
                                            }
                                            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        >
                                            <option value="daily">Daily</option>

                                            <option value="monthly">
                                                Monthly
                                            </option>
                                        </select>

                                        {errors.rate_type && (
                                            <p className="text-xs text-destructive">
                                                {errors.rate_type}
                                            </p>
                                        )}
                                    </Field>

                                    {/* Daily Rate */}
                                    {form.data.rate_type === "daily" && (
                                        <Field
                                            data-invalid={!!errors.daily_rate}
                                            className="sm:col-span-2"
                                        >
                                            <FieldLabel htmlFor="employee-daily_rate">
                                                Daily rate
                                            </FieldLabel>

                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                    ₱
                                                </span>

                                                <Input
                                                    id="employee-daily_rate"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="500.00"
                                                    className="pl-8 font-mono"
                                                    value={
                                                        form.data.daily_rate ??
                                                        ""
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            "daily_rate",
                                                            event.target.value,
                                                        )
                                                    }
                                                    aria-invalid={
                                                        !!errors.daily_rate
                                                    }
                                                />
                                            </div>

                                            <p className="text-xs text-muted-foreground">
                                                Payroll uses this amount for
                                                each payable attendance day.
                                            </p>

                                            {errors.daily_rate && (
                                                <p className="text-xs text-destructive">
                                                    {errors.daily_rate}
                                                </p>
                                            )}
                                        </Field>
                                    )}

                                    {/* Monthly Rate */}
                                    {form.data.rate_type === "monthly" && (
                                        <Field
                                            data-invalid={!!errors.basic_rate}
                                            className="sm:col-span-2"
                                        >
                                            <FieldLabel htmlFor="employee-basic_rate">
                                                Monthly basic rate
                                            </FieldLabel>

                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                    ₱
                                                </span>

                                                <Input
                                                    id="employee-basic_rate"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="15,000.00"
                                                    className="pl-8 font-mono"
                                                    value={
                                                        form.data.basic_rate ??
                                                        ""
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            "basic_rate",
                                                            event.target.value,
                                                        )
                                                    }
                                                    aria-invalid={
                                                        !!errors.basic_rate
                                                    }
                                                />
                                            </div>

                                            <p className="text-xs text-muted-foreground">
                                                Monthly basic salary used for
                                                payroll calculations.
                                            </p>

                                            {errors.basic_rate && (
                                                <p className="text-xs text-destructive">
                                                    {errors.basic_rate}
                                                </p>
                                            )}
                                        </Field>
                                    )}

                                    {/* Date hired */}
                                    <Field
                                        data-invalid={!!errors.date_hired}
                                        className="sm:col-span-2"
                                    >
                                        <FieldLabel htmlFor="employee-date_hired">
                                            Date hired
                                        </FieldLabel>

                                        <div className="relative">
                                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                            <Input
                                                id="employee-date_hired"
                                                type="date"
                                                className="pl-9"
                                                value={form.data.date_hired}
                                                onChange={(event) =>
                                                    form.setData(
                                                        "date_hired",
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={
                                                    !!errors.date_hired
                                                }
                                            />
                                        </div>

                                        {errors.date_hired && (
                                            <p className="text-xs text-destructive">
                                                {errors.date_hired}
                                            </p>
                                        )}
                                    </Field>
                                </div>
                            </div>
                        </section>

                        {/* GOVERNMENT IDS */}
                        <section>
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <IdCard className="size-4" />
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold">
                                        Government IDs
                                    </h3>

                                    <p className="text-xs text-muted-foreground">
                                        Optional government identification
                                        numbers.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-card p-5">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field>
                                        <FieldLabel htmlFor="employee-sss_no">
                                            SSS No.
                                        </FieldLabel>

                                        <Input
                                            id="employee-sss_no"
                                            placeholder="Optional"
                                            value={form.data.sss_no}
                                            onChange={(event) =>
                                                form.setData(
                                                    "sss_no",
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="employee-philhealth_no">
                                            PhilHealth No.
                                        </FieldLabel>

                                        <Input
                                            id="employee-philhealth_no"
                                            placeholder="Optional"
                                            value={form.data.philhealth_no}
                                            onChange={(event) =>
                                                form.setData(
                                                    "philhealth_no",
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="employee-pagibig_no">
                                            Pag-IBIG No.
                                        </FieldLabel>

                                        <Input
                                            id="employee-pagibig_no"
                                            placeholder="Optional"
                                            value={form.data.pagibig_no}
                                            onChange={(event) =>
                                                form.setData(
                                                    "pagibig_no",
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="employee-tin">
                                            TIN
                                        </FieldLabel>

                                        <Input
                                            id="employee-tin"
                                            placeholder="Optional"
                                            value={form.data.tin}
                                            onChange={(event) =>
                                                form.setData(
                                                    "tin",
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                </div>
                            </div>
                        </section>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-muted/20 px-6 py-4">
                    <p className="hidden text-xs text-muted-foreground sm:block">
                        {isEditMode
                            ? "Changes will be saved to this employee record."
                            : "Fields marked by validation errors must be corrected."}
                    </p>

                    <div className="ml-auto flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={form.processing}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            form="employee-form"
                            disabled={form.processing}
                        >
                            {form.processing
                                ? "Saving…"
                                : isEditMode
                                  ? "Save changes"
                                  : "Add employee"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
