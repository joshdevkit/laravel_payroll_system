import XLSX from 'xlsx-js-style';
import type { PayrollItem, PayrollRun } from '@/components/payroll-run/types';
import { num, totalDeductions, totalEarnings } from '@/components/payroll-run/payrollRunUtils';

const AMBER_HEADER = 'FBBF24';
const AMBER_FOOTER = 'FDE68A';
const AMBER_ROW = 'FFFBEB';
const BLACK = '000000';

const thinBorder = {
    top: { style: 'thin', color: { rgb: '999999' } },
    bottom: { style: 'thin', color: { rgb: '999999' } },
    left: { style: 'thin', color: { rgb: '999999' } },
    right: { style: 'thin', color: { rgb: '999999' } },
};

const headerStyle = {
    font: { bold: true, color: { rgb: BLACK }, sz: 9 },
    fill: { fgColor: { rgb: AMBER_HEADER } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: thinBorder,
};

const footerStyle = {
    font: { bold: true, color: { rgb: BLACK }, sz: 10 },
    fill: { fgColor: { rgb: AMBER_FOOTER } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
};

const cellStyle = (
    shaded: boolean,
    options: { bold?: boolean; left?: boolean } = {},
) => ({
    font: { bold: Boolean(options.bold), sz: 10 },
    fill: shaded ? { fgColor: { rgb: AMBER_ROW } } : undefined,
    alignment: {
        horizontal: options.left ? 'left' : 'center',
        vertical: 'center',
    },
    border: thinBorder,
});

const dash = (value: string | number | null | undefined) =>
    Number(value ?? 0) ? num(value) : '-';

const HEADER_ROW_1 = [
    'No.',
    'ID No.',
    'Employee Name',
    'Department',
    'Earnings',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Deductions',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Total Net Earnings',
    'Signature',
];

const HEADER_ROW_2 = [
    '',
    '',
    '',
    '',
    'No. of Days',
    'Rate',
    'Basic Salary',
    'COLA',
    'Tardy',
    'Total Earnings',
    'Overtime Pay',
    'Holiday Pay',
    'Night Shift Pay',
    'Total Gross Earning',
    'Contribution',
    '',
    '',
    'Loans',
    '',
    'Cash Advance',
    'Others',
    'Total Deductions',
    '',
    '',
];

const HEADER_ROW_3 = [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'PhilHealth',
    'Pag-IBIG',
    'SSS',
    'SSS',
    'Pag-IBIG',
    '',
    '',
    '',
    '',
    '',
];

const COLUMN_COUNT = HEADER_ROW_1.length;

export function exportPayrollRunToExcel(
    run: PayrollRun,
    items: PayrollItem[],
) {
    const rows: unknown[][] = [HEADER_ROW_1, HEADER_ROW_2, HEADER_ROW_3];

    items.forEach((item, index) => {
        const rate =
            item.employee?.rate_type === 'daily'
                ? Number(
                      item.employee.daily_rate ?? item.employee.basic_rate ?? 0,
                  )
                : Number(item.employee?.basic_rate ?? 0) / 26;

        const others =
            Number(item.other_deductions ?? 0) +
            Number(item.tax_deduction ?? 0) +
            Number(item.leave_deduction ?? 0);

        rows.push([
            index + 1,
            item.employee?.employee_id ?? item.employee_id,
            item.employee?.full_name ?? '',
            '-',
            Number(item.present_days ?? 0),
            rate ? `₱${num(rate)}` : '-',
            num(item.basic_pay),
            '-',
            '-',
            num(item.basic_pay),
            dash(item.overtime_pay),
            dash(item.holiday_pay),
            dash(item.night_diff),
            num(totalEarnings(item)),
            dash(item.philhealth_deduction),
            dash(item.pagibig_deduction),
            dash(item.sss_deduction),
            '-',
            '-',
            '-',
            dash(others),
            dash(totalDeductions(item)),
            num(item.net_pay),
            '',
        ]);
    });

    const sum = (fn: (item: PayrollItem) => number) =>
        items.reduce((total, item) => total + fn(item), 0);

    rows.push([
        'Total',
        '',
        '',
        '',
        sum((item) => Number(item.present_days ?? 0)),
        '-',
        num(sum((item) => Number(item.basic_pay ?? 0))),
        '-',
        '-',
        num(sum((item) => Number(item.basic_pay ?? 0))),
        num(sum((item) => Number(item.overtime_pay ?? 0))),
        num(sum((item) => Number(item.holiday_pay ?? 0))),
        num(sum((item) => Number(item.night_diff ?? 0))),
        num(sum(totalEarnings)),
        num(sum((item) => Number(item.philhealth_deduction ?? 0))),
        num(sum((item) => Number(item.pagibig_deduction ?? 0))),
        num(sum((item) => Number(item.sss_deduction ?? 0))),
        '-',
        '-',
        '-',
        num(
            sum(
                (item) =>
                    Number(item.other_deductions ?? 0) +
                    Number(item.tax_deduction ?? 0) +
                    Number(item.leave_deduction ?? 0),
            ),
        ),
        num(sum(totalDeductions)),
        num(sum((item) => Number(item.net_pay ?? 0))),
        '',
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    worksheet['!merges'] = [
        ...[0, 1, 2, 3].map((column) => ({
            s: { r: 0, c: column },
            e: { r: 2, c: column },
        })),
        { s: { r: 0, c: 4 }, e: { r: 0, c: 13 } },
        { s: { r: 0, c: 14 }, e: { r: 0, c: 21 } },
        { s: { r: 0, c: 22 }, e: { r: 2, c: 22 } },
        { s: { r: 0, c: 23 }, e: { r: 2, c: 23 } },
        ...Array.from({ length: 10 }, (_, index) => ({
            s: { r: 1, c: 4 + index },
            e: { r: 2, c: 4 + index },
        })),
        { s: { r: 1, c: 14 }, e: { r: 1, c: 16 } },
        { s: { r: 1, c: 17 }, e: { r: 1, c: 18 } },
        ...[19, 20, 21].map((column) => ({
            s: { r: 1, c: column },
            e: { r: 2, c: column },
        })),
    ];

    for (let row = 0; row < 3; row += 1) {
        for (let column = 0; column < COLUMN_COUNT; column += 1) {
            const address = XLSX.utils.encode_cell({ r: row, c: column });

            if (!worksheet[address]) {
                worksheet[address] = { t: 's', v: '' };
            }

            worksheet[address].s = headerStyle;
        }
    }

    items.forEach((_, index) => {
        const row = 3 + index;
        const shaded = index % 2 === 1;

        for (let column = 0; column < COLUMN_COUNT; column += 1) {
            const address = XLSX.utils.encode_cell({ r: row, c: column });

            if (!worksheet[address]) {
                worksheet[address] = { t: 's', v: '' };
            }

            worksheet[address].s = cellStyle(shaded, {
                bold: column === 1 || column === 13 || column === 22,
                left: column === 2 || column === 3,
            });
        }
    });

    const footerRow = 3 + items.length;

    for (let column = 0; column < COLUMN_COUNT; column += 1) {
        const address = XLSX.utils.encode_cell({ r: footerRow, c: column });

        if (!worksheet[address]) {
            worksheet[address] = { t: 's', v: '' };
        }

        worksheet[address].s = footerStyle;
    }

    worksheet['!cols'] = [
        { wch: 5 },
        { wch: 10 },
        { wch: 24 },
        { wch: 16 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
        { wch: 8 },
        { wch: 8 },
        { wch: 12 },
        { wch: 11 },
        { wch: 11 },
        { wch: 12 },
        { wch: 13 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 11 },
        { wch: 9 },
        { wch: 12 },
        { wch: 13 },
        { wch: 16 },
    ];

    worksheet['!rows'] = [
        { hpt: 20 },
        { hpt: 20 },
        { hpt: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll Register');
    XLSX.writeFile(
        workbook,
        `payroll-run-${run.cutoff_start}_to_${run.cutoff_end}.xlsx`,
    );
}
