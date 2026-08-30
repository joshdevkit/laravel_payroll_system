import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type AttendanceDateFilterProps = {
    fromDate: string;
    toDate: string;
    filteredCount: number;
    totalCount: number;
    onFromDateChange: (value: string) => void;
    onToDateChange: (value: string) => void;
    onClear: () => void;
};

export function AttendanceDateFilter({
    fromDate,
    toDate,
    filteredCount,
    totalCount,
    onFromDateChange,
    onToDateChange,
    onClear,
}: AttendanceDateFilterProps) {
    const hasFilter = Boolean(fromDate || toDate);

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="font-display text-base text-foreground">
                    Search Attendance by Date
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <label className="grid gap-2 text-sm font-medium">
                        From date
                        <Input
                            type="date"
                            value={fromDate}
                            max={toDate || undefined}
                            onChange={(event) =>
                                onFromDateChange(event.target.value)
                            }
                        />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                        To date
                        <Input
                            type="date"
                            value={toDate}
                            min={fromDate || undefined}
                            onChange={(event) =>
                                onToDateChange(event.target.value)
                            }
                        />
                    </label>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClear}
                        disabled={!hasFilter}
                    >
                        Clear
                    </Button>
                </div>
                {hasFilter && (
                    <p className="mt-3 text-xs text-muted-foreground">
                        Showing {filteredCount} of {totalCount} attendance
                        segment{totalCount === 1 ? '' : 's'}.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
