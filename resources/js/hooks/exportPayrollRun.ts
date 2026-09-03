import XLSX from 'xlsx-js-style';
import type { PayrollItem, PayrollRun } from '@/components/payroll-run/types';

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
    alignment: {
        horizontal: 'center',
        vertical: 'center',
        wrapText: true,
    },
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

type PayrollItemWithCola = PayrollItem & {
    cola?: number | string | null;
};

const numberValue = (value: unknown): number =>
    Number(value ?? 0);

const colaOf = (item: PayrollItem): number =>
    numberValue((item as PayrollItemWithCola).cola);

const deductionOthersOf = (item: PayrollItem): number =>
    numberValue(item.other_deductions) +
    numberValue(item.tax_deduction) +
    numberValue(item.leave_deduction);

const othersEarningsOf = (item: PayrollItem): number =>
    colaOf(item) +
    numberValue(item.overtime_pay) +
    numberValue(item.holiday_pay) +
    numberValue(item.night_diff);

const earningsOf = (item: PayrollItem): number => {
    const grossEarnings =
        numberValue(item.basic_pay) +
        numberValue(item.overtime_pay) +
        numberValue(item.holiday_pay) +
        numberValue(item.night_diff) +
        numberValue(item.leave_pay) +
        numberValue(item.bonus);

    return item.total_earnings != null
        ? numberValue(item.total_earnings)
        : grossEarnings;
};

const deductionsOf = (item: PayrollItem): number => {
    if (item.total_deductions != null) {
        return numberValue(item.total_deductions);
    }

    return (
        numberValue(item.tardy_deduction) +
        numberValue(item.sss_deduction) +
        numberValue(item.philhealth_deduction) +
        numberValue(item.pagibig_deduction) +
        deductionOthersOf(item)
    );
};

const netPayOf = (item: PayrollItem): number => {
    if (item.net_pay != null) {
        return numberValue(item.net_pay);
    }

    return earningsOf(item) + colaOf(item) - deductionsOf(item);
};

const rateOf = (item: PayrollItem): number =>
    item.employee?.rate_type === 'daily'
        ? numberValue(
            item.employee.daily_rate ??
            item.employee.basic_rate,
        )
        : numberValue(item.employee?.basic_rate) / 26;

/*
|--------------------------------------------------------------------------
| Excel layout — mirrors PayrollRegisterTable exactly
|--------------------------------------------------------------------------
|
| A-D  Employee information
|
| E-N  Earnings
| E    No. of Days
| F    Rate
| G    Basic Salary
| H    Tardy
| I    Total Earnings
| J    COLA
| K    Overtime Pay
| L    Holiday Pay
| M    Night Shift Pay
| N    Total Gross Earning
|
| O-V  Deductions
| O    PhilHealth
| P    Pag-IBIG
| Q    SSS
| R    SSS Loan
| S    Pag-IBIG Loan
| T    Cash Advance
| U    Others
| V    Total Deductions
|
| W    Others = COLA + OT + Holiday + Night Shift
| X    Total Net Earnings
| Y    Signature
|--------------------------------------------------------------------------
*/

const HEADER_ROW_1 = [
    'No.', 'ID No.', 'Employee Name', 'Department',
    'Earnings', '', '', '', '', '', '', '', '', '',
    'Deductions', '', '', '', '', '', '', '',
    'Others',
    'Total Net Earnings',
    'Signature',
];

const HEADER_ROW_2 = [
    '', '', '', '',
    'No. of Days', 'Rate', 'Basic Salary', 'Tardy', 'Total Earnings',
    'COLA', 'Overtime Pay', 'Holiday Pay', 'Night Shift Pay',
    'Total Gross Earning',
    'Contribution', '', '', 'Loans', '', 'Cash Advance', 'Others',
    'Total Deductions',
    '', '', '',
];

const HEADER_ROW_3 = [
    '', '', '', '',
    '', '', '', '', '', '', '', '', '', '',
    'PhilHealth', 'Pag-IBIG', 'SSS', 'SSS', 'Pag-IBIG', '', '', '',
    '', '', '',
];

const COLUMN_COUNT = HEADER_ROW_1.length;

const column = (index: number) => XLSX.utils.encode_col(index);

export function exportPayrollRunToExcel(
    run: PayrollRun,
    items: PayrollItem[],
) {
    const rows: unknown[][] = [
        HEADER_ROW_1,
        HEADER_ROW_2,
        HEADER_ROW_3,
    ];

    items.forEach((item, index) => {
        const earnings = earningsOf(item);
        const cola = colaOf(item);
        const gross = earnings + cola;
        const deductions = deductionsOf(item);

        rows.push([
            index + 1,
            item.employee?.employee_id ?? item.employee_id,
            item.employee?.full_name ?? '',
            '-',

            numberValue(item.present_days),
            rateOf(item),
            numberValue(item.basic_pay),
            numberValue(item.tardy_deduction),
            earnings,
            cola,
            numberValue(item.overtime_pay),
            numberValue(item.holiday_pay),
            numberValue(item.night_diff),
            gross,

            numberValue(item.philhealth_deduction),
            numberValue(item.pagibig_deduction),
            numberValue(item.sss_deduction),
            0,
            0,
            0,
            deductionOthersOf(item),
            deductions,

            othersEarningsOf(item),
            netPayOf(item),
            '',
        ]);
    });

    const footerRow = 4 + items.length;

    rows.push([
        'Total', '', '', '',
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, '',
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    /*
     * Keep Excel formulas aligned with the values shown in Payroll Review.
     *
     * I = Basic Salary
     * N = Total Earnings + COLA
     * V = all displayed deductions
     * X = Gross - Total Deductions
     *
     * W is intentionally a separate earnings summary:
     * COLA + OT + Holiday + Night Shift.
     */
    items.forEach((_, index) => {
        const row = 4 + index;

        worksheet[`I${row}`] = {
            t: 'n',
            f: `G${row}`,
        };

        worksheet[`N${row}`] = {
            t: 'n',
            f: `I${row}+J${row}`,
        };

        worksheet[`V${row}`] = {
            t: 'n',
            f: `H${row}+O${row}+P${row}+Q${row}+R${row}+S${row}+T${row}+U${row}`,
        };

        worksheet[`W${row}`] = {
            t: 'n',
            f: `J${row}+K${row}+L${row}+M${row}`,
        };

        worksheet[`X${row}`] = {
            t: 'n',
            f: `N${row}-V${row}`,
        };
    });

    const numericColumns = [
        'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
        'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
    ];

    numericColumns.forEach((columnName) => {
        worksheet[`${columnName}${footerRow}`] = {
            t: 'n',
            f: items.length
                ? `SUM(${columnName}4:${columnName}${footerRow - 1})`
                : undefined,
            v: items.length ? undefined : 0,
        };
    });

    worksheet[`A${footerRow}`] = {
        t: 's',
        v: 'Total',
    };

    worksheet[`Y${footerRow}`] = {
        t: 's',
        v: '',
    };

    worksheet['!merges'] = [
        ...[0, 1, 2, 3].map((columnIndex) => ({
            s: { r: 0, c: columnIndex },
            e: { r: 2, c: columnIndex },
        })),

        {
            s: { r: 0, c: 4 },
            e: { r: 0, c: 13 },
        },
        {
            s: { r: 0, c: 14 },
            e: { r: 0, c: 21 },
        },
        {
            s: { r: 0, c: 22 },
            e: { r: 2, c: 22 },
        },
        {
            s: { r: 0, c: 23 },
            e: { r: 2, c: 23 },
        },
        {
            s: { r: 0, c: 24 },
            e: { r: 2, c: 24 },
        },

        ...Array.from({ length: 10 }, (_, index) => ({
            s: { r: 1, c: 4 + index },
            e: { r: 2, c: 4 + index },
        })),

        {
            s: { r: 1, c: 14 },
            e: { r: 1, c: 16 },
        },
        {
            s: { r: 1, c: 17 },
            e: { r: 1, c: 18 },
        },
        {
            s: { r: 1, c: 19 },
            e: { r: 2, c: 19 },
        },
        {
            s: { r: 1, c: 20 },
            e: { r: 2, c: 20 },
        },
        {
            s: { r: 1, c: 21 },
            e: { r: 2, c: 21 },
        },
    ];

    for (let row = 0; row < 3; row += 1) {
        for (let columnIndex = 0; columnIndex < COLUMN_COUNT; columnIndex += 1) {
            const address = XLSX.utils.encode_cell({
                r: row,
                c: columnIndex,
            });

            if (!worksheet[address]) {
                worksheet[address] = { t: 's', v: '' };
            }

            worksheet[address].s = headerStyle;
        }
    }

    items.forEach((_, index) => {
        const row = 3 + index;
        const shaded = index % 2 === 1;

        for (let columnIndex = 0; columnIndex < COLUMN_COUNT; columnIndex += 1) {
            const address = XLSX.utils.encode_cell({
                r: row,
                c: columnIndex,
            });

            if (!worksheet[address]) {
                worksheet[address] = { t: 's', v: '' };
            }

            worksheet[address].s = cellStyle(shaded, {
                bold:
                    columnIndex === 1 ||
                    columnIndex === 8 ||
                    columnIndex === 13 ||
                    columnIndex === 21 ||
                    columnIndex === 22 ||
                    columnIndex === 23,
                left: columnIndex === 2 || columnIndex === 3,
            });
        }
    });

    for (let columnIndex = 0; columnIndex < COLUMN_COUNT; columnIndex += 1) {
        const address = XLSX.utils.encode_cell({
            r: footerRow - 1,
            c: columnIndex,
        });

        if (!worksheet[address]) {
            worksheet[address] = { t: 's', v: '' };
        }

        worksheet[address].s = footerStyle;
    }

    const currencyColumns = [
        'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
        'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
    ];

    for (let row = 4; row < footerRow; row += 1) {
        currencyColumns.forEach((columnName) => {
            const address = `${columnName}${row}`;
            if (worksheet[address]) {
                worksheet[address].z = '₱#,##0.00';
            }
        });
    }

    currencyColumns.forEach((columnName) => {
        const address = `${columnName}${footerRow}`;
        if (worksheet[address]) {
            worksheet[address].z = '₱#,##0.00';
        }
    });

    worksheet['!ref'] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: footerRow - 1, c: COLUMN_COUNT - 1 },
    });

    worksheet['!cols'] = [
        { wch: 5 },
        { wch: 10 },
        { wch: 24 },
        { wch: 16 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
        { wch: 10 },
        { wch: 13 },
        { wch: 9 },
        { wch: 12 },
        { wch: 12 },
        { wch: 13 },
        { wch: 16 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
        { wch: 13 },
        { wch: 11 },
        { wch: 15 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
    ];

    worksheet['!rows'] = [
        { hpt: 20 },
        { hpt: 20 },
        { hpt: 20 },
    ];

    worksheet['!freeze'] = {
        xSplit: 4,
        ySplit: 3,
    };

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        'Payroll Register',
    );

    XLSX.writeFile(
        workbook,
        `payroll-run-${run.cutoff_start}_to_${run.cutoff_end}.xlsx`,
    );
}
