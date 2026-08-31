import { Card, CardContent } from '@/components/ui/card';

export type AttendanceSummaryData = {
    records: number;
    present: number;
    absent: number;
    leave: number;
    lateMinutes: number;
    undertimeMinutes: number;
    overtimeMinutes: number;
};

type AttendanceSummaryProps = {
    summary: AttendanceSummaryData;
    totalRecords: number;
    filtered: boolean;
};

export function AttendanceSummary({
    summary,
    totalRecords,
    filtered,
}: AttendanceSummaryProps) {
    /*
     * OT is only considered/displayed when it is MORE THAN
     * one hour.
     *
     * 60 minutes  = no OT card
     * 60.1 minutes = show OT
     * 61 minutes   = show OT
     */
    const showOvertime = summary.overtimeMinutes > 60;

    return (
        <div
            className={`mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 ${
                showOvertime
                    ? 'lg:grid-cols-6'
                    : 'lg:grid-cols-5'
            }`}
        >
            <SummaryCard
                label="Segments"
                value={summary.records}
            >
                {filtered && `of ${totalRecords} total`}
            </SummaryCard>

            <SummaryCard
                label="Present days"
                value={summary.present}
            />

            <SummaryCard
                label="Absent days"
                value={summary.absent}
            />

            <SummaryCard
                label="Late"
                value={Number(summary.lateMinutes).toFixed(1)}
                suffix="minutes"
            />

            <SummaryCard
                label="Undertime"
                value={Number(summary.undertimeMinutes).toFixed(1)}
                suffix="minutes"
            />

            {showOvertime && (
                <SummaryCard
                    label="OT"
                    value={(summary.overtimeMinutes / 60).toFixed(2)}
                    suffix="hours"
                />
            )}
        </div>
    );
}

function SummaryCard({
    label,
    value,
    suffix,
    children,
}: {
    label: string;
    value: number | string;
    suffix?: string;
    children?: React.ReactNode;
}) {
    return (
        <Card>
            <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">
                    {label}
                </p>

                <p className="mt-1 text-xl font-semibold">
                    {value}
                </p>

                {children && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        {children}
                    </p>
                )}

                {suffix && (
                    <p className="text-[11px] text-muted-foreground">
                        {suffix}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
