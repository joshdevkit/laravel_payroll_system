import { FormEvent, useEffect } from "react";

import { useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import type {
    Employee,
    LoanAndCashAdvance,
    LoanFormData,
} from "@/types/loans";

import { emptyLoanForm } from "@/types/loans";

import LoanFormFields from "./LoanFormFields";

interface Props {
    open: boolean;
    employee: Employee;
    editingLoan: LoanAndCashAdvance | null;
    onClose: () => void;
}

/**
 * <input type="date"> requires exactly "YYYY-MM-DD". Laravel's `date`
 * cast serializes to a full ISO timestamp in JSON (e.g.
 * "2026-01-15T00:00:00.000000Z"), which the input silently rejects and
 * renders as empty. Truncating to the first 10 characters normalizes
 * either format to what the input expects.
 */
function toDateInputValue(value: string | null | undefined): string {
    if (!value) {
        return "";
    }

    return value.slice(0, 10);
}

function getLoanFormData(
    loan: LoanAndCashAdvance | null,
): LoanFormData {
    if (!loan) {
        return { ...emptyLoanForm };
    }

    return {
        type: loan.type,
        reference_no: loan.reference_no ?? "",
        principal_amount: String(loan.principal_amount),
        deduction_amount: String(loan.deduction_amount),
        deduction_frequency: loan.deduction_frequency,
        deduction_cutoff: loan.deduction_cutoff,
        start_date: toDateInputValue(loan.start_date),
        end_date: toDateInputValue(loan.end_date),
        date: toDateInputValue(loan.date),
        status: loan.status,
        notes: loan.notes ?? "",
    };
}

export default function LoanFormDialog({
    open,
    employee,
    editingLoan,
    onClose,
}: Props) {
    const form = useForm<LoanFormData>({ ...emptyLoanForm });

    useEffect(() => {
        if (editingLoan) {
            form.setData(getLoanFormData(editingLoan));
        } else {
            form.setData({ ...emptyLoanForm });
        }

        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingLoan, open]);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (editingLoan) {
            form.put(
                `/employees/${employee.id}/loans-and-cash-advances/${editingLoan.id}`,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        form.reset();
                        onClose();
                    },
                },
            );

            return;
        }

        form.post(
            `/employees/${employee.id}/loans-and-cash-advances`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset();
                    onClose();
                },
            },
        );
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!value && !form.processing) {
                    onClose();
                }
            }}
        >
            {/*
                Width is forced via the `style` prop rather than only
                Tailwind classes. Inline styles always win over the base
                shadcn/ui DialogContent classes regardless of how its
                internal cn()/tailwind-merge call is ordered, so this is
                the fix that holds without touching components/ui/dialog.tsx.
            */}
            <DialogContent
                className="overflow-y-auto overflow-x-hidden rounded-lg"
                style={{
                    width: "95vw",
                    maxWidth: "min(95vw, 42rem)",
                    maxHeight: "90vh",
                }}
            >
                <DialogHeader>
                    <DialogTitle>
                        {editingLoan
                            ? "Edit Loan / Cash Advance"
                            : "Add Loan / Cash Advance"}
                    </DialogTitle>

                    <DialogDescription>
                        {editingLoan
                            ? "Update the financial obligation and payroll deduction schedule."
                            : "Create a new financial obligation and payroll deduction schedule."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="min-w-0 space-y-6">
                    <LoanFormFields
                        data={form.data}
                        errors={form.errors}
                        editing={!!editingLoan}
                        balance={editingLoan?.balance}
                        setData={form.setData}
                    />

                    <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={form.processing}
                            onClick={onClose}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="w-full sm:w-auto"
                        >
                            {form.processing
                                ? "Saving..."
                                : editingLoan
                                  ? "Update Record"
                                  : "Save Record"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}