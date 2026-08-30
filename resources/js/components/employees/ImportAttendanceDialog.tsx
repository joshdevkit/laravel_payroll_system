import { useRef, useState } from 'react';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { router } from '@inertiajs/react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type AttendanceStatus = 'present' | 'absent' | 'on_leave' | 'holiday';

type AttendanceImportRow = {
    date: string;
    time_in: string | null;
    time_out: string | null;
    segment_no: number;
    status: AttendanceStatus;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employeeId: string;
    startingCell: string;
};

const validStatuses: AttendanceStatus[] = [
    'present',
    'absent',
    'on_leave',
    'holiday',
];

const parseStartingCell = (cell: string) => {
    const match = /^([A-Z]+)(\d+)$/i.exec(cell.trim());

    if (!match) {
        throw new Error(
            `Invalid starting cell "${cell}". Use an Excel cell such as C3.`,
        );
    }

    let column = 0;

    for (const character of match[1].toUpperCase()) {
        column = column * 26 + character.charCodeAt(0) - 64;
    }

    return {
        row: Number(match[2]) - 1,
        column: column - 1,
    };
};

const normalizeHeader = (value: unknown) =>
    String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[\s\-./]+/g, '_')
        .replace(/_+/g, '_');

const findHeaderIndex = (
    headers: string[],
    aliases: string[],
): number => {
    const normalizedAliases = aliases.map(normalizeHeader);
    return headers.findIndex((header) => normalizedAliases.includes(header));
};

const normalizeDate = (value: unknown): string => {
    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ''
    ) {
        throw new Error('Date value is required.');
    }

    const raw = String(value).trim();
    const numeric = typeof value === 'number' ? value : Number(raw);

    if (Number.isFinite(numeric) && numeric > 20000 && numeric < 100000) {
        const date = XLSX.SSF.parse_date_code(numeric);

        if (!date) {
            throw new Error(`Invalid date "${value}".`);
        }

        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }

    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);

    if (iso) {
        return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
    }

    const parts = raw.split(/[./-]/).map(Number);

    if (
        parts.length === 3 &&
        parts.every(Number.isFinite) &&
        String(parts[2]).length === 4
    ) {
        return `${parts[2]}-${String(parts[0]).padStart(2, '0')}-${String(parts[1]).padStart(2, '0')}`;
    }

    throw new Error(`Invalid date "${value}". Use YYYY-MM-DD.`);
};

const normalizeTime = (value: unknown): string | null => {
    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ''
    ) {
        return null;
    }

    const raw = String(value).trim();
    const numeric = typeof value === 'number' ? value : Number(raw);

    if (Number.isFinite(numeric) && numeric >= 0 && numeric < 1) {
        const minutes = Math.round(numeric * 1440) % 1440;

        return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00`;
    }

    const match =
        /^(\d{1,2})(?::(\d{1,2}))?(?::\d{1,2})?\s*(AM|PM)?$/i.exec(
            raw,
        );

    if (!match) {
        throw new Error(`Invalid time "${value}".`);
    }

    let hour = Number(match[1]);
    const minute = Number(match[2] ?? 0);
    const meridiem = match[3]?.toUpperCase();

    if (minute > 59) {
        throw new Error(`Invalid minute in time "${value}".`);
    }

    if (meridiem) {
        if (hour < 1 || hour > 12) {
            throw new Error(`Invalid 12-hour time "${value}".`);
        }

        if (meridiem === 'AM') {
            hour = hour === 12 ? 0 : hour;
        } else {
            hour = hour === 12 ? 12 : hour + 12;
        }
    } else if (hour > 23) {
        throw new Error(`Invalid 24-hour time "${value}".`);
    }

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
};

export function ImportAttendanceDialog({
    open,
    onOpenChange,
    employeeId,
    startingCell,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState('');
    const [previewCount, setPreviewCount] = useState(0);
    const [rows, setRows] = useState<AttendanceImportRow[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);

    const reset = () => {
        setFileName('');
        setPreviewCount(0);
        setRows([]);
        setError(null);
        setImporting(false);
    };

    const handleOpenChange = (value: boolean) => {
        if (!value) {
            reset();
        }

        onOpenChange(value);
    };

    const handleFile = async (file?: File) => {
        if (!file) return;

        setError(null);
        setFileName(file.name);

        try {
            const workbook = XLSX.read(await file.arrayBuffer(), {
                type: 'array',
                cellDates: false,
            });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            if (!sheet) {
                throw new Error('The workbook does not contain a worksheet.');
            }

            const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
                header: 1,
                raw: false,
                defval: '',
            });

            const { row: startRow, column: startColumn } =
                parseStartingCell(startingCell);

            const selected = grid
                .slice(startRow)
                .map((row) =>
                    row
                        .slice(startColumn)
                        .map((value) => String(value ?? '').trim()),
                )
                .filter((row) => row.some(Boolean));

            if (selected.length < 2) {
                throw new Error(
                    `No importable data was found starting at ${startingCell}. The starting row must contain the headers.`,
                );
            }

            // The original template uses descriptive header names such as
            // "Work Date" rather than necessarily using the database field
            // name "date". Normalize and accept both forms.
            const headers = selected[0].map(normalizeHeader);

            const dateIndex = findHeaderIndex(headers, [
                'date',
                'work_date',
                'attendance_date',
                'date_of_attendance',
            ]);
            const timeInIndex = findHeaderIndex(headers, [
                'time_in',
                'timein',
                'clock_in',
                'clockin',
                'in_time',
                'actual_in',
                'time_in_',
            ]);
            const timeOutIndex = findHeaderIndex(headers, [
                'time_out',
                'timeout',
                'clock_out',
                'clockout',
                'out_time',
                'actual_out',
            ]);
            const segmentIndex = findHeaderIndex(headers, [
                'segment',
                'segment_no',
                'segment_number',
            ]);
            const statusIndex = findHeaderIndex(headers, [
                'status',
                'attendance_status',
            ]);

            const missing: string[] = [];

            if (dateIndex < 0) missing.push('date');
            if (timeInIndex < 0) missing.push('time_in');
            if (timeOutIndex < 0) missing.push('time_out');

            if (missing.length) {
                throw new Error(
                    `Missing required columns: ${missing.join(', ')}. Detected headers: ${selected[0].filter(Boolean).join(', ')}`,
                );
            }

            const parsed = selected.slice(1).map((values, index) => {
                const excelRow = index + startRow + 2;
                const date = normalizeDate(values[dateIndex]);
                const timeIn = normalizeTime(values[timeInIndex]);
                const timeOut = normalizeTime(values[timeOutIndex]);
                const segmentValue =
                    segmentIndex >= 0 ? values[segmentIndex] || '1' : '1';
                const statusValue =
                    statusIndex >= 0
                        ? values[statusIndex] || 'present'
                        : 'present';
                const status = statusValue.toLowerCase() as AttendanceStatus;
                const segment = Number(segmentValue);

                if (!Number.isInteger(segment) || segment < 1) {
                    throw new Error(
                        `Invalid segment on Excel row ${excelRow}.`,
                    );
                }

                if (!validStatuses.includes(status)) {
                    throw new Error(
                        `Invalid status "${statusValue}" on Excel row ${excelRow}.`,
                    );
                }

                return {
                    date,
                    time_in: timeIn,
                    time_out: timeOut,
                    segment_no: segment,
                    status,
                };
            });

            setRows(parsed);
            setPreviewCount(parsed.length);
        } catch (fileError) {
            setRows([]);
            setPreviewCount(0);
            setError(
                fileError instanceof Error
                    ? fileError.message
                    : 'Unable to read the spreadsheet file.',
            );
        }
    };

    const handleImport = () => {
        if (!employeeId) {
            setError('Employee could not be identified.');
            return;
        }

        if (!rows.length) {
            setError('Please select an attendance CSV or Excel file first.');
            return;
        }

        setImporting(true);
        setError(null);

        router.post(
            `/employees/${employeeId}/attendance/import`,
            { rows },
            {
                preserveScroll: true,
                onSuccess: () => handleOpenChange(false),
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    setError(
                        Array.isArray(firstError)
                            ? firstError[0]
                            : firstError ?? 'Unable to import attendance.',
                    );
                },
                onFinish: () => setImporting(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="w-full max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Import Attendance</DialogTitle>
                    <DialogDescription>
                        Import attendance records for this employee from CSV or
                        Excel. The configured starting cell is treated as the
                        header row.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    <div className="rounded-lg border border-dashed p-6 text-center">
                        <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm font-medium">
                            {fileName ||
                                'Choose an attendance CSV or Excel file'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Starting cell: {startingCell}
                        </p>
                        {previewCount > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                {previewCount} records ready to import
                            </p>
                        )}
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                            className="hidden"
                            onChange={(event) =>
                                handleFile(event.target.files?.[0])
                            }
                        />
                        <Button
                            type="button"
                            variant="outline"
                            className="mt-4"
                            onClick={() => inputRef.current?.click()}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Choose file
                        </Button>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        render={
                            <a
                                href="/templates/payroll_attendance_template.xlsx"
                                download="payroll_attendance_template.xlsx"
                            />
                        }
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Template
                    </Button>
                    <Button
                        type="button"
                        onClick={handleImport}
                        disabled={importing || !rows.length}
                    >
                        {importing ? 'Importing…' : 'Import Attendance'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
