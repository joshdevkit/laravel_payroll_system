import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Clock3, Moon, Trash2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    formatScheduleDuration,
    isOvernightSchedule,
    resolveScheduleDuration,
    todayInManila,
} from './schedule-utils';

export type Schedule = {
    id: string;
    employee_id: string;
    work_date: string;
    segment_no: number;
    start_time: string;
    end_time: string;
    break_minutes: number;
    is_working_day: boolean;
    notes: string | null;
};

export type ScheduleEmployee = {
    id: string;
    full_name: string;
};

export type ScheduleInput = {
    employee_id: string;
    work_date: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    is_working_day: boolean;
    notes: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employees: ScheduleEmployee[];
    schedule: Schedule | null;
    defaultEmployeeId?: string;
    defaultWorkDate?: string;
};

export function ScheduleDialog({
    open,
    onOpenChange,
    employees,
    schedule,
    defaultEmployeeId,
    defaultWorkDate,
}: Props) {
    const isEditMode = Boolean(schedule);
    const [employeeId, setEmployeeId] = useState(defaultEmployeeId ?? '');
    const [workDate, setWorkDate] = useState(defaultWorkDate ?? todayInManila());
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('17:00');
    const [breakMinutes, setBreakMinutes] = useState('60');
    const [isWorkingDay, setIsWorkingDay] = useState(true);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedEmployee = useMemo(
        () => employees.find((employee) => employee.id === employeeId),
        [employees, employeeId],
    );

    const duration = useMemo(
        () =>
            isWorkingDay
                ? resolveScheduleDuration(
                      startTime,
                      endTime,
                      Number(breakMinutes) || 0,
                  )
                : 0,
        [isWorkingDay, startTime, endTime, breakMinutes],
    );

    const grossDuration = useMemo(
        () =>
            isWorkingDay
                ? resolveScheduleDuration(startTime, endTime)
                : 0,
        [isWorkingDay, startTime, endTime],
    );

    const overnight =
        isWorkingDay && isOvernightSchedule(startTime, endTime);

    useEffect(() => {
        if (!open) return;

        setError(null);
        setSubmitting(false);

        if (schedule) {
            setEmployeeId(schedule.employee_id);
            setWorkDate(schedule.work_date);
            setStartTime(schedule.start_time.slice(0, 5));
            setEndTime(schedule.end_time.slice(0, 5));
            setBreakMinutes(String(schedule.break_minutes ?? 0));
            setIsWorkingDay(schedule.is_working_day);
            setNotes(schedule.notes ?? '');
            return;
        }

        setEmployeeId(defaultEmployeeId ?? '');
        setWorkDate(defaultWorkDate ?? todayInManila());
        setStartTime('08:00');
        setEndTime('17:00');
        setBreakMinutes('60');
        setIsWorkingDay(true);
        setNotes('');
    }, [open, schedule, defaultEmployeeId, defaultWorkDate]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!employeeId) {
            setError('Please select an employee.');
            return;
        }

        if (!workDate) {
            setError('Please select a work date.');
            return;
        }

        if (
            isWorkingDay &&
            (!startTime || !endTime || startTime === endTime)
        ) {
            setError('Working days must have different start and end times.');
            return;
        }

        if (Number(breakMinutes) < 0) {
            setError('Break minutes cannot be negative.');
            return;
        }

        if (
            isWorkingDay &&
            Number(breakMinutes) >= grossDuration
        ) {
            setError('Break time must be shorter than the scheduled shift.');
            return;
        }

        setSubmitting(true);

        const data: ScheduleInput = {
            employee_id: employeeId,
            work_date: workDate,
            start_time: isWorkingDay ? startTime : '00:00',
            end_time: isWorkingDay ? endTime : '00:00',
            break_minutes: isWorkingDay ? Number(breakMinutes) || 0 : 0,
            is_working_day: isWorkingDay,
            notes,
        };

        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
            onError: (errors: Record<string, string>) => {
                setError(Object.values(errors)[0] ?? 'Unable to save schedule.');
            },
            onFinish: () => setSubmitting(false),
        };

        if (schedule) {
            router.put('/scheduling/' + schedule.id, data, options);
        } else {
            router.post('/scheduling', data, options);
        }
    };

    const handleDelete = () => {
        if (!schedule || submitting) return;

        setSubmitting(true);
        router.delete('/scheduling/' + schedule.id, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-display">
                        {isEditMode ? 'Edit schedule' : 'Add schedule'}
                    </DialogTitle>
                    <DialogDescription>
                        Define the exact shift, break, and work date. Payroll
                        uses this record as the source of truth for scheduled
                        work.
                    </DialogDescription>
                </DialogHeader>

                <form id="schedule-form" onSubmit={handleSubmit}>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="schedule-employee">
                                Employee
                            </FieldLabel>
                            <select
                                id="schedule-employee"
                                value={employeeId}
                                onChange={(event) =>
                                    setEmployeeId(event.target.value)
                                }
                                disabled={isEditMode}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Select an employee</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.full_name}
                                    </option>
                                ))}
                            </select>
                            {selectedEmployee && (
                                <span className="text-xs text-muted-foreground">
                                    {selectedEmployee.full_name}
                                </span>
                            )}
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="schedule-work-date">
                                Work date
                            </FieldLabel>
                            <Input
                                id="schedule-work-date"
                                type="date"
                                value={workDate}
                                onChange={(event) =>
                                    setWorkDate(event.target.value)
                                }
                            />
                        </Field>

                        <label className="flex items-center gap-3 rounded-lg border p-3">
                            <input
                                type="checkbox"
                                checked={isWorkingDay}
                                onChange={(event) =>
                                    setIsWorkingDay(event.target.checked)
                                }
                                className="h-4 w-4 rounded border-input accent-primary"
                            />
                            <span>
                                <span className="block text-sm font-medium">
                                    Working day
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                    Uncheck for a scheduled rest day.
                                </span>
                            </span>
                        </label>

                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel htmlFor="schedule-start">
                                    Start time
                                </FieldLabel>
                                <Input
                                    id="schedule-start"
                                    type="time"
                                    value={startTime}
                                    disabled={!isWorkingDay}
                                    onChange={(event) =>
                                        setStartTime(event.target.value)
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="schedule-end">
                                    End time
                                </FieldLabel>
                                <Input
                                    id="schedule-end"
                                    type="time"
                                    value={endTime}
                                    disabled={!isWorkingDay}
                                    onChange={(event) =>
                                        setEndTime(event.target.value)
                                    }
                                />
                            </Field>
                        </div>

                        <Field>
                            <FieldLabel htmlFor="schedule-break">
                                Unpaid break (minutes)
                            </FieldLabel>
                            <Input
                                id="schedule-break"
                                type="number"
                                min="0"
                                step="1"
                                value={breakMinutes}
                                disabled={!isWorkingDay}
                                onChange={(event) =>
                                    setBreakMinutes(event.target.value)
                                }
                            />
                        </Field>

                        {isWorkingDay && duration > 0 && (
                            <div className="rounded-lg border bg-muted/30 p-4">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Clock3 className="h-4 w-4 text-primary" />
                                    Payable scheduled duration:{' '}
                                    {formatScheduleDuration(duration)}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Gross shift:{' '}
                                    {formatScheduleDuration(grossDuration)} ·
                                    Break: {breakMinutes || 0}m
                                </p>
                                {overnight && (
                                    <p className="mt-2 flex items-center gap-1 text-xs text-primary">
                                        <Moon className="h-3.5 w-3.5" />
                                        Overnight shift — end time falls on the
                                        following calendar day.
                                    </p>
                                )}
                            </div>
                        )}

                        <Field>
                            <FieldLabel htmlFor="schedule-notes">
                                Notes (optional)
                            </FieldLabel>
                            <Input
                                id="schedule-notes"
                                value={notes}
                                onChange={(event) =>
                                    setNotes(event.target.value)
                                }
                                placeholder="e.g. GY shift, rest-day coverage"
                            />
                        </Field>

                        {error && <FieldError>{error}</FieldError>}
                    </FieldGroup>
                </form>

                <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <div>
                        {isEditMode && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={submitting}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete schedule
                            </Button>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
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
                            form="schedule-form"
                            disabled={submitting}
                        >
                            {submitting
                                ? 'Saving…'
                                : isEditMode
                                  ? 'Save changes'
                                  : 'Add schedule'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
