import { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, Plus } from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
    BulkScheduleDialog,
    type BulkEmployee,
} from '@/components/scheduling/BulkScheduleDialog';
import {
    ScheduleDialog,
    type Schedule,
    type ScheduleEmployee,
} from '@/components/scheduling/ScheduleDialog';
import { SchedulingCalendar } from '@/components/scheduling/SchedulingCalendar';
import {
    addDays,
    dateFromKey,
    dateKey,
    formatDate,
    monthStart,
    todayInManila,
} from '@/components/scheduling/schedule-utils';
import { FlashMessage } from '@/components/layout/FlashMessage';

type Employee = ScheduleEmployee & {
    employee_id?: string;
};

type Props = {
    employees: Employee[];
    schedules: Schedule[];
    payrollSettings?: {
        daily_work_hours?: number | string;
        unpaid_break_minutes?: number;
        schedule_import_start_cell?: string | null;
    } | null;
};

export default function Scheduling({
    employees,
    schedules,
    payrollSettings,
}: Props) {
    const [selectedDate, setSelectedDate] = useState(todayInManila());
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [moreDialogOpen, setMoreDialogOpen] = useState(false);
    const [moreDate, setMoreDate] = useState<string | null>(null);
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

    const scheduleImportStartCell =
        payrollSettings?.schedule_import_start_cell?.trim().toUpperCase() || 'C3';

    const visibleRange = useMemo(() => {
        const currentMonth = monthStart(selectedDate);
        const first = dateFromKey(currentMonth);
        first.setDate(first.getDate() - first.getDay());
        const start = dateKey(first);

        return {
            start,
            end: addDays(start, 41),
        };
    }, [selectedDate]);

    useEffect(() => {
        router.get(
            '/scheduling',
            {
                start_date: visibleRange.start,
                end_date: visibleRange.end,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['schedules'],
            },
        );
    }, [visibleRange.start, visibleRange.end]);

    const schedulesForDate = useMemo(
        () =>
            schedules
                .filter((schedule) => schedule.work_date === moreDate)
                .sort(
                    (a, b) =>
                        a.segment_no - b.segment_no ||
                        a.start_time.localeCompare(b.start_time),
                ),
        [schedules, moreDate],
    );

    const openAdd = (date = selectedDate) => {
        setSelectedDate(date);
        setEditingSchedule(null);
        setScheduleDialogOpen(true);
    };

    const openEdit = (schedule: Schedule) => {
        setSelectedDate(schedule.work_date);
        setEditingSchedule(schedule);
        setScheduleDialogOpen(true);
    };

    const openMore = (date: string) => {
        setMoreDate(date);
        setMoreDialogOpen(true);
    };

    return (
        <>
            <FlashMessage />

            <div className="min-h-svh bg-background font-sans">
                <Navbar />

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                Workforce
                            </p>
                            <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
                                Scheduling
                            </h1>
                            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                Manage employee schedules from a monthly calendar,
                                including multiple work segments on the same date.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setBulkDialogOpen(true)}
                                disabled={!employees.length}
                            >
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Bulk schedules
                            </Button>
                            <Button
                                onClick={() => openAdd()}
                                disabled={!employees.length}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add schedule
                            </Button>
                        </div>
                    </div>

                    <SchedulingCalendar
                        selectedDate={selectedDate}
                        schedules={schedules}
                        employees={employees}
                        onDateChange={setSelectedDate}
                        onEdit={openEdit}
                        onMore={openMore}
                    />

                    <div className="mt-4 flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                        <span>
                            Showing schedules from {visibleRange.start} through{' '}
                            {visibleRange.end}.
                        </span>
                        <Link
                            href="/employees"
                            className="font-medium text-primary hover:underline"
                        >
                            Manage employees
                        </Link>
                    </div>
                </main>

                <ScheduleDialog
                    open={scheduleDialogOpen}
                    onOpenChange={(open) => {
                        setScheduleDialogOpen(open);
                        if (!open) setEditingSchedule(null);
                    }}
                    employees={employees}
                    schedule={editingSchedule}
                    defaultWorkDate={selectedDate}
                />

                <BulkScheduleDialog
                    open={bulkDialogOpen}
                    onOpenChange={setBulkDialogOpen}
                    employees={employees as BulkEmployee[]}
                    scheduleImportStartCell={scheduleImportStartCell}
                />

                <Dialog open={moreDialogOpen} onOpenChange={setMoreDialogOpen}>
                    <DialogContent className="w-[calc(100%-2rem)] max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="font-display">
                                Schedules for{' '}
                                {moreDate ? formatDate(moreDate) : 'selected date'}
                            </DialogTitle>
                            <DialogDescription>
                                {schedulesForDate.length} schedule segment
                                {schedulesForDate.length === 1 ? '' : 's'} for
                                this date.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[65vh] space-y-2 overflow-y-auto">
                            {schedulesForDate.map((schedule) => {
                                const employee = employees.find(
                                    (item) => item.id === schedule.employee_id,
                                );

                                return (
                                    <button
                                        type="button"
                                        key={schedule.id}
                                        onClick={() => {
                                            setMoreDialogOpen(false);
                                            openEdit(schedule);
                                        }}
                                        className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left hover:bg-muted/50"
                                    >
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-medium">
                                                {employee?.full_name ??
                                                    'Unknown employee'}
                                            </div>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                Segment #{schedule.segment_no} ·{' '}
                                                {schedule.is_working_day
                                                    ? `${schedule.start_time.slice(0, 5)} → ${schedule.end_time.slice(0, 5)}`
                                                    : 'Rest day'}
                                            </div>
                                        </div>
                                        <Badge variant="outline">Edit</Badge>
                                    </button>
                                );
                            })}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
