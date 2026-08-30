import * as XLSX from 'xlsx';

export type SpreadsheetRow = string[];

function columnLettersToNumber(letters: string) {
    let result = 0;
    for (const character of letters.toUpperCase()) {
        result = result * 26 + character.charCodeAt(0) - 64;
    }
    return result - 1;
}

export function parseExcelCell(cell: string) {
    const match = /^([A-Z]+)(\d+)$/i.exec(cell.trim());
    if (!match) {
        throw new Error(
            `Invalid starting cell "${cell}". Use an Excel cell such as C3.`,
        );
    }

    const row = Number(match[2]) - 1;
    const column = columnLettersToNumber(match[1]);

    if (row < 0 || column < 0) {
        throw new Error(
            `Invalid starting cell "${cell}". Use an Excel cell such as C3.`,
        );
    }

    return { row, column };
}

function parseCsvLine(line: string) {
    const values: string[] = [];
    let value = '';
    let quoted = false;

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];

        if (character === '"') {
            if (quoted && line[index + 1] === '"') {
                value += '"';
                index += 1;
            } else {
                quoted = !quoted;
            }
        } else if (character === ',' && !quoted) {
            values.push(value.trim());
            value = '';
        } else {
            value += character;
        }
    }

    values.push(value.trim());
    return values;
}

const trimTrailingEmptyCells = (row: unknown[]) => {
    const values = row.map((value) => String(value ?? '').trim());
    while (values.length && !values[values.length - 1]) values.pop();
    return values;
};

export function normalizeSpreadsheetTime(value: unknown): string {
    if (value === null || value === undefined || String(value).trim() === '') {
        throw new Error('Time value is required.');
    }

    const raw = String(value).trim();
    const numericValue = typeof value === 'number' ? value : Number(raw);

    if (
        Number.isFinite(numericValue) &&
        numericValue >= 0 &&
        numericValue < 1 &&
        /^\d*\.?\d+$/.test(raw)
    ) {
        const totalMinutes = Math.round(numericValue * 24 * 60) % 1440;
        const hour = Math.floor(totalMinutes / 60);
        const minute = totalMinutes % 60;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }

    const text = raw.toUpperCase().replace(/\s+/g, ' ');
    const match = /^(\d{1,2})(?::(\d{1,2}))?(?::\d{1,2})?\s*(AM|PM)?$/.exec(
        text,
    );

    if (!match) {
        throw new Error(
            `Invalid time "${value}". Use a value such as 08:00 AM, 5:00 PM, or 17:00.`,
        );
    }

    let hour = Number(match[1]);
    const minute = Number(match[2] ?? 0);
    const meridiem = match[3];

    if (minute > 59) {
        throw new Error(`Invalid minute in time "${value}".`);
    }

    if (meridiem) {
        if (hour < 1 || hour > 12) {
            throw new Error(`Invalid 12-hour time "${value}".`);
        }
        if (meridiem === 'AM') hour = hour === 12 ? 0 : hour;
        else hour = hour === 12 ? 12 : hour + 12;
    } else if (hour > 23) {
        throw new Error(`Invalid 24-hour time "${value}".`);
    }

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function normalizeSpreadsheetDate(value: unknown): string {
    if (value === null || value === undefined || String(value).trim() === '') {
        throw new Error('Date value is required.');
    }

    const raw = String(value).trim();
    const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);

    if (isoMatch) {
        return toIsoDate(
            Number(isoMatch[1]),
            Number(isoMatch[2]),
            Number(isoMatch[3]),
            value,
        );
    }

    const numericValue = typeof value === 'number' ? value : Number(raw);

    if (
        Number.isFinite(numericValue) &&
        numericValue > 20000 &&
        numericValue < 100000
    ) {
        const excelEpoch = Date.UTC(1899, 11, 30);
        const date = new Date(
            excelEpoch + Math.floor(numericValue) * 86400000,
        );
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    }

    // Excel commonly formats dates as M/D/YY when the cell has a short-date
    // format. Accept that representation as well as M/D/YYYY and normalize it
    // to the YYYY-MM-DD format expected by Laravel/MySQL.
    const parts = raw.split(/[./-]/).map((part) => Number(part.trim()));

    if (parts.length === 3 && parts.every(Number.isFinite)) {
        let year: number;
        let month: number;
        let day: number;

        if (String(parts[0]).length === 4) {
            year = parts[0];
            month = parts[1];
            day = parts[2];
        } else if (String(parts[2]).length === 4) {
            year = parts[2];
            month = parts[0];
            day = parts[1];
        } else if (
            String(parts[2]).length === 1 ||
            String(parts[2]).length === 2
        ) {
            // Two-digit Excel dates such as 9/1/26 represent 2026-09-01.
            // Payroll data is expected to use modern dates, so map YY to 20YY.
            year = 2000 + parts[2];
            month = parts[0];
            day = parts[1];
        } else {
            throw new Error(`Invalid date "${value}". Use YYYY-MM-DD.`);
        }

        return toIsoDate(year, month, day, value);
    }

    throw new Error(`Invalid date "${value}". Use YYYY-MM-DD.`);
}

function toIsoDate(year: number, month: number, day: number, original: unknown) {
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() + 1 !== month ||
        date.getUTCDate() !== day
    ) {
        throw new Error(`Invalid date "${original}". Use YYYY-MM-DD.`);
    }

    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export async function readSpreadsheetRows(
    file: File,
    startingCell: string,
): Promise<SpreadsheetRow[]> {
    const { row: startRow, column: startColumn } = parseExcelCell(startingCell);
    const name = file.name.toLowerCase();
    let grid: unknown[][];

    if (name.endsWith('.csv')) {
        grid = (await file.text())
            .replace(/^\uFEFF/, '')
            .split(/\r?\n/)
            .filter((line) => line.trim())
            .map(parseCsvLine);
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const workbook = XLSX.read(await file.arrayBuffer(), {
            type: 'array',
            cellDates: false,
        });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        if (!firstSheet) {
            throw new Error('The workbook does not contain a worksheet.');
        }

        grid = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
            header: 1,
            raw: false,
            defval: '',
        });
    } else {
        throw new Error('Please upload a CSV or Excel (.xlsx/.xls) file.');
    }

    const rows = grid
        .slice(startRow)
        .map((row) => trimTrailingEmptyCells(row.slice(startColumn)))
        .filter((row) => row.some(Boolean));

    if (rows.length < 2) {
        throw new Error(
            `No importable data was found starting at ${startingCell}. The starting row must contain the headers.`,
        );
    }

    return rows;
}

export function downloadSpreadsheetTemplate({
    fileName,
    sheetName,
    startingCell,
    headers,
    sampleRows = [],
    instructions = [],
}: {
    fileName: string;
    sheetName: string;
    startingCell: string;
    headers: string[];
    sampleRows?: Array<Array<string | number>>;
    instructions?: Array<[string, string]>;
}) {
    const { row: startRow, column: startColumn } = parseExcelCell(startingCell);
    const worksheet = XLSX.utils.aoa_to_sheet([]);
    const rows = [headers, ...sampleRows];

    rows.forEach((values, rowOffset) => {
        values.forEach((value, columnOffset) => {
            const address = XLSX.utils.encode_cell({
                r: startRow + rowOffset,
                c: startColumn + columnOffset,
            });
            worksheet[address] = { t: 's', v: String(value) };
        });
    });

    worksheet['!ref'] = XLSX.utils.encode_range({
        s: { r: startRow, c: startColumn },
        e: {
            r: startRow + rows.length - 1,
            c: startColumn + headers.length - 1,
        },
    });
    worksheet['!cols'] = headers.map((header) => ({
        wch: Math.max(14, header.length + 3),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    if (instructions.length) {
        const instructionSheet = XLSX.utils.aoa_to_sheet([
            ['Field', 'Rule'],
            ...instructions,
        ]);
        instructionSheet['!cols'] = [{ wch: 24 }, { wch: 95 }];
        XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Instructions');
    }

    XLSX.writeFile(workbook, fileName);
}
