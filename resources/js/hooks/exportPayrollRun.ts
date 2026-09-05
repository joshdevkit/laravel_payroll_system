import XLSX from 'xlsx-js-style';
import type {
    PayrollItem,
    PayrollRun,
} from '@/components/payroll-run/types';

const AMBER_HEADER = 'FBBF24';
const AMBER_FOOTER = 'FDE68A';
const AMBER_ROW = 'FFFBEB';
const BLACK = '000000';

const thinBorder = {
    top: {
        style: 'thin',
        color: { rgb: '999999' },
    },
    bottom: {
        style: 'thin',
        color: { rgb: '999999' },
    },
    left: {
        style: 'thin',
        color: { rgb: '999999' },
    },
    right: {
        style: 'thin',
        color: { rgb: '999999' },
    },
};

const headerStyle = {
    font: {
        bold: true,
        color: { rgb: BLACK },
        sz: 9,
    },
    fill: {
        fgColor: { rgb: AMBER_HEADER },
    },
    alignment: {
        horizontal: 'center',
        vertical: 'center',
        wrapText: true,
    },
    border: thinBorder,
};

const footerStyle = {
    font: {
        bold: true,
        color: { rgb: BLACK },
        sz: 10,
    },
    fill: {
        fgColor: { rgb: AMBER_FOOTER },
    },
    alignment: {
        horizontal: 'center',
        vertical: 'center',
    },
    border: thinBorder,
};

const cellStyle = (
    shaded: boolean,
    options: {
        bold?: boolean;
        left?: boolean;
    } = {},
) => ({
    font: {
        bold: Boolean(options.bold),
        sz: 10,
    },

    fill: shaded
        ? {
              fgColor: { rgb: AMBER_ROW },
          }
        : undefined,

    alignment: {
        horizontal: options.left ? 'left' : 'center',
        vertical: 'center',
    },

    border: thinBorder,
});

type PayrollItemWithCola = PayrollItem & {
    cola?: number | string | null;
};

/*
|--------------------------------------------------------------------------
| Number Helper
|--------------------------------------------------------------------------
*/

const numberValue = (value: unknown): number =>
    Number(value ?? 0);

/*
|--------------------------------------------------------------------------
| COLA
|--------------------------------------------------------------------------
|
| COLA is already calculated by PayrollCalculator as:
|
| cola_amount × present_days
|
| This function simply reads the calculated payroll item value.
|--------------------------------------------------------------------------
*/

const colaOf = (
    item: PayrollItem,
): number =>
    numberValue(
        (item as PayrollItemWithCola).cola,
    );

/*
|--------------------------------------------------------------------------
| Total Earnings
|--------------------------------------------------------------------------
|
| Total Earnings =
|
| Basic Salary - Tardy
|
| This matches PayrollRegisterTable.
|--------------------------------------------------------------------------
*/

const totalEarningsOf = (
    item: PayrollItem,
): number =>
    numberValue(item.basic_pay) -
    numberValue(item.tardy_deduction);

/*
|--------------------------------------------------------------------------
| Total Gross Earning
|--------------------------------------------------------------------------
|
| Total Gross Earning =
|
| Total Earnings
| + COLA
| + Overtime Pay
| + Holiday Pay
| + Night Shift Pay
|
| COLA IS INCLUDED in Total Gross Earning.
|--------------------------------------------------------------------------
*/

const totalGrossEarningOf = (
    item: PayrollItem,
): number =>
    totalEarningsOf(item) +
    colaOf(item) +
    numberValue(item.overtime_pay) +
    numberValue(item.holiday_pay) +
    numberValue(item.night_diff);

/*
|--------------------------------------------------------------------------
| Total Deductions
|--------------------------------------------------------------------------
|
| Total Deductions =
|
| Tardy
| + PhilHealth
| + Pag-IBIG
| + SSS
| + SSS Loan
| + Pag-IBIG Loan
| + Cash Advance
|--------------------------------------------------------------------------
*/

const totalDeductionsOf = (
    item: PayrollItem,
): number =>
    numberValue(item.tardy_deduction) +
    numberValue(item.philhealth_deduction) +
    numberValue(item.pagibig_deduction) +
    numberValue(item.sss_deduction) +
    numberValue(item.sss_loan_deduction) +
    numberValue(item.pagibig_loan_deduction) +
    numberValue(item.cash_advance_deduction);

/*
|--------------------------------------------------------------------------
| Others Earnings
|--------------------------------------------------------------------------
|
| Others =
|
| COLA
| + Overtime Pay
| + Holiday Pay
| + Night Shift Pay
|
| This is a display subtotal only.
|--------------------------------------------------------------------------
*/

const othersEarningsOf = (
    item: PayrollItem,
): number =>
    colaOf(item) +
    numberValue(item.overtime_pay) +
    numberValue(item.holiday_pay) +
    numberValue(item.night_diff);

/*
|--------------------------------------------------------------------------
| Total Net Earnings
|--------------------------------------------------------------------------
|
| Total Net Earnings =
|
| Total Gross Earning - Total Deductions
|
| Since COLA is already inside Total Gross Earning,
| it MUST NOT be added again here.
|--------------------------------------------------------------------------
*/

const totalNetEarningsOf = (
    item: PayrollItem,
): number =>
    totalGrossEarningOf(item) -
    totalDeductionsOf(item);

/*
|--------------------------------------------------------------------------
| Employee Rate
|--------------------------------------------------------------------------
*/

const rateOf = (
    item: PayrollItem,
): number =>
    item.employee?.rate_type === 'daily'
        ? numberValue(
              item.employee.daily_rate ??
                  item.employee.basic_rate,
          )
        : numberValue(
              item.employee?.basic_rate,
          ) / 26;

/*
|--------------------------------------------------------------------------
| Excel Layout
|--------------------------------------------------------------------------
|
| A-D  Employee Information
|
| A    No.
| B    ID No.
| C    Employee Name
| D    Department
|
| E-N  Earnings
|
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
| O-U  Deductions
|
| O    PhilHealth
| P    Pag-IBIG
| Q    SSS
| R    SSS Loan
| S    Pag-IBIG Loan
| T    Cash Advance
| U    Total Deductions
|
| V    Others Earnings
| W    Total Net Earnings
| X    Signature
|--------------------------------------------------------------------------
*/

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

    'Others',
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
    'Tardy',
    'Total Earnings',
    'COLA',
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
    'Total Deductions',

    '',
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
    'SSS Loan',
    'Pag-IBIG Loan',
    '',
    '',

    '',
    '',
    '',
];

const COLUMN_COUNT = HEADER_ROW_1.length;

/*
|--------------------------------------------------------------------------
| Export Payroll Run
|--------------------------------------------------------------------------
*/

export function exportPayrollRunToExcel(
    run: PayrollRun,
    items: PayrollItem[],
) {
    const rows: unknown[][] = [
        HEADER_ROW_1,
        HEADER_ROW_2,
        HEADER_ROW_3,
    ];

    /*
    |--------------------------------------------------------------------------
    | Employee Rows
    |--------------------------------------------------------------------------
    */

    items.forEach((item, index) => {
        const totalEarnings =
            totalEarningsOf(item);

        const totalGross =
            totalGrossEarningOf(item);

        const totalDeductions =
            totalDeductionsOf(item);

        const othersEarnings =
            othersEarningsOf(item);

        const netEarnings =
            totalNetEarningsOf(item);

        rows.push([
            /* A - No. */
            index + 1,

            /* B - Employee ID */
            item.employee?.employee_id ??
                item.employee_id,

            /* C - Employee Name */
            item.employee?.full_name ??
                '',

            /* D - Department */
            item.employee?.category?.name ??
                '',

            /* E - No. of Days */
            numberValue(item.present_days),

            /* F - Rate */
            rateOf(item),

            /* G - Basic Salary */
            numberValue(item.basic_pay),

            /* H - Tardy */
            numberValue(item.tardy_deduction),

            /* I - Total Earnings */
            totalEarnings,

            /* J - COLA */
            colaOf(item),

            /* K - Overtime Pay */
            numberValue(item.overtime_pay),

            /* L - Holiday Pay */
            numberValue(item.holiday_pay),

            /* M - Night Shift Pay */
            numberValue(item.night_diff),

            /* N - Total Gross Earning */
            totalGross,

            /* O - PhilHealth */
            numberValue(item.philhealth_deduction),

            /* P - Pag-IBIG */
            numberValue(item.pagibig_deduction),

            /* Q - SSS */
            numberValue(item.sss_deduction),

            /* R - SSS Loan */
            numberValue(item.sss_loan_deduction),

            /* S - Pag-IBIG Loan */
            numberValue(item.pagibig_loan_deduction),

            /* T - Cash Advance */
            numberValue(item.cash_advance_deduction),

            /* U - Total Deductions */
            totalDeductions,

            /* V - Others Earnings */
            othersEarnings,

            /* W - Total Net Earnings */
            netEarnings,

            /* X - Signature */
            '',
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Footer
    |--------------------------------------------------------------------------
    */

    const footerRow =
        4 + items.length;

    rows.push([
        'Total',
        '',
        '',
        '',

        0, // E - No. of Days
        0, // F - Rate
        0, // G - Basic Salary
        0, // H - Tardy
        0, // I - Total Earnings
        0, // J - COLA
        0, // K - Overtime
        0, // L - Holiday
        0, // M - Night Shift
        0, // N - Gross

        0, // O - PhilHealth
        0, // P - Pag-IBIG
        0, // Q - SSS
        0, // R - SSS Loan
        0, // S - Pag-IBIG Loan
        0, // T - Cash Advance
        0, // U - Total Deductions

        0, // V - Others Earnings
        0, // W - Net Earnings

        '', // X - Signature
    ]);

    const worksheet =
        XLSX.utils.aoa_to_sheet(rows);

    /*
    |--------------------------------------------------------------------------
    | Employee Row Formulas
    |--------------------------------------------------------------------------
    |
    | I = G - H
    |
    | N = I + J + K + L + M
    |
    | U = H + O + P + Q + R + S + T
    |
    | V = J + K + L + M
    |
    | W = N - U
    |
    |--------------------------------------------------------------------------
    */

    items.forEach((_, index) => {
        const row = 4 + index;

        /*
         * I - Total Earnings
         *
         * Basic Salary - Tardy
         */
        worksheet[`I${row}`] = {
            t: 'n',
            f: `G${row}-H${row}`,
        };

        /*
         * N - Total Gross Earning
         *
         * Total Earnings
         * + COLA
         * + OT
         * + Holiday
         * + Night Shift
         */
        worksheet[`N${row}`] = {
            t: 'n',
            f:
                `I${row}+` +
                `J${row}+` +
                `K${row}+` +
                `L${row}+` +
                `M${row}`,
        };

        /*
         * U - Total Deductions
         *
         * Tardy
         * + PhilHealth
         * + Pag-IBIG
         * + SSS
         * + SSS Loan
         * + Pag-IBIG Loan
         * + Cash Advance
         */
        worksheet[`U${row}`] = {
            t: 'n',
            f:
                `H${row}+` +
                `O${row}+` +
                `P${row}+` +
                `Q${row}+` +
                `R${row}+` +
                `S${row}+` +
                `T${row}`,
        };

        /*
         * V - Others Earnings
         *
         * COLA + OT + Holiday + Night Shift
         */
        worksheet[`V${row}`] = {
            t: 'n',
            f:
                `J${row}+` +
                `K${row}+` +
                `L${row}+` +
                `M${row}`,
        };

        /*
         * W - Total Net Earnings
         *
         * Total Gross Earning - Total Deductions
         *
         * COLA is already included in N,
         * so it must NOT be added again.
         */
        worksheet[`W${row}`] = {
            t: 'n',
            f:
                `N${row}-` +
                `U${row}`,
        };
    });

    /*
    |--------------------------------------------------------------------------
    | Footer Formulas
    |--------------------------------------------------------------------------
    */

    const numericColumns = [
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'P',
        'Q',
        'R',
        'S',
        'T',
        'U',
        'V',
        'W',
    ];

    numericColumns.forEach(
        (columnName) => {
            worksheet[
                `${columnName}${footerRow}`
            ] = {
                t: 'n',

                f: items.length
                    ? `SUM(${columnName}4:${columnName}${footerRow - 1})`
                    : undefined,

                v: items.length
                    ? undefined
                    : 0,
            };
        },
    );

    /*
    |--------------------------------------------------------------------------
    | Footer Label
    |--------------------------------------------------------------------------
    */

    worksheet[
        `A${footerRow}`
    ] = {
        t: 's',
        v: 'Total',
    };

    worksheet[
        `X${footerRow}`
    ] = {
        t: 's',
        v: '',
    };

    /*
    |--------------------------------------------------------------------------
    | Header Merges
    |--------------------------------------------------------------------------
    */

    worksheet['!merges'] = [
        /*
         * Employee Information
         */
        ...[0, 1, 2, 3].map(
            (columnIndex) => ({
                s: {
                    r: 0,
                    c: columnIndex,
                },
                e: {
                    r: 2,
                    c: columnIndex,
                },
            }),
        ),

        /*
         * Earnings
         */
        {
            s: { r: 0, c: 4 },
            e: { r: 0, c: 13 },
        },

        /*
         * Deductions
         */
        {
            s: { r: 0, c: 14 },
            e: { r: 0, c: 20 },
        },

        /*
         * Others
         */
        {
            s: { r: 0, c: 21 },
            e: { r: 2, c: 21 },
        },

        /*
         * Total Net Earnings
         */
        {
            s: { r: 0, c: 22 },
            e: { r: 2, c: 22 },
        },

        /*
         * Signature
         */
        {
            s: { r: 0, c: 23 },
            e: { r: 2, c: 23 },
        },

        /*
         * Earnings Subheaders
         */
        ...Array.from(
            { length: 10 },
            (_, index) => ({
                s: {
                    r: 1,
                    c: 4 + index,
                },
                e: {
                    r: 2,
                    c: 4 + index,
                },
            }),
        ),

        /*
         * Contribution
         */
        {
            s: { r: 1, c: 14 },
            e: { r: 1, c: 16 },
        },

        /*
         * Loans
         */
        {
            s: { r: 1, c: 17 },
            e: { r: 1, c: 18 },
        },

        /*
         * Cash Advance
         */
        {
            s: { r: 1, c: 19 },
            e: { r: 2, c: 19 },
        },

        /*
         * Total Deductions
         */
        {
            s: { r: 1, c: 20 },
            e: { r: 2, c: 20 },
        },
    ];

    /*
    |--------------------------------------------------------------------------
    | Header Styling
    |--------------------------------------------------------------------------
    */

    for (
        let row = 0;
        row < 3;
        row += 1
    ) {
        for (
            let columnIndex = 0;
            columnIndex < COLUMN_COUNT;
            columnIndex += 1
        ) {
            const address =
                XLSX.utils.encode_cell({
                    r: row,
                    c: columnIndex,
                });

            if (!worksheet[address]) {
                worksheet[address] = {
                    t: 's',
                    v: '',
                };
            }

            worksheet[address].s =
                headerStyle;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Employee Row Styling
    |--------------------------------------------------------------------------
    */

    items.forEach((_, index) => {
        const row = 3 + index;

        const shaded =
            index % 2 === 1;

        for (
            let columnIndex = 0;
            columnIndex < COLUMN_COUNT;
            columnIndex += 1
        ) {
            const address =
                XLSX.utils.encode_cell({
                    r: row,
                    c: columnIndex,
                });

            if (!worksheet[address]) {
                worksheet[address] = {
                    t: 's',
                    v: '',
                };
            }

            worksheet[address].s =
                cellStyle(shaded, {
                    /*
                     * Bold:
                     *
                     * B = Employee ID
                     * I = Total Earnings
                     * N = Total Gross
                     * U = Total Deductions
                     * V = Others
                     * W = Total Net Earnings
                     */
                    bold:
                        columnIndex === 1 ||
                        columnIndex === 8 ||
                        columnIndex === 13 ||
                        columnIndex === 20 ||
                        columnIndex === 21 ||
                        columnIndex === 22,

                    /*
                     * Left aligned:
                     *
                     * C = Employee Name
                     * D = Department
                     */
                    left:
                        columnIndex === 2 ||
                        columnIndex === 3,
                });
        }
    });

    /*
    |--------------------------------------------------------------------------
    | Footer Styling
    |--------------------------------------------------------------------------
    */

    for (
        let columnIndex = 0;
        columnIndex < COLUMN_COUNT;
        columnIndex += 1
    ) {
        const address =
            XLSX.utils.encode_cell({
                r: footerRow - 1,
                c: columnIndex,
            });

        if (!worksheet[address]) {
            worksheet[address] = {
                t: 's',
                v: '',
            };
        }

        worksheet[address].s =
            footerStyle;
    }

    /*
    |--------------------------------------------------------------------------
    | Number Formatting
    |--------------------------------------------------------------------------
    */

    /*
     * E = No. of Days
     *
     * NEVER currency.
     */
    for (
        let row = 4;
        row < footerRow;
        row += 1
    ) {
        const address =
            `E${row}`;

        if (worksheet[address]) {
            worksheet[address].z =
                '0.##';
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Currency Formatting
    |--------------------------------------------------------------------------
    */

    const currencyColumns = [
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'P',
        'Q',
        'R',
        'S',
        'T',
        'U',
        'V',
        'W',
    ];

    /*
    |--------------------------------------------------------------------------
    | Employee Currency Formatting
    |--------------------------------------------------------------------------
    */

    for (
        let row = 4;
        row < footerRow;
        row += 1
    ) {
        currencyColumns.forEach(
            (columnName) => {
                const address =
                    `${columnName}${row}`;

                if (worksheet[address]) {
                    worksheet[address].z =
                        '₱#,##0.00';
                }
            },
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Footer No. of Days Formatting
    |--------------------------------------------------------------------------
    */

    const footerDaysAddress =
        `E${footerRow}`;

    if (worksheet[footerDaysAddress]) {
        worksheet[footerDaysAddress].z =
            '0.##';
    }

    /*
    |--------------------------------------------------------------------------
    | Footer Currency Formatting
    |--------------------------------------------------------------------------
    */

    currencyColumns.forEach(
        (columnName) => {
            const address =
                `${columnName}${footerRow}`;

            if (worksheet[address]) {
                worksheet[address].z =
                    '₱#,##0.00';
            }
        },
    );

    /*
    |--------------------------------------------------------------------------
    | Worksheet Range
    |--------------------------------------------------------------------------
    */

    worksheet['!ref'] =
        XLSX.utils.encode_range({
            s: { r: 0, c: 0 },
            e: {
                r: footerRow - 1,
                c: COLUMN_COUNT - 1,
            },
        });

    /*
    |--------------------------------------------------------------------------
    | Column Widths
    |--------------------------------------------------------------------------
    */

    worksheet['!cols'] = [
        { wch: 5 },   // A - No.
        { wch: 10 },  // B - ID
        { wch: 24 },  // C - Employee
        { wch: 16 },  // D - Department

        { wch: 10 },  // E - Days
        { wch: 10 },  // F - Rate
        { wch: 12 },  // G - Basic
        { wch: 10 },  // H - Tardy
        { wch: 13 },  // I - Total Earnings
        { wch: 9 },   // J - COLA
        { wch: 12 },  // K - OT
        { wch: 12 },  // L - Holiday
        { wch: 13 },  // M - NSD
        { wch: 16 },  // N - Gross

        { wch: 12 },  // O - PhilHealth
        { wch: 12 },  // P - Pag-IBIG
        { wch: 10 },  // Q - SSS
        { wch: 10 },  // R - SSS Loan
        { wch: 12 },  // S - Pag-IBIG Loan
        { wch: 13 },  // T - Cash Advance
        { wch: 15 },  // U - Total Deductions

        { wch: 13 },  // V - Others
        { wch: 16 },  // W - Net Earnings
        { wch: 16 },  // X - Signature
    ];

    /*
    |--------------------------------------------------------------------------
    | Header Row Heights
    |--------------------------------------------------------------------------
    */

    worksheet['!rows'] = [
        { hpt: 20 },
        { hpt: 20 },
        { hpt: 20 },
    ];

    /*
    |--------------------------------------------------------------------------
    | Freeze Panes
    |--------------------------------------------------------------------------
    */

    worksheet['!freeze'] = {
        xSplit: 4,
        ySplit: 3,
    };

    /*
    |--------------------------------------------------------------------------
    | Workbook
    |--------------------------------------------------------------------------
    */

    const workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        'Payroll Register',
    );

    /*
    |--------------------------------------------------------------------------
    | Export
    |--------------------------------------------------------------------------
    */

    XLSX.writeFile(
        workbook,
        `payroll-run-${run.cutoff_start}_to_${run.cutoff_end}.xlsx`,
    );
}
