export interface PayrollSummary {
    cutoffLabel: string;
    payDate: string;
    employeeCount: number;
    grossPay: number;
    bonuses: number;
    deductions: number;
    netPay: number;
}

interface PayrollLedgerCardProps {
    summary: PayrollSummary;
}

const formatPeso = (amount: number) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);

export function PayrollLedgerCard({ summary }: PayrollLedgerCardProps) {
    return (
        <div className="relative overflow-hidden rounded-lg border bg-card">
            <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                            Current cutoff
                        </p>
                        <h2 className="mt-1 font-display text-xl font-semibold text-foreground sm:text-2xl">
                            {summary.cutoffLabel}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Pay date {summary.payDate} · {summary.employeeCount} employees
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Net payroll
                        </p>
                        <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
                            {formatPeso(summary.netPay)}
                        </p>
                    </div>
                </div>

                <div className="my-6 border-t border-dashed" />

                <div className="grid grid-cols-3 gap-4 sm:gap-8">
                    <LedgerLine label="Gross pay" value={summary.grossPay} />
                    <LedgerLine label="Bonuses" value={summary.bonuses} tone="positive" prefix="+" />
                    <LedgerLine label="Deductions" value={summary.deductions} tone="negative" prefix="−" />
                </div>
            </div>

            <div className="flex h-3 items-center justify-center gap-2 border-t border-dashed bg-muted/40">
                {Array.from({ length: 28 }).map((_, index) => (
                    <span
                        key={index}
                        className="h-1.5 w-1.5 rounded-full bg-background ring-1 ring-border"
                    />
                ))}
            </div>
        </div>
    );
}

function LedgerLine({
    label,
    value,
    tone = 'default',
    prefix = '',
}: {
    label: string;
    value: number;
    tone?: 'default' | 'positive' | 'negative';
    prefix?: string;
}) {
    const toneClass = {
        default: 'text-foreground',
        positive: 'text-emerald-600 dark:text-emerald-400',
        negative: 'text-destructive',
    }[tone];

    return (
        <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={`mt-1 font-mono text-base font-medium tabular-nums sm:text-lg ${toneClass}`}>
                {prefix}
                {formatPeso(value)}
            </p>
        </div>
    );
}
