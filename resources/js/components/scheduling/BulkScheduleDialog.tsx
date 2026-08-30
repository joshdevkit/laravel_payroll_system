import { useMemo, useState, type FormEvent } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export type BulkEmployee = {
    id: string;
    full_name: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employees: BulkEmployee[];
};

const days = [
    ['Sunday', 0],
    ['Monday', 1],
    ['Tuesday', 2],
    ['Wednesday', 3],
    ['Thursday', 4],
    ['Friday', 5],
    ['Saturday', 6],
] as const;

export function BulkScheduleDialog({
    open,
    onOpenChange,
    employees,
}: Props) {
    const [employeeIds, setEmployeeIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('17:00');
    const [breakMinutes, setBreakMinutes] = useState('60');
    const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
    const [submitting, setSubmitting] = useState(false);

    const employeeCount = employeeIds.length;

    const dates = useMemo(() => {
        if (!startDate || !endDate || startDate > endDate) return [];

        const result: string[] = [];
        const current = new Date(`${startDate}T00:00:00`);
        const end = new Date(`${endDate}T00:00:00`);

        while (current <= end) {
            if (selectedDays.includes(current.getDay())) {
                result.push(
                    current.toLocaleDateString('en-CA', {
                        timeZone: 'Asia/Manila',
                    }),
                );
            }
            current.setDate(current.getDate() + 1);
        }

        return result;
    }, [startDate, endDate, selectedDays]);

    const toggleEmployee = (id: string) => {
        setEmployeeIds((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id],
        );
    };

    const toggleDay = (day: number) => {
        setSelectedDays((current) =>
            current.includes(day)
                ? current.filter((item) => item !== day)
                : [...current, day].sort(),
        );
    };

    const reset = () => {
        setEmployeeIds([]);
        setStartDate('');
        setEndDate('');
        setStartTime('08:00');
        setEndTime('17:00');
        setBreakMinutes('60');
        setSelectedDays([1, 2, 3, 4, 5]);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!employeeIds.length || !dates.length) return;

        setSubmitting(true);

        const schedules = employeeIds.flatMap((employeeId) =>
            dates.map((workDate) => ({
                employee_id: employeeId,
                work_date: workDate,
                start_time: startTime,
                end_time: endTime,
                break_minutes: Number(breakMinutes) || 0,
                is_working_day: true,
                notes: null,
            })),
        );

        router.post(
            route('schedules.bulk-store'),
            { schedules },
            {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onOpenChange(false);
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100%-2rem)] max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-display">
                        Bulk schedules
                    </DialogTitle>
                    <DialogDescription>
                        Create the same shift for multiple employees across a
                        date range and selected working days.
                    </DialogDescription>
                </DialogHeader>

                <form id="bulk-schedule-form" onSubmit={handleSubmit}>
                    <FieldGroup>
                        <Field>
                            <FieldLabel>Employees</FieldLabel>
                            <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border p-2">
                                {employees.map((employee) => (
                                    <label
                                        key={employee.id}
                                        className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={employeeIds.includes(employee.id)}
                                            onChange={() => toggleEmployee(employee.id)}
                                            className="h-4 w-4 rounded border-input accent-primary"
                                        />
                                        {employee.full_name}
                                    </label>
                                ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {employeeCount} employee{employeeCount === 1 ? '' : 's'} selected
                            </span>
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel htmlFor="bulk-start-date">
                                    Start date
                                </FieldLabel>
                                <Input
                                    id="bulk-start-date"
                                    type="date"
                                    value={startDate}
                                    onChange={(event) =>
                                        setStartDate(event.target.value)
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="bulk-end-date">
                                    End date
                                </FieldLabel>
                                <Input
                                    id="bulk-end-date"
                                    type="date"
                                    value={endDate}
                                    onChange={(event) =>
                                        setEndDate(event.target.value)
                                    }
                                />
                            </Field>
                        </div>

                        <Field>
                            <FieldLabel>Working days</FieldLabel>
                            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                                {days.map(([label, value]) => (
                                    <label
                                        key={label}
                                        className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedDays.includes(value)}
                                            onChange={() => toggleDay(value)}
                                            className="h-4 w-4 rounded border-input accent-primary"
                                        />
                                        {label.slice(0, 3)}
                                    </label>
                                ))}
                            </div>
                        </Field>

                        <div className="grid grid-cols-3 gap-4">
                            <Field>
                                <FieldLabel htmlFor="bulk-start-time">
                                    Start
                                </FieldLabel>
                                <Input
                                    id="bulk-start-time"
                                    type="time"
                                    value={startTime}
                                    onChange={(event) =>
                                        setStartTime(event.target.value)
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="bulk-end-time">
                                    End
                                </FieldLabel>
                                <Input
                                    id="bulk-end-time"
                                    type="time"
                                    value={endTime}
                                    onChange={(event) =>
                                        setEndTime(event.target.value)
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="bulk-break">
                                    Break
                                </FieldLabel>
                                <Input
                                    id="bulk-break"
                                    type="number"
                                    min="0"
                                    value={breakMinutes}
                                    onChange={(event) =>
                                        setBreakMinutes(event.target.value)
                                    }
                                />
                            </Field>
                        </div>

                        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2 font-medium text-foreground">
                                <FileSpreadsheet className="h-4 w-4 text-primary" />
                                {dates.length * employeeCount} schedule record{dates.length * employeeCount === 1 ? '' : 's'} will be created or updated.
                            </div>
                        </div>
                    </FieldGroup>
                </form>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="bulk-schedule-form"
                        disabled={submitting || !employeeIds.length || !dates.length}
                    >
                        {submitting ? 'Saving…' : 'Save schedules'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
