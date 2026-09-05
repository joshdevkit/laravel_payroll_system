import { useState } from "react";

import { router } from "@inertiajs/react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { Employee, LoanAndCashAdvance } from "@/types/loans";

import { getTypeLabel } from "@/utils/loan-utils";

interface Props {
    employee: Employee;
    loan: LoanAndCashAdvance | null;
    onClose: () => void;
}

export default function DeleteLoanDialog({
    employee,
    loan,
    onClose,
}: Props) {
    const [deleting, setDeleting] = useState(false);

    function confirmDelete() {
        if (!loan) {
            return;
        }

        setDeleting(true);

        router.delete(
            `/employees/${employee.id}/loans-and-cash-advances/${loan.id}`,
            {
                preserveScroll: true,
                onFinish: () => {
                    setDeleting(false);
                    onClose();
                },
            },
        );
    }

    return (
        <AlertDialog
            open={!!loan}
            onOpenChange={(value) => {
                if (!value && !deleting) {
                    onClose();
                }
            }}
        >
            <AlertDialogContent className="w-[95vw] max-w-[95vw] sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Delete{" "}
                        {loan ? getTypeLabel(loan.type) : "record"}?
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                        This will permanently remove this record and its
                        deduction history. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                    <AlertDialogCancel
                        disabled={deleting}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </AlertDialogCancel>

                    <AlertDialogAction
                        disabled={deleting}
                        onClick={confirmDelete}
                        className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
                    >
                        {deleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}