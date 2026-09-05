import { History } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import type { Employee, LoanAndCashAdvance } from "@/types/loans";

import { formatMoney, getTypeLabel } from "@/utils/loan-utils";

interface Props {
    employee: Employee;
    loan: LoanAndCashAdvance | null;
    onClose: () => void;
}

export default function LoanHistoryDialog({ loan, onClose }: Props) {
    const deductions = loan?.deductions ?? [];

    return (
        <Dialog
            open={!!loan}
            onOpenChange={(value) => {
                if (!value) {
                    onClose();
                }
            }}
        >
            <DialogContent
                className="overflow-y-auto overflow-x-hidden rounded-lg"
                style={{
                    width: "95vw",
                    maxWidth: "min(95vw, 36rem)",
                    maxHeight: "85vh",
                }}
            >
                <DialogHeader>
                    <DialogTitle>Deduction History</DialogTitle>

                    <DialogDescription>
                        {loan
                            ? `Posted payroll deductions for this ${getTypeLabel(loan.type).toLowerCase()}.`
                            : "Posted payroll deductions for this record."}
                    </DialogDescription>
                </DialogHeader>

                {deductions.length === 0 ? (
                    <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                        <History className="mb-2 h-8 w-8 text-muted-foreground" />

                        <p className="text-sm text-muted-foreground">
                            No deductions have been posted yet.
                        </p>
                    </div>
                ) : (
                    <div className="min-w-0 space-y-2">
                        {deductions.map((deduction) => (
                            <div
                                key={deduction.id}
                                className="flex min-w-0 items-center justify-between gap-3 rounded-lg border p-3"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium">
                                        {deduction.deduction_date}
                                    </p>

                                    {deduction.payroll_run && (
                                        <p className="truncate text-xs text-muted-foreground">
                                            {deduction.payroll_run.period_start &&
                                            deduction.payroll_run.period_end
                                                ? `Payroll run: ${deduction.payroll_run.period_start} – ${deduction.payroll_run.period_end}`
                                                : `Payroll run #${deduction.payroll_run.id}`}
                                        </p>
                                    )}

                                    {deduction.notes && (
                                        <p className="truncate text-xs text-muted-foreground">
                                            {deduction.notes}
                                        </p>
                                    )}
                                </div>

                                <p className="shrink-0 font-semibold">
                                    {formatMoney(deduction.amount)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}