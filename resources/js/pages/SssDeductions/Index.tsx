import { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";

type Employee = {
    id: string;
    employee_id: string;
    full_name: string;
    sss_no?: string | null;
};

type SssDeduction = {
    id: string;
    employee_id: string;
    amount: string | number;
    deduction_date: string;
    effective_from: string;
    effective_until?: string | null;
    is_active: boolean;
    notes?: string | null;
    employee?: Employee;
};

type SssDeductionForm = {
    employee_id: string;
    amount: string;
    deduction_date: string;
    effective_from: string;
    effective_until: string;
    is_active: boolean;
    notes: string;
};

const getToday = () => {
    return new Date().toISOString().slice(0, 10);
};

const emptyForm: SssDeductionForm = {
    employee_id: "",
    amount: "",
    deduction_date: getToday(),
    effective_from: getToday(),
    effective_until: "",
    is_active: true,
    notes: "",
};

export default function Index({
    deductions,
    employees,
}: {
    deductions: SssDeduction[];
    employees: Employee[];
}) {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<SssDeduction | null>(null);

    const [form, setForm] = useState<SssDeductionForm>(emptyForm);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) {
            return deductions;
        }

        return deductions.filter((item) =>
            [
                item.employee?.full_name,
                item.employee?.employee_id,
                item.employee?.sss_no,
                item.deduction_date,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term)),
        );
    }, [deductions, search]);

    const openCreate = () => {
        setEditing(null);

        setForm({
            ...emptyForm,
            deduction_date: getToday(),
            effective_from: getToday(),
        });

        setOpen(true);
    };

    const openEdit = (item: SssDeduction) => {
        setEditing(item);

        setForm({
            employee_id: item.employee_id,
            amount: String(item.amount),
            deduction_date: item.deduction_date,
            effective_from: item.effective_from,
            effective_until: item.effective_until ?? "",
            is_active: item.is_active,
            notes: item.notes ?? "",
        });

        setOpen(true);
    };

    const closeDialog = () => {
        setOpen(false);
        setEditing(null);
        setForm(emptyForm);
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                closeDialog();
            },
        };

        if (editing) {
            router.put(`/sss-deductions/${editing.id}`, form, options);
        } else {
            router.post("/sss-deductions", form, options);
        }
    };

    const remove = (item: SssDeduction) => {
        const employeeName = item.employee?.full_name ?? "this employee";

        if (!window.confirm(`Delete the SSS deduction for ${employeeName}?`)) {
            return;
        }

        router.delete(`/sss-deductions/${item.id}`, {
            preserveScroll: true,
        });
    };

    const formatAmount = (amount: string | number) => {
        return Number(amount).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatDate = (value?: string | null) => {
        if (!value) {
            return "—";
        }

        const date = new Date(`${value}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <>
            <AuthenticatedLayout>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                            Payroll
                        </p>

                        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
                            SSS Deductions
                        </h1>

                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            Assign an SSS deduction to a specific employee and
                            choose the exact payroll date when the deduction
                            should be applied.
                        </p>
                    </div>

                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add SSS Deduction
                    </Button>
                </div>

                <Card className="mt-6">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-base">
                                Employee deduction schedules
                            </CardTitle>

                            <p className="mt-1 text-xs text-muted-foreground">
                                SSS is deducted only when the payroll pay date
                                matches the configured deduction date.
                            </p>
                        </div>

                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search employee..."
                                className="pl-9"
                            />
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[950px] text-sm">
                                <thead className="border-y bg-muted/40 text-left">
                                    <tr>
                                        <th className="px-4 py-3">Employee</th>

                                        <th className="px-4 py-3">SSS No.</th>

                                        <th className="px-4 py-3">Amount</th>

                                        <th className="px-4 py-3">
                                            Deduction Date
                                        </th>

                                        <th className="px-4 py-3">Effective</th>

                                        <th className="px-4 py-3">Status</th>

                                        <th className="px-4 py-3 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-10 text-center text-muted-foreground"
                                            >
                                                No SSS deduction schedules
                                                found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-b last:border-0"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">
                                                        {item.employee
                                                            ?.full_name ??
                                                            "Unknown employee"}
                                                    </div>

                                                    <div className="text-xs text-muted-foreground">
                                                        ID:{" "}
                                                        {item.employee
                                                            ?.employee_id ??
                                                            item.employee_id}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    {item.employee?.sss_no ||
                                                        "—"}
                                                </td>

                                                <td className="px-4 py-3 font-medium">
                                                    ₱{formatAmount(item.amount)}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="font-medium">
                                                        {formatDate(
                                                            item.deduction_date,
                                                        )}
                                                    </div>

                                                    <div className="text-xs text-muted-foreground">
                                                        Exact payroll date
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    {formatDate(
                                                        item.effective_from,
                                                    )}

                                                    {item.effective_until
                                                        ? ` → ${formatDate(item.effective_until)}`
                                                        : " → Ongoing"}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant={
                                                            item.is_active
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                    >
                                                        {item.is_active
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </Badge>
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                openEdit(item)
                                                            }
                                                            aria-label="Edit SSS deduction"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                remove(item)
                                                            }
                                                            aria-label="Delete SSS deduction"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {open && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        role="dialog"
                        aria-modal="true"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                closeDialog();
                            }
                        }}
                    >
                        <form
                            onSubmit={submit}
                            className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-xl"
                        >
                            <div className="mb-5">
                                <h2 className="text-lg font-semibold">
                                    {editing
                                        ? "Edit SSS Deduction"
                                        : "Add SSS Deduction"}
                                </h2>

                                <p className="text-sm text-muted-foreground">
                                    Assign the SSS deduction to a specific
                                    employee and payroll date.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-medium">
                                    Employee
                                    <select
                                        required
                                        value={form.employee_id}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                employee_id: event.target.value,
                                            })
                                        }
                                        className="mt-1 flex h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    >
                                        <option value="">
                                            Select employee
                                        </option>

                                        {employees.map((employee) => (
                                            <option
                                                key={employee.id}
                                                value={employee.id}
                                            >
                                                {employee.full_name} —{" "}
                                                {employee.employee_id}
                                            </option>
                                        ))}
                                    </select>
                                    {form.employee_id && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            SSS No.:{" "}
                                            {employees.find(
                                                (employee) =>
                                                    employee.id ===
                                                    form.employee_id,
                                            )?.sss_no || "Not registered"}
                                        </p>
                                    )}
                                </label>

                                <label className="block text-sm font-medium">
                                    SSS deduction amount
                                    <Input
                                        required
                                        min="0"
                                        step="0.01"
                                        type="number"
                                        value={form.amount}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                amount: event.target.value,
                                            })
                                        }
                                        className="mt-1"
                                        placeholder="500.00"
                                    />
                                </label>

                                <label className="block text-sm font-medium">
                                    Deduction date
                                    <Input
                                        required
                                        type="date"
                                        value={form.deduction_date}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                deduction_date:
                                                    event.target.value,
                                            })
                                        }
                                        className="mt-1"
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        The SSS amount will only be deducted
                                        from a payroll whose pay date matches
                                        this date.
                                    </p>
                                </label>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <label className="block text-sm font-medium">
                                        Effective from
                                        <Input
                                            required
                                            type="date"
                                            value={form.effective_from}
                                            onChange={(event) =>
                                                setForm({
                                                    ...form,
                                                    effective_from:
                                                        event.target.value,
                                                })
                                            }
                                            className="mt-1"
                                        />
                                    </label>

                                    <label className="block text-sm font-medium">
                                        Effective until
                                        <Input
                                            type="date"
                                            value={form.effective_until}
                                            onChange={(event) =>
                                                setForm({
                                                    ...form,
                                                    effective_until:
                                                        event.target.value,
                                                })
                                            }
                                            className="mt-1"
                                        />
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Leave blank for ongoing.
                                        </p>
                                    </label>
                                </div>

                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                is_active: event.target.checked,
                                            })
                                        }
                                    />
                                    Active
                                </label>

                                <label className="block text-sm font-medium">
                                    Notes
                                    <textarea
                                        value={form.notes}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                notes: event.target.value,
                                            })
                                        }
                                        className="mt-1 min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        placeholder="Optional notes"
                                    />
                                </label>
                            </div>

                            <div className="mt-6 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeDialog}
                                >
                                    Cancel
                                </Button>

                                <Button type="submit">
                                    {editing ? "Save Changes" : "Add Deduction"}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </AuthenticatedLayout>
        </>
    );
}
