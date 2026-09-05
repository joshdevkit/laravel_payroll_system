import { CalendarDays, IdCard } from "lucide-react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import {
    Employee,
    EmployeeFormData,
    FormErrors,
    SetFieldValue,
} from "@/types/employee";
import { Branch } from "./BranchDialog";
import { Category } from "../payroll-run/types";

interface EmploymentPayrollSectionProps {
    data: EmployeeFormData;
    errors: FormErrors;
    setData: SetFieldValue;
    onRateTypeChange: (value: Employee["rate_type"]) => void;
    category: Category[] | null;
    branches: Branch[] | null;
}

export function EmploymentPayrollSection({
    data,
    errors,
    setData,
    onRateTypeChange,
    category,
    branches,
}: EmploymentPayrollSectionProps) {
    return (
        <section>
            <div className="mb-2 flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <IdCard className="size-3.5" />
                </div>

                <div>
                    <h3 className="text-sm font-semibold">
                        Employment & Payroll
                    </h3>

                    <p className="text-[11px] text-muted-foreground">
                        Branch, department, employment and compensation.
                    </p>
                </div>
            </div>

            <div className="rounded-xl border bg-card p-4">
                <div className="grid gap-x-4 gap-y-3 sm:grid-cols-3">
                    {/* Branch */}
                    <Field data-invalid={!!errors.branch_id}>
                        <FieldLabel
                            htmlFor="employee-branch_id"
                            className="text-xs"
                        >
                            Branch
                        </FieldLabel>

                        <select
                            id="employee-branch_id"
                            value={data.branch_id}
                            onChange={(event) =>
                                setData("branch_id", event.target.value)
                            }
                            aria-invalid={!!errors.branch_id}
                            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="" disabled>
                                Select branch
                            </option>

                            {branches?.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>

                        {errors.branch_id && (
                            <p className="text-[11px] text-destructive">
                                {errors.branch_id}
                            </p>
                        )}
                    </Field>

                    {/* Department */}
                    <Field data-invalid={!!errors.category_id}>
                        <FieldLabel
                            htmlFor="employee-category_id"
                            className="text-xs"
                        >
                            Department
                        </FieldLabel>

                        <select
                            id="employee-category_id"
                            value={data.category_id}
                            onChange={(event) =>
                                setData(
                                    "category_id",
                                    Number(event.target.value),
                                )
                            }
                            aria-invalid={!!errors.category_id}
                            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value={0} disabled>
                                Select department
                            </option>

                            {category?.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>

                        {errors.category_id && (
                            <p className="text-[11px] text-destructive">
                                {errors.category_id}
                            </p>
                        )}
                    </Field>

                    {/* Date Hired */}
                    <Field data-invalid={!!errors.date_hired}>
                        <FieldLabel
                            htmlFor="employee-date_hired"
                            className="text-xs"
                        >
                            Date Hired
                        </FieldLabel>

                        <div className="relative">
                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                id="employee-date_hired"
                                type="date"
                                value={data.date_hired}
                                onChange={(event) =>
                                    setData("date_hired", event.target.value)
                                }
                                aria-invalid={!!errors.date_hired}
                                className="h-9 pl-9"
                            />
                        </div>

                        {errors.date_hired && (
                            <p className="text-[11px] text-destructive">
                                {errors.date_hired}
                            </p>
                        )}
                    </Field>

                    {/* Employment Type */}
                    <Field data-invalid={!!errors.employment_type}>
                        <FieldLabel
                            htmlFor="employee-employment_type"
                            className="text-xs"
                        >
                            Employment Type
                        </FieldLabel>

                        <select
                            id="employee-employment_type"
                            value={data.employment_type}
                            onChange={(event) =>
                                setData(
                                    "employment_type",
                                    event.target
                                        .value as Employee["employment_type"],
                                )
                            }
                            aria-invalid={!!errors.employment_type}
                            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="regular">Regular</option>
                            <option value="probationary">Probationary</option>
                            <option value="contractual">Contractual</option>
                        </select>

                        {errors.employment_type && (
                            <p className="text-[11px] text-destructive">
                                {errors.employment_type}
                            </p>
                        )}
                    </Field>

                    {/* Rate Type */}
                    <Field data-invalid={!!errors.rate_type}>
                        <FieldLabel
                            htmlFor="employee-rate_type"
                            className="text-xs"
                        >
                            Rate Type
                        </FieldLabel>

                        <select
                            id="employee-rate_type"
                            value={data.rate_type}
                            onChange={(event) =>
                                onRateTypeChange(
                                    event.target
                                        .value as Employee["rate_type"],
                                )
                            }
                            aria-invalid={!!errors.rate_type}
                            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="daily">Daily</option>
                            <option value="monthly">Monthly</option>
                        </select>

                        {errors.rate_type && (
                            <p className="text-[11px] text-destructive">
                                {errors.rate_type}
                            </p>
                        )}
                    </Field>

                    {/* Rate */}
                    {data.rate_type === "daily" ? (
                        <Field data-invalid={!!errors.daily_rate}>
                            <FieldLabel
                                htmlFor="employee-daily_rate"
                                className="text-xs"
                            >
                                Daily Rate
                            </FieldLabel>

                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                    ₱
                                </span>

                                <Input
                                    id="employee-daily_rate"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="500.00"
                                    className="h-9 pl-7 font-mono"
                                    value={data.daily_rate ?? ""}
                                    onChange={(event) =>
                                        setData(
                                            "daily_rate",
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={!!errors.daily_rate}
                                />
                            </div>

                            {errors.daily_rate && (
                                <p className="text-[11px] text-destructive">
                                    {errors.daily_rate}
                                </p>
                            )}
                        </Field>
                    ) : (
                        <Field data-invalid={!!errors.basic_rate}>
                            <FieldLabel
                                htmlFor="employee-basic_rate"
                                className="text-xs"
                            >
                                Monthly Basic Rate
                            </FieldLabel>

                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                    ₱
                                </span>

                                <Input
                                    id="employee-basic_rate"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="15,000.00"
                                    className="h-9 pl-7 font-mono"
                                    value={data.basic_rate ?? ""}
                                    onChange={(event) =>
                                        setData(
                                            "basic_rate",
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={!!errors.basic_rate}
                                />
                            </div>

                            {errors.basic_rate && (
                                <p className="text-[11px] text-destructive">
                                    {errors.basic_rate}
                                </p>
                            )}
                        </Field>
                    )}

                    {/* COLA Eligible */}
                    <Field data-invalid={!!errors.is_cola_eligible}>
                        <FieldLabel className="text-xs">
                            COLA
                        </FieldLabel>

                        <label
                            htmlFor="employee-is_cola_eligible"
                            className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm cursor-pointer"
                        >
                            <Checkbox
                                id="employee-is_cola_eligible"
                                checked={data.is_cola_eligible}
                                onCheckedChange={(checked) =>
                                    setData(
                                        "is_cola_eligible",
                                        checked === true,
                                    )
                                }
                                aria-invalid={!!errors.is_cola_eligible}
                            />
                            COLA Eligible
                        </label>

                        {errors.is_cola_eligible && (
                            <p className="text-[11px] text-destructive">
                                {errors.is_cola_eligible}
                            </p>
                        )}
                    </Field>

                    {/* COLA Amount — only shown when eligible */}
                    {data.is_cola_eligible && (
                        <Field data-invalid={!!errors.cola_amount}>
                            <FieldLabel
                                htmlFor="employee-cola_amount"
                                className="text-xs"
                            >
                                COLA Amount
                            </FieldLabel>

                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                    ₱
                                </span>

                                <Input
                                    id="employee-cola_amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="h-9 pl-7 font-mono"
                                    value={data.cola_amount ?? ""}
                                    onChange={(event) =>
                                        setData(
                                            "cola_amount",
                                            Number(event.target.value),
                                        )
                                    }
                                    aria-invalid={!!errors.cola_amount}
                                />
                            </div>

                            {errors.cola_amount && (
                                <p className="text-[11px] text-destructive">
                                    {errors.cola_amount}
                                </p>
                            )}
                        </Field>
                    )}
                </div>
            </div>
        </section>
    );
}