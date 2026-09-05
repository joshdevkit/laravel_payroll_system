import { CalendarDays } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type {
    DeductionCutoff,
    DeductionFrequency,
    LoanFormData,
    LoanStatus,
    LoanType,
} from "@/types/loans";

interface Props {
    data: LoanFormData;
    errors: Partial<Record<keyof LoanFormData, string>>;
    editing: boolean;
    balance?: string | number;

    setData: <K extends keyof LoanFormData>(
        key: K,
        value: LoanFormData[K],
    ) => void;
}

interface FieldProps {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}

function Field({
    label,
    required = false,
    error,
    children,
}: FieldProps) {
    return (
        <div className="grid w-full min-w-0 gap-2">
            <label className="text-sm font-medium">
                {label}

                {required && (
                    <span className="ml-1 text-destructive">*</span>
                )}
            </label>

            {children}

            {error && (
                <p className="text-xs text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}

function getLoanTypeLabel(type: LoanType): string {
    switch (type) {
        case "sss":
            return "SSS Loan";

        case "pag_ibig":
            return "Pag-IBIG Loan";

        case "cash_advance":
            return "Cash Advance";

        default:
            return type;
    }
}

function getFrequencyLabel(
    frequency: DeductionFrequency,
): string {
    switch (frequency) {
        case "per_cutoff":
            return "Every Cutoff";

        case "monthly":
            return "Monthly";

        case "one_time":
            return "One Time";

        default:
            return frequency;
    }
}

function getCutoffLabel(
    cutoff: DeductionCutoff,
): string {
    switch (cutoff) {
        case "first":
            return "First Cutoff";

        case "second":
            return "Second Cutoff";

        case "both":
            return "Both Cutoffs";

        default:
            return cutoff;
    }
}

function getStatusLabel(status: LoanStatus): string {
    switch (status) {
        case "active":
            return "Active";

        case "paid":
            return "Paid";

        case "cancelled":
            return "Cancelled";

        default:
            return status;
    }
}

export default function LoanFormFields({
    data,
    errors,
    editing,
    balance,
    setData,
}: Props) {
    return (
        <>
            {/* Basic Information */}
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                    label="Type"
                    required
                    error={errors.type}
                >
                    <Select
                        value={data.type}
                        onValueChange={(value) =>
                            setData(
                                "type",
                                value as LoanType,
                            )
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue>
                                {getLoanTypeLabel(data.type)}
                            </SelectValue>
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="sss">
                                SSS Loan
                            </SelectItem>

                            <SelectItem value="pag_ibig">
                                Pag-IBIG Loan
                            </SelectItem>

                            <SelectItem value="cash_advance">
                                Cash Advance
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </Field>

                {/* <Field
                    label="Reference No."
                    error={errors.reference_no}
                >
                    <Input
                        value={data.reference_no}
                        onChange={(event) =>
                            setData(
                                "reference_no",
                                event.target.value,
                            )
                        }
                        placeholder="e.g. CA-2026-001"
                    />
                </Field> */}

                <Field
                    label="Loan Date"
                    required
                    error={errors.date}
                >
                    <Input
                        type="date"
                        className="w-full min-w-0"
                        value={data.date}
                        onChange={(event) =>
                            setData(
                                "date",
                                event.target.value,
                            )
                        }
                    />
                </Field>

                <Field
                    label="Principal Amount"
                    required
                    error={errors.principal_amount}
                >
                    <Input
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        step="0.01"
                        className="w-full min-w-0"
                        value={data.principal_amount}
                        onChange={(event) =>
                            setData(
                                "principal_amount",
                                event.target.value,
                            )
                        }
                        placeholder="0.00"
                    />
                </Field>

                <Field
                    label="Deduction Amount"
                    required
                    error={errors.deduction_amount}
                >
                    <Input
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        step="0.01"
                        className="w-full min-w-0"
                        value={data.deduction_amount}
                        onChange={(event) =>
                            setData(
                                "deduction_amount",
                                event.target.value,
                            )
                        }
                        placeholder="0.00"
                    />
                </Field>
            </div>

            {/* Payroll Deduction */}
            <div className="min-w-0 rounded-lg border bg-muted/30 p-3 sm:p-4">
                <div className="mb-4 flex items-start gap-2 sm:items-center">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:mt-0" />

                    <div className="min-w-0">
                        <h3 className="text-sm font-medium">
                            Payroll Deduction
                        </h3>

                        <p className="text-xs text-muted-foreground">
                            Configure when payroll should
                            deduct this obligation.
                        </p>
                    </div>
                </div>

                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Frequency */}
                    <Field
                        label="Frequency"
                        required
                        error={errors.deduction_frequency}
                    >
                        <Select
                            value={data.deduction_frequency}
                            onValueChange={(value) =>
                                setData(
                                    "deduction_frequency",
                                    value as DeductionFrequency,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue>
                                    {getFrequencyLabel(
                                        data.deduction_frequency,
                                    )}
                                </SelectValue>
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="per_cutoff">
                                    Every Cutoff
                                </SelectItem>

                                <SelectItem value="monthly">
                                    Monthly
                                </SelectItem>

                                <SelectItem value="one_time">
                                    One Time
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>

                    {/* Deduct On */}
                    <Field
                        label="Deduct On"
                        required
                        error={errors.deduction_cutoff}
                    >
                        <Select
                            value={data.deduction_cutoff}
                            onValueChange={(value) =>
                                setData(
                                    "deduction_cutoff",
                                    value as DeductionCutoff,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue>
                                    {getCutoffLabel(
                                        data.deduction_cutoff,
                                    )}
                                </SelectValue>
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="first">
                                    First Cutoff
                                </SelectItem>

                                <SelectItem value="second">
                                    Second Cutoff
                                </SelectItem>

                                <SelectItem value="both">
                                    Both Cutoffs
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>

                    {/* Start Date */}
                    <Field
                        label="Start Date"
                        required
                        error={errors.start_date}
                    >
                        <Input
                            type="date"
                            className="w-full min-w-0"
                            value={data.start_date}
                            onChange={(event) =>
                                setData(
                                    "start_date",
                                    event.target.value,
                                )
                            }
                        />
                    </Field>

                    {/* End Date */}
                    <Field
                        label="End Date"
                        error={errors.end_date}
                    >
                        <Input
                            type="date"
                            className="w-full min-w-0"
                            value={data.end_date}
                            onChange={(event) =>
                                setData(
                                    "end_date",
                                    event.target.value,
                                )
                            }
                        />
                    </Field>
                </div>
            </div>

            {/* Loan Date / Status */}
            <div className="w-full min-w-0">
                {editing && (
                    <Field
                        label="Status"
                        required
                        error={errors.status}
                    >
                        <Select
                            value={data.status}
                            onValueChange={(value) =>
                                setData(
                                    "status",
                                    value as LoanStatus,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue>
                                    {getStatusLabel(data.status)}
                                </SelectValue>
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="active">
                                    Active
                                </SelectItem>

                                <SelectItem value="paid">
                                    Paid
                                </SelectItem>

                                <SelectItem value="cancelled">
                                    Cancelled
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                )}
            </div>

            {/* Balance */}
            {editing && (
                <div className="min-w-0 rounded-lg border p-3 sm:p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                            <p className="text-sm font-medium">
                                Current Balance
                            </p>

                            <p className="text-xs text-muted-foreground">
                                Updated by posted payroll
                                deductions.
                            </p>
                        </div>

                        <p className="break-words text-lg font-semibold">
                            ₱
                            {Number(
                                balance ?? 0,
                            ).toLocaleString(
                                "en-PH",
                                {
                                    minimumFractionDigits: 2,
                                },
                            )}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}