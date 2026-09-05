import { useMemo } from "react";

import {
    Banknote,
    HandCoins,
    Landmark,
    WalletCards,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import type { LoanAndCashAdvance } from "@/types/loans";

import { formatMoney } from "@/utils/loan-utils";

interface Props {
    loans: LoanAndCashAdvance[];
}

interface SummaryItem {
    label: string;
    value: string;
    icon: React.ReactNode;
}

export default function LoanSummary({ loans }: Props) {
    const summary = useMemo(() => {
        const active = loans.filter(
            (loan) => loan.status === "active",
        );

        const totalBalance = active.reduce(
            (sum, loan) => sum + Number(loan.balance ?? 0),
            0,
        );

        const totalDeductionPerCutoff = active.reduce(
            (sum, loan) => sum + Number(loan.deduction_amount ?? 0),
            0,
        );

        const sssCount = loans.filter(
            (loan) => loan.type === "sss",
        ).length;

        const pagIbigCount = loans.filter(
            (loan) => loan.type === "pag_ibig",
        ).length;

        const cashAdvanceCount = loans.filter(
            (loan) => loan.type === "cash_advance",
        ).length;

        return {
            totalBalance,
            totalDeductionPerCutoff,
            activeCount: active.length,
            sssCount,
            pagIbigCount,
            cashAdvanceCount,
        };
    }, [loans]);

    const items: SummaryItem[] = [
        {
            label: "Total Outstanding Balance",
            value: formatMoney(summary.totalBalance),
            icon: <WalletCards className="h-4 w-4" />,
        },
        {
            label: "Active Records",
            value: String(summary.activeCount),
            icon: <HandCoins className="h-4 w-4" />,
        },
        {
            label: "SSS / Pag-IBIG Loans",
            value: `${summary.sssCount} / ${summary.pagIbigCount}`,
            icon: <Landmark className="h-4 w-4" />,
        },
        {
            label: "Cash Advances",
            value: String(summary.cashAdvanceCount),
            icon: <Banknote className="h-4 w-4" />,
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
                <Card key={item.label}>
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            {item.icon}
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-xs text-muted-foreground">
                                {item.label}
                            </p>

                            <p className="truncate text-lg font-semibold">
                                {item.value}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}