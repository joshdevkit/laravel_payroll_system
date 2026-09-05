import { WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import LoanActions from "./LoanActions";
import {
    formatMoney,
    getCutoffLabel,
    getFrequencyLabel,
    getStatusLabel,
    getStatusVariant,
    getTypeIcon,
    getTypeLabel,
} from "@/utils/loan-utils";
import { LoanAndCashAdvance } from "@/types/loans";

interface Props {
    loans: LoanAndCashAdvance[];
    onView: (loan: LoanAndCashAdvance) => void;
    onEdit: (loan: LoanAndCashAdvance) => void;
    onDelete: (loan: LoanAndCashAdvance) => void;
}

export default function LoanTable({
    loans,
    onView,
    onEdit,
    onDelete,
}: Props) {
    if (loans.length === 0) {
        return (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                <WalletCards className="mb-3 h-10 w-10 text-muted-foreground" />

                <h3 className="font-medium">No records found</h3>

                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    No loans or cash advances match the current filter.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Mobile: stacked cards, no horizontal scroll */}
            <div className="space-y-3 sm:hidden">
                {loans.map((loan) => (
                    <div
                        key={loan.id}
                        className="min-w-0 rounded-lg border p-4"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                                    {getTypeIcon(loan.type)}
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate font-medium">
                                        {getTypeLabel(loan.type)}
                                    </p>

                                    <p className="truncate text-xs text-muted-foreground">
                                        {loan.reference_no || "No reference"}
                                    </p>
                                </div>
                            </div>

                            <LoanActions
                                loan={loan}
                                onView={() => onView(loan)}
                                onEdit={() => onEdit(loan)}
                                onDelete={() => onDelete(loan)}
                            />
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Principal
                                </p>
                                <p className="font-medium">
                                    {formatMoney(loan.principal_amount)}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Balance
                                </p>
                                <p className="font-semibold">
                                    {formatMoney(loan.balance)}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Deduction
                                </p>
                                <p className="font-medium">
                                    {formatMoney(loan.deduction_amount)}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Schedule
                                </p>
                                <p className="truncate font-medium">
                                    {getFrequencyLabel(
                                        loan.deduction_frequency,
                                    )}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {getCutoffLabel(loan.deduction_cutoff)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3">
                            <Badge variant={getStatusVariant(loan.status)}>
                                {getStatusLabel(loan.status)}
                            </Badge>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop / tablet: table */}
            <div className="hidden overflow-x-auto rounded-lg border sm:block">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr className="border-b">
                            <th className="px-4 py-3 text-left font-medium">
                                Type
                            </th>
                            <th className="px-4 py-3 text-right font-medium">
                                Principal
                            </th>
                            <th className="px-4 py-3 text-right font-medium">
                                Balance
                            </th>
                            <th className="px-4 py-3 text-right font-medium">
                                Deduction
                            </th>
                            <th className="px-4 py-3 text-left font-medium">
                                Schedule
                            </th>
                            <th className="px-4 py-3 text-left font-medium">
                                Status
                            </th>
                            <th className="w-12 px-4 py-3" />
                        </tr>
                    </thead>

                    <tbody>
                        {loans.map((loan) => (
                            <tr
                                key={loan.id}
                                className="border-b last:border-0 hover:bg-muted/30"
                            >
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                                            {getTypeIcon(loan.type)}
                                        </div>

                                        <span className="font-medium">
                                            {getTypeLabel(loan.type)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-right font-medium">
                                    {formatMoney(loan.principal_amount)}
                                </td>

                                <td className="px-4 py-4 text-right font-semibold">
                                    {formatMoney(loan.balance)}
                                </td>

                                <td className="px-4 py-4 text-right">
                                    {formatMoney(loan.deduction_amount)}
                                </td>

                                <td className="px-4 py-4">
                                    <p className="font-medium">
                                        {getFrequencyLabel(
                                            loan.deduction_frequency,
                                        )}
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        {getCutoffLabel(
                                            loan.deduction_cutoff,
                                        )}
                                    </p>
                                </td>

                                <td className="px-4 py-4">
                                    <Badge
                                        variant={getStatusVariant(
                                            loan.status,
                                        )}
                                    >
                                        {getStatusLabel(loan.status)}
                                    </Badge>
                                </td>

                                <td className="px-4 py-4 text-right">
                                    <LoanActions
                                        loan={loan}
                                        onView={() => onView(loan)}
                                        onEdit={() => onEdit(loan)}
                                        onDelete={() => onDelete(loan)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}