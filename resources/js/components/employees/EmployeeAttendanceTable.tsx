import { Clock3, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export type AttendanceStatus = 'present' | 'absent' | 'on_leave' | 'holiday';

export type AttendanceRecord = {
    id: string;
    employee_id: string;
    date: string;
    time_in: string | null;
    time_out: string | null;
    late_minutes: number;
    undertime_minutes: number;
    status: AttendanceStatus;
    segment_no: number;
};

type EmployeeAttendanceTableProps = {
    records: AttendanceRecord[];
    onDelete: (id: string) => void;
};

const statusLabel: Record<AttendanceStatus, string> = {
    present: 'Present',
    absent: 'Absent',
    on_leave: 'On leave',
    holiday: 'Holiday',
};

const statusVariant: Record<AttendanceStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    present: 'default',
    absent: 'destructive',
    on_leave: 'secondary',
    holiday: 'outline',
};

const formatDate = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

const formatTime = (value: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
    });
};

const calculateWorkedMinutes = (timeIn: string | null, timeOut: string | null) => {
    if (!timeIn || !timeOut) return 0;
    const start = new Date(timeIn);
    const end = new Date(timeOut);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

    let minutes = (end.getTime() - start.getTime()) / 60000;
    if (minutes < 0) minutes += 24 * 60;
    return Math.max(0, Math.round(minutes));
};

const formatDuration = (minutes: number) => {
    if (minutes <= 0) return '—';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
};

export function getAttendanceOvertimeMinutes(record: AttendanceRecord) {
    if (record.status !== 'present') return 0;
    return Math.max(0, calculateWorkedMinutes(record.time_in, record.time_out) - 8 * 60);
}

export function EmployeeAttendanceTable({ records, onDelete }: EmployeeAttendanceTableProps) {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Segment</TableHead>
                        <TableHead>Time in</TableHead>
                        <TableHead>Time out</TableHead>
                        <TableHead>Worked</TableHead>
                        <TableHead>OT</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Late</TableHead>
                        <TableHead>Undertime</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.map((record) => {
                        const workedMinutes = calculateWorkedMinutes(record.time_in, record.time_out);
                        const overtimeMinutes = getAttendanceOvertimeMinutes(record);
                        const showOvertime = overtimeMinutes > 60;

                        return (
                            <TableRow key={record.id}>
                                <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                                <TableCell><Badge variant="outline">Segment {record.segment_no}</Badge></TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                                        <Clock3 className="h-3.5 w-3.5" />
                                        {formatTime(record.time_in)}
                                    </span>
                                </TableCell>
                                <TableCell>{formatTime(record.time_out)}</TableCell>
                                <TableCell className="font-mono tabular-nums">{formatDuration(workedMinutes)}</TableCell>
                                <TableCell>
                                    {showOvertime ? <Badge variant="secondary">{formatDuration(overtimeMinutes)}</Badge> : '—'}
                                </TableCell>
                                <TableCell><Badge variant={statusVariant[record.status]}>{statusLabel[record.status]}</Badge></TableCell>
                                <TableCell>{record.late_minutes} min</TableCell>
                                <TableCell>{record.undertime_minutes} min</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => onDelete(record.id)}
                                        aria-label={`Delete attendance for ${record.date}, segment ${record.segment_no}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
