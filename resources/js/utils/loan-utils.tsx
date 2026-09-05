import {
    Banknote,
    HandCoins,
    Landmark,
} from "lucide-react";

import type {
    DeductionCutoff,
    DeductionFrequency,
    LoanStatus,
    LoanType,
} from "@/types/loans";

export function formatMoney(
    amount: string | number | null | undefined,
): string {
    const value = Number(amount ?? 0);

    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
    }).format(value);
}

export function getTypeLabel(type: LoanType): string {
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

/**
 * NOTE: icon choice per type is a visual pick, not something
 * specified anywhere — swap freely.
 */
export function getTypeIcon(type: LoanType) {
    switch (type) {
        case "sss":
            return <Landmark className="h-4 w-4" />;

        case "pag_ibig":
            return <Landmark className="h-4 w-4" />;

        case "cash_advance":
            return <Banknote className="h-4 w-4" />;

        default:
            return <HandCoins className="h-4 w-4" />;
    }
}

export function getFrequencyLabel(
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

export function getCutoffLabel(cutoff: DeductionCutoff): string {
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

export function getStatusLabel(status: LoanStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getStatusVariant(
    status: LoanStatus,
): "default" | "secondary" | "outline" | "destructive" {
    switch (status) {
        case "active":
            return "default";

        case "paid":
            return "secondary";

        case "cancelled":
            return "outline";

        default:
            return "outline";
    }
}