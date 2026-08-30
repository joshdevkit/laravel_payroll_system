import { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { AttendanceDateFilter } from '@/components/employees/AttendanceDateFilter';
import { AttendancePagination } from '@/components/employees/AttendancePagination';
import { AttendanceSummary, type AttendanceSummaryData } from '@/components/employees/AttendanceSummary';
import { EmployeeAttendanceTable, type AttendanceRecord } from '@/components/employees/EmployeeAttendanceTable';
import { DeleteAttendanceDialog } from '@/components/employees/DeleteAttendanceDialog';
import { ImportAttendanceDialog } from '@/components/employees/ImportAttendanceDialog';

const PAGE_SIZE = 10;

type Employee = { id: string; employee_id: string; full_name: string };
type AttendancePageProps = {
    employee: Employee;
    records: AttendanceRecord[];
    attendanceImportStartCell?: string;
};

export default function Attendance({ employee, records, attendanceImportStartCell = 'C3' }: AttendancePageProps) {
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [importOpen, setImportOpen] = useState(false);

    const filteredRecords = useMemo(
        () => records.filter((record) => (!fromDate || record.date >= fromDate) && (!toDate || record.date <= toDate)),
        [records, fromDate, toDate],
    );

    useEffect(() => setPage(1), [fromDate, toDate]);

    const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));

    useEffect(() => {
        if (page > pageCount) setPage(pageCount);
    }, [page, pageCount]);

    const paginatedRecords = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredRecords.slice(start, start + PAGE_SIZE);
    }, [filteredRecords, page]);

    const summary = useMemo<AttendanceSummaryData>(() => {
        const presentDates = new Set<string>();
        const absentDates = new Set<string>();
        const leaveDates = new Set<string>();
        let lateMinutes = 0;
        let undertimeMinutes = 0;
        let overtimeMinutes = 0;

        for (const record of filteredRecords) {
            if (record.status === 'present') presentDates.add(record.date);
            if (record.status === 'absent') absentDates.add(record.date);
            if (record.status === 'on_leave') leaveDates.add(record.date);
            lateMinutes += Number(record.late_minutes ?? 0);
            undertimeMinutes += Number(record.undertime_minutes ?? 0);

            if (record.status !== 'present' || !record.time_in || !record.time_out) continue;
            const start = new Date(record.time_in);
            const end = new Date(record.time_out);
            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

            let workedMinutes = (end.getTime() - start.getTime()) / 60000;
            if (workedMinutes < 0) workedMinutes += 24 * 60;
            overtimeMinutes += Math.max(0, Math.round(workedMinutes) - 8 * 60);
        }

        return {
            records: filteredRecords.length,
            present: presentDates.size,
            absent: absentDates.size,
            leave: leaveDates.size,
            lateMinutes,
            undertimeMinutes,
            overtimeMinutes,
        };
    }, [filteredRecords]);

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/employees/${employee.id}/attendance/${deleteTarget}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setDeleting(false),
        });
    };

    const clearDateFilter = () => {
        setFromDate('');
        setToDate('');
        setPage(1);
    };

    return (
        <div className="min-h-svh bg-background font-sans">
            <Navbar />
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
                <Button
                    nativeButton={false}
                    render={<a href="/employees" />}
                    variant="ghost"
                    className="-ml-3 text-muted-foreground"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Employees
                </Button>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">Attendance</p>
                        <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">{employee.full_name}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Attendance history used by payroll calculations. Multiple segments can be recorded for the same work date.
                        </p>
                    </div>
                    <Button onClick={() => setImportOpen(true)}>
                        <FileUp className="mr-2 h-4 w-4" />
                        Import Attendance
                    </Button>
                </div>

                <AttendanceSummary summary={summary} totalRecords={records.length} filtered={Boolean(fromDate || toDate)} />
                <AttendanceDateFilter
                    fromDate={fromDate}
                    toDate={toDate}
                    filteredCount={filteredRecords.length}
                    totalCount={records.length}
                    onFromDateChange={setFromDate}
                    onToDateChange={setToDate}
                    onClear={clearDateFilter}
                />

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="font-display text-base">Attendance records</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredRecords.length === 0 ? (
                            <div className="p-10 text-center">
                                <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
                                <p className="mt-2 text-sm font-medium">No attendance records found</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {fromDate || toDate
                                        ? 'No attendance records match the selected date range.'
                                        : 'No attendance has been recorded for this employee yet.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <EmployeeAttendanceTable records={paginatedRecords} onDelete={setDeleteTarget} />
                                <AttendancePagination
                                    page={page}
                                    pageCount={pageCount}
                                    pageSize={PAGE_SIZE}
                                    totalRecords={filteredRecords.length}
                                    onPageChange={setPage}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ImportAttendanceDialog
                open={importOpen}
                onOpenChange={setImportOpen}
                employeeId={employee.id}
                startingCell={attendanceImportStartCell}
            />

            <DeleteAttendanceDialog
                open={Boolean(deleteTarget)}
                deleting={deleting}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
                onConfirm={handleDelete}
            />
        </div>
    );
}
