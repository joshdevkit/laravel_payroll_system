import { CalendarDays, ChevronLeft, ChevronRight, Moon, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    addDays,
    dateFromKey,
    dateKey,
    formatDate,
    formatMonth,
    formatTime,
    isOvernightSchedule,
    monthStart,
    todayInManila,
} from './schedule-utils';
import type { Schedule, ScheduleEmployee } from './ScheduleDialog';

type Props = {
    selectedDate: string;
    schedules: Schedule[];
    employees: ScheduleEmployee[];
    onDateChange: (date: string) => void;
    onEdit: (schedule: Schedule) => void;
    onMore: (date: string) => void;
};

export function SchedulingCalendar({
    selectedDate,
    schedules,
    employees,
    onDateChange,
    onEdit,
    onMore,
}: Props) {
    const currentMonth = monthStart(selectedDate);
    const first = dateFromKey(currentMonth);
    first.setDate(first.getDate() - first.getDay());
    const visibleStart = dateKey(first);
    const calendarDays = Array.from({ length: 42 }, (_, index) =>
        addDays(visibleStart, index),
    );

    const employeeMap = new Map(
        employees.map((employee) => [employee.id, employee]),
    );

    const schedulesByDate = new Map<string, Schedule[]>();
    schedules.forEach((schedule) => {
        const items = schedulesByDate.get(schedule.work_date) ?? [];
        items.push(schedule);
        schedulesByDate.set(schedule.work_date, items);
    });

    schedulesByDate.forEach((items) =>
        items.sort(
            (a, b) =>
                a.segment_no - b.segment_no ||
                a.start_time.localeCompare(b.start_time),
        ),
    );

    const previousMonth = () => {
        const date = dateFromKey(currentMonth);
        date.setMonth(date.getMonth() - 1, 1);
        onDateChange(dateKey(date));
    };

    const nextMonth = () => {
        const date = dateFromKey(currentMonth);
        date.setMonth(date.getMonth() + 1, 1);
        onDateChange(dateKey(date));
    };

    return (
        <Card className="mt-6 overflow-hidden">
            <CardHeader className="border-b">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <CardTitle className="font-display text-lg">
                            {formatMonth(currentMonth)}
                        </CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Click a day to view its schedules. Click a schedule
                            to edit it.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDateChange(todayInManila())}
                        >
                            Today
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={previousMonth}
                            aria-label="Previous month"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={nextMonth}
                            aria-label="Next month"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <div className="hidden items-center gap-2 sm:flex">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(event) =>
                                    onDateChange(event.target.value)
                                }
                                className="w-auto"
                            />
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="overflow-x-auto p-0">
                <div className="min-w-[720px]">
                    <div className="grid grid-cols-7 border-b bg-muted/30">
                        {[
                            'Sunday',
                            'Monday',
                            'Tuesday',
                            'Wednesday',
                            'Thursday',
                            'Friday',
                            'Saturday',
                        ].map((day) => (
                            <div
                                key={day}
                                className="border-r px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground last:border-r-0 sm:px-3"
                            >
                                <span className="sm:hidden">
                                    {day.slice(0, 3)}
                                </span>
                                <span className="hidden sm:inline">{day}</span>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7">
                        {calendarDays.map((date) => {
                            const daySchedules = schedulesByDate.get(date) ?? [];
                            const selected = date === selectedDate;
                            const inMonth = date.slice(0, 7) === currentMonth.slice(0, 7);
                            const isToday = date === todayInManila();

                            return (
                                <div
                                    key={date}
                                    className={`group relative min-h-32 border-b border-r p-2 text-left transition-colors hover:bg-muted/40 sm:min-h-36 sm:p-3 ${
                                        !inMonth ? 'bg-muted/10 text-muted-foreground' : ''
                                    } ${
                                        selected
                                            ? 'bg-primary/5 ring-2 ring-inset ring-primary/50'
                                            : ''
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => onDateChange(date)}
                                        className="w-full text-left"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span
                                                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                                                    isToday
                                                        ? 'bg-primary text-primary-foreground'
                                                        : selected
                                                          ? 'bg-primary/10 text-primary'
                                                          : 'text-foreground'
                                                }`}
                                            >
                                                {dateFromKey(date).getDate()}
                                            </span>
                                            {daySchedules.length > 0 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px]"
                                                >
                                                    {daySchedules.length}
                                                </Badge>
                                            )}
                                        </div>
                                    </button>

                                    <div className="mt-2 space-y-1">
                                        {daySchedules.slice(0, 3).map((schedule) => {
                                            const employee = employeeMap.get(
                                                schedule.employee_id,
                                            );
                                            const overnight =
                                                schedule.is_working_day &&
                                                isOvernightSchedule(
                                                    schedule.start_time,
                                                    schedule.end_time,
                                                );

                                            return (
                                                <button
                                                    type="button"
                                                    key={schedule.id}
                                                    className="block w-full rounded-md border bg-background px-2 py-1.5 text-left shadow-sm hover:bg-muted/50"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        onEdit(schedule);
                                                    }}
                                                >
                                                    <div className="truncate text-[11px] font-semibold text-foreground">
                                                        {employee?.full_name ??
                                                            'Unknown employee'}
                                                    </div>
                                                    <div className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                                                        <span>
                                                            #{schedule.segment_no}
                                                        </span>
                                                        <span>·</span>
                                                        <span>
                                                            {schedule.is_working_day
                                                                ? `${formatTime(schedule.start_time)} → ${formatTime(schedule.end_time)}`
                                                                : 'Rest day'}
                                                        </span>
                                                        {overnight && (
                                                            <Moon className="h-2.5 w-2.5 shrink-0 text-primary" />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}

                                        {daySchedules.length > 3 && (
                                            <button
                                                type="button"
                                                className="flex w-full items-center gap-1 rounded px-1 text-left text-[10px] font-semibold text-primary hover:bg-primary/10 hover:underline"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onMore(date);
                                                }}
                                            >
                                                <MoreHorizontal className="h-3 w-3" />
                                                +{daySchedules.length - 3} more
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export { formatDate };
