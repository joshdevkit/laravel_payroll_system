import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Download } from 'lucide-react';
import { router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    normalizeSpreadsheetDate,
    normalizeSpreadsheetTime,
    readSpreadsheetRows,
    type SpreadsheetRow,
} from '@/utils/spreadsheet';

export type BulkEmployee = {
    id: string;
    employee_id?: string;
    full_name: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employees: BulkEmployee[];
    scheduleImportStartCell?: string;
};

type ParsedRow = {
    employeeId: string;
    workDate: string;
    segmentNo: number;
    startTime: string;
    endTime: string;
};

function normalizeHeader(value: string) {
    return value.trim().toLowerCase().replace(/[\s_-]+/g, '_');
}

function parseRows(rows: SpreadsheetRow[]) {
    if (rows.length < 2) {
        throw new Error(
            'The file must contain a header and at least one schedule row.',
        );
    }

    const headers = rows[0].map(normalizeHeader);
    const indexes = {
        employeeId: headers.findIndex((header) =>
            ['emp_id', 'employee_id', 'employee'].includes(header),
        ),
        workDate: headers.findIndex((header) =>
            ['date', 'work_date', 'schedule_date'].includes(header),
        ),
        segmentNo: headers.findIndex((header) =>
            ['segment', 'segment_no', 'segment_number'].includes(header),
        ),
        startTime: headers.findIndex((header) =>
            ['start_time', 'start', 'time_in'].includes(header),
        ),
        endTime: headers.findIndex((header) =>
            ['end_time', 'end', 'time_out'].includes(header),
        ),
    };

    if (
        indexes.employeeId < 0 ||
        indexes.workDate < 0 ||
        indexes.segmentNo < 0 ||
        indexes.startTime < 0 ||
        indexes.endTime < 0
    ) {
        throw new Error(
            'Required columns are EMP ID, DATE, SEGMENT, START TIME, and END TIME.',
        );
    }

    return rows.slice(1).map((values, rowIndex): ParsedRow => {
        const employeeId = values[indexes.employeeId]?.trim() ?? '';
        const workDateValue = values[indexes.workDate]?.trim() ?? '';
        const segmentValue = values[indexes.segmentNo]?.trim() ?? '';
        const startTimeValue = values[indexes.startTime]?.trim() ?? '';
        const endTimeValue = values[indexes.endTime]?.trim() ?? '';
        const segmentNo = Number(segmentValue);

        if (!employeeId || !workDateValue || !startTimeValue || !endTimeValue) {
            throw new Error(
                `Row ${rowIndex + 2} is missing EMP ID, DATE, START TIME, or END TIME.`,
            );
        }

        if (!Number.isInteger(segmentNo) || segmentNo < 1) {
            throw new Error(
                `Row ${rowIndex + 2} has an invalid SEGMENT. Use a positive whole number.`,
            );
        }

        try {
            return {
                employeeId,
                workDate: normalizeSpreadsheetDate(workDateValue),
                segmentNo,
                startTime: normalizeSpreadsheetTime(startTimeValue),
                endTime: normalizeSpreadsheetTime(endTimeValue),
            };
        } catch (error) {
            throw new Error(
                `Row ${rowIndex + 2}: ${error instanceof Error ? error.message : 'Invalid date or time value.'}`,
            );
        }
    });
}

export function BulkScheduleDialog({
    open,
    onOpenChange,
    employees,
    scheduleImportStartCell = 'C3',
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileRows, setFileRows] = useState<ParsedRow[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const employeeMap = useMemo(
        () =>
            new Map(
                employees.map((employee) => [
                    (employee.employee_id ?? '').trim().toLowerCase(),
                    employee,
                ]),
            ),
        [employees],
    );

    const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError(null);
        setFileName(file.name);

        try {
            setFileRows(
                parseRows(
                    await readSpreadsheetRows(file, scheduleImportStartCell),
                ),
            );
        } catch (fileError) {
            setFileRows([]);
            setError(
                fileError instanceof Error
                    ? fileError.message
                    : 'Unable to read the spreadsheet file.',
            );
        }
    };

    const buildFileRows = () =>
        fileRows.map((row) => {
            const employee = employeeMap.get(
                row.employeeId.trim().toLowerCase(),
            );

            if (!employee) {
                throw new Error(
                    `Employee ID "${row.employeeId}" was not found.`,
                );
            }

            return {
                employee_id: employee.employee_id,
                work_date: row.workDate,
                start_time: row.startTime,
                end_time: row.endTime,
                is_working_day: true,
                segment_no: row.segmentNo,
                break_minutes: null,
                notes: null,
            };
        });

    const handleSubmit = () => {
        setError(null);

        if (fileRows.length === 0) {
            setError('Upload a schedule CSV or Excel file first.');
            return;
        }

        setSubmitting(true);

        try {
            const schedules = buildFileRows();

            router.post(
                '/scheduling/bulk',
                { schedules },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setFileRows([]);
                        setFileName(null);
                        if (inputRef.current) inputRef.current.value = '';
                        onOpenChange(false);
                    },
                    onError: (errors) => {
                        const firstError = Object.values(errors)[0];
                        setError(
                            typeof firstError === 'string'
                                ? firstError
                                : 'Unable to import schedules.',
                        );
                    },
                    onFinish: () => setSubmitting(false),
                },
            );
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Unable to import schedules.',
            );
            setSubmitting(false);
        }
    };

    const reset = () => {
        setFileRows([]);
        setFileName(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen && !submitting) reset();
                onOpenChange(nextOpen);
            }}
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-display">
                        Bulk add schedules
                    </DialogTitle>
                    <DialogDescription>
                        Upload a CSV or Excel file. The import starts from the
                        configured cell in Settings. Use EMP ID to identify the
                        employee.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    <div className="rounded-lg border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-medium">
                                    Schedule file
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Starting cell:{' '}
                                    <span className="font-medium text-foreground">
                                        {scheduleImportStartCell}
                                    </span>
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                render={
                                    <a
                                        href="/templates/payroll_schedule_template.xlsx"
                                        download="payroll_schedule_template.xlsx"
                                    />
                                }
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Excel template
                            </Button>
                        </div>

                        <div className="mt-4">
                            <Input
                                ref={inputRef}
                                type="file"
                                accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                onChange={handleFile}
                            />
                        </div>

                        {fileName && (
                            <div className="mt-3 flex items-center gap-2 text-xs">
                                <Badge variant="secondary">
                                    {fileRows.length} rows
                                </Badge>
                                <span className="truncate text-muted-foreground">
                                    {fileName}
                                </span>
                            </div>
                        )}

                        <div className="mt-4 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                            <p className="font-medium text-foreground">
                                Required Excel columns
                            </p>
                            <p className="mt-1">
                                EMP ID, DATE, SEGMENT, START TIME, END TIME
                            </p>
                            <p className="mt-2">
                                BREAK MINUTE, WORKING DAY, and TIMESTAMP are
                                generated automatically and must not be entered
                                in the template.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </div>

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
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || employees.length === 0}
                    >
                        {submitting
                            ? 'Importing…'
                            : fileRows.length > 0
                              ? `Import ${fileRows.length} schedules`
                              : 'Import schedules'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
