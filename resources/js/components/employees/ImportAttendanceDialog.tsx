import { useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
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
        throw new Error(`Invalid starting cell "${cell}". Use an Excel cell such as C3.`);
    }

    let column = 0;
    for (const character of match[1].toUpperCase()) {
        column = column * 26 + character.charCodeAt(0) - 64;
    }

    return { row: Number(match[2]) - 1, column: column - 1 };
};

const normalizeDate = (value: unknown): string => {
    if (value === null || value === undefined || String(value).trim() === '') {
        throw new Error('Date value is required.');
    }

    if (typeof value === 'number' && value > 20000) {
        const date = XLSX.SSF.parse_date_code(value);
        if (!date) throw new Error(`Invalid date "${value}".`);
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }

    const raw = String(value).trim();
    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
    if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;

    const parts = raw.split(/[./-]/).map(Number);
    if (parts.length === 3 && parts.every(Number.isFinite)) {
        if (String(parts[2]).length === 4) {
            return `${parts[2]}-${String(parts[0]).padStart(2, '0')}-${String(parts[1]).padStart(2, '0')}`;
        }
    }

    throw new Error(`Invalid date "${value}". Use YYYY-MM-DD.`);
};

const normalizeTime = (value: unknown): string | null => {
    if (value === null || value === undefined || String(value).trim() === '') return null;

    const raw = String(value).trim();
    const numeric = typeof value === 'number' ? value : Number(raw);
    if (Number.isFinite(numeric) && numeric >= 0 && numeric < 1) {
        const minutes = Math.round(numeric * 1440) % 1440;
        return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00`;
    }

    const match = /^(\d{1,2})(?::(\d{1,2}))?(?::\d{1,2})?\s*(AM|PM)?$/i.exec(raw);
    if (!match) throw new Error(`Invalid time "${value}".`);

    let hour = Number(match[1]);
    const minute = Number(match[2] ?? 0);
    const meridiem = match[3]?.toUpperCase();
    if (minute > 59) throw new Error(`Invalid minute in time "${value}".`);

    if (meridiem) {
        if (hour < 1 || hour > 12) throw new Error(`Invalid 12-hour time "${value}".`);
        if (meridiem === 'AM') hour = hour === 12 ? 0 : hour;
        else hour = hour === 12 ? 12 : hour + 12;
    } else if (hour > 23) {
        throw new Error(`Invalid 24-hour time "${value}".`);
    }

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
};

export function ImportAttendanceDialog({ open, onOpenChange, employeeId }: Props) {
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
        if (!value) reset();
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
            if (!sheet) throw new Error('The workbook does not contain a worksheet.');

            const grid = file.name.toLowerCase().endsWith('.csv')
                ? XLSX.utils.sheet_to_json<unknown[]>(
                      XLSX.read(await file.text(), { type: 'string' }).Sheets[workbook.SheetNames[0]],
                      { header: 1, raw: false, defval: '' },
                  )
                : XLSX.utils.sheet_to_json<unknown[]>(sheet, {
                      header: 1,
                      raw: false,
                      defval: '',
                  });

            const { row: startRow, column: startColumn } = parseStartingCell('C3');
            const selected = grid
                .slice(startRow)
                .map((row) => row.slice(startColumn).map((value) => String(value ?? '').trim()))
                .filter((row) => row.some(Boolean));

            if (selected.length < 2) {
                throw new Error('No importable data was found starting at C3. The starting row must contain the headers.');
            }

            const headers = selected[0].map((header) =>
                header.toLowerCase().replace(/\s+/g, '_'),
            );
            const required = ['date', 'time_in', 'time_out'];
            const missing = required.filter((header) => !headers.includes(header));
            if (missing.length) throw new Error(`Missing required columns: ${missing.join(', ')}`);

            const indexOf = (header: string) => headers.indexOf(header);
            const parsed = selected.slice(1).map((values, index) => {
                const date = normalizeDate(values[indexOf('date')]);
                const timeIn = normalizeTime(values[indexOf('time_in')]);
                const timeOut = normalizeTime(values[indexOf('time_out')]);
                const segmentValue = values[indexOf('segment')] || '1';
                const status = (values[indexOf('status')] || 'present').toLowerCase() as AttendanceStatus;
                const segment = Number(segmentValue);

                if (!Number.isInteger(segment) || segment < 1) {
                    throw new Error(`Invalid segment on row ${index + 4}.`);
                }
                if (!validStatuses.includes(status)) {
                    throw new Error(`Invalid status on row ${index + 4}.`);
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
            setError(fileError instanceof Error ? fileError.message : 'Unable to read the spreadsheet file.');
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

        router.post(`/employees/${employeeId}/attendance/import`, { rows }, {
            preserveScroll: true,
            onSuccess: () => handleOpenChange(false),
            onError: (errors) => {
                setError(Object.values(errors)[0] ?? 'Unable to import attendance.');
            },
            onFinish: () => setImporting(false),
        });
    };

    const downloadTemplate = () => {
        const worksheet = XLSX.utils.aoa_to_sheet([
            [],
            [],
            ['date', 'time_in', 'time_out', 'segment', 'status'],
            ['2026-08-30', '08:00 AM', '05:00 PM', 1, 'present'],
        ]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
        XLSX.writeFile(workbook, 'payroll_attendance_template.xlsx');
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="w-full max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Import Attendance</DialogTitle>
                    <DialogDescription>
                        Import attendance records for this employee from CSV or Excel. The configured starting cell is treated as the header row.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    <div className="rounded-lg border border-dashed p-6 text-center">
                        <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm font-medium">{fileName || 'Choose an attendance CSV or Excel file'}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Starting cell: C3</p>
                        {previewCount > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">{previewCount} records ready to import</p>
                        )}
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                            className="hidden"
                            onChange={(event) => handleFile(event.target.files?.[0])}
                        />
                        <Button type="button" variant="outline" className="mt-4" onClick={() => inputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" /> Choose file
                        </Button>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={downloadTemplate}>
                        <Download className="mr-2 h-4 w-4" /> Template
                    </Button>
                    <Button type="button" onClick={handleImport} disabled={importing || !rows.length}>
                        {importing ? 'Importing…' : 'Import Attendance'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
