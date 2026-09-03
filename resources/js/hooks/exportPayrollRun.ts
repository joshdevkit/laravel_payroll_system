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
        horizontal: options.left
            ? 'left'
            : 'center',
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
*/

const colaOf = (
    item: PayrollItem,
): number =>
    numberValue(
        (item as PayrollItemWithCola).cola,
    );

/*
|--------------------------------------------------------------------------
| Others Earnings
|--------------------------------------------------------------------------
|
| Others Earnings =
|
| COLA
| + Overtime
| + Holiday
| + Night Shift
|
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
| Total Earnings
|--------------------------------------------------------------------------
|
| Total Earnings =
|
| Basic Salary - Tardy
|
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
|--------------------------------------------------------------------------
*/

const totalGrossOf = (
    item: PayrollItem,
): number =>
    totalEarningsOf(item) +
    colaOf(item) +
    numberValue(item.overtime_pay) +
    numberValue(item.holiday_pay) +
    numberValue(item.night_diff);

/*
|--------------------------------------------------------------------------
| Other Deductions
|--------------------------------------------------------------------------
|
| Displayed under the "Others" deduction column.
|
| Others =
|
| Other Deductions
| + Tax Deduction
| + Leave Deduction
|
|--------------------------------------------------------------------------
*/

const deductionOthersOf = (
    item: PayrollItem,
): number =>
    numberValue(item.other_deductions) +
    numberValue(item.tax_deduction) +
    numberValue(item.leave_deduction);

/*
|--------------------------------------------------------------------------
| Total Deductions
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This is DISPLAY ONLY.
|
| It DOES NOT affect Total Net Earnings.
|
| Total Deductions =
|
| Tardy
| + SSS
| + PhilHealth
| + Pag-IBIG
| + Other Deductions
|
|--------------------------------------------------------------------------
*/

const totalDeductionsOf = (
    item: PayrollItem,
): number =>
    numberValue(item.tardy_deduction) +
    numberValue(item.sss_deduction) +
    numberValue(item.philhealth_deduction) +
    numberValue(item.pagibig_deduction) +
    numberValue(item.other_deductions);

/*
|--------------------------------------------------------------------------
| Total Net Earnings
|--------------------------------------------------------------------------
|
| IMPORTANT BUSINESS RULE
|
| Total Net Earnings is NOT:
|
| Total Gross - Total Deductions
|
| Instead:
|
| Total Net Earnings =
|
| Total Gross Earning
| - PhilHealth
| - Pag-IBIG
| - SSS
| - Cash Advance
|
| Therefore:
|
| X = N - O - P - Q - T
|
|--------------------------------------------------------------------------
*/

const netPayOf = (
    item: PayrollItem,
): number =>
    totalGrossOf(item) -
    numberValue(item.philhealth_deduction) -
    numberValue(item.pagibig_deduction) -
    numberValue(item.sss_deduction) -
    numberValue(item.cash_advance);

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
| O-V  Deductions
|
| O    PhilHealth
| P    Pag-IBIG
| Q    SSS
| R    SSS Loan
| S    Pag-IBIG Loan
| T    Cash Advance
| U    Others
| V    Total Deductions
|
| W    Others Earnings
| X    Total Net Earnings
| Y    Signature
|
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
    'Others',
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
    'SSS',
    'Pag-IBIG',
    '',
    '',
    '',

    '',
    '',
    '',
];

const COLUMN_COUNT =
    HEADER_ROW_1.length;

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
            totalGrossOf(item);

        const totalDeductions =
            totalDeductionsOf(item);

        const othersEarnings =
            othersEarningsOf(item);

        /*
         * IMPORTANT:
         *
         * Net Earnings:
         *
         * Gross
         * - PhilHealth
         * - Pag-IBIG
         * - SSS
         * - Cash Advance
         */
        const netPay =
            netPayOf(item);

        rows.push([
            /*
             * A-D
             * Employee Information
             */

            index + 1,

            item.employee?.employee_id ??
                item.employee_id,

            item.employee?.full_name ??
                '',

            '-',

            /*
             * E-N
             * Earnings
             */

            numberValue(
                item.present_days,
            ),

            rateOf(item),

            numberValue(
                item.basic_pay,
            ),

            numberValue(
                item.tardy_deduction,
            ),

            totalEarnings,

            colaOf(item),

            numberValue(
                item.overtime_pay,
            ),

            numberValue(
                item.holiday_pay,
            ),

            numberValue(
                item.night_diff,
            ),

            totalGross,

            /*
             * O-V
             * Deductions
             */

            /*
             * O - PhilHealth
             */
            numberValue(
                item.philhealth_deduction,
            ),

            /*
             * P - Pag-IBIG
             */
            numberValue(
                item.pagibig_deduction,
            ),

            /*
             * Q - SSS
             */
            numberValue(
                item.sss_deduction,
            ),

            /*
             * R - SSS Loan
             */
            0,

            /*
             * S - Pag-IBIG Loan
             */
            0,

            /*
             * T - Cash Advance
             *
             * This is intentionally included
             * in the Net Earnings calculation.
             */
            numberValue(
                item.cash_advance,
            ),

            /*
             * U - Others
             */
            deductionOthersOf(item),

            /*
             * V - Total Deductions
             *
             * DISPLAY ONLY.
             *
             * Does NOT affect X.
             */
            totalDeductions,

            /*
             * W - Others Earnings
             */
            othersEarnings,

            /*
             * X - Total Net Earnings
             *
             * Gross
             * - PhilHealth
             * - Pag-IBIG
             * - SSS
             * - Cash Advance
             */
            netPay,

            /*
             * Y - Signature
             */
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

        0, // E
        0, // F
        0, // G
        0, // H
        0, // I
        0, // J
        0, // K
        0, // L
        0, // M
        0, // N

        0, // O
        0, // P
        0, // Q
        0, // R
        0, // S
        0, // T
        0, // U
        0, // V

        0, // W
        0, // X

        '', // Y
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
    | V = H + O + P + Q + R + S + T + U
    |
    | W = J + K + L + M
    |
    | X = N - O - P - Q - T
    |
    | IMPORTANT:
    |
    | V is NOT used in X.
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
         * + NSD
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
         * V - Total Deductions
         *
         * DISPLAY ONLY.
         *
         * This has no effect on X.
         */
        worksheet[`V${row}`] = {
            t: 'n',
            f:
                `H${row}+` +
                `O${row}+` +
                `P${row}+` +
                `Q${row}+` +
                `R${row}+` +
                `S${row}+` +
                `T${row}+` +
                `U${row}`,
        };

        /*
         * W - Others Earnings
         *
         * COLA + OT + Holiday + NSD
         */
        worksheet[`W${row}`] = {
            t: 'n',
            f:
                `J${row}+` +
                `K${row}+` +
                `L${row}+` +
                `M${row}`,
        };

        /*
         * X - Total Net Earnings
         *
         * BUSINESS RULE:
         *
         * Total Gross Earning
         * - PhilHealth
         * - Pag-IBIG
         * - SSS
         * - Cash Advance
         *
         * V / Total Deductions is NOT used.
         */
        worksheet[`X${row}`] = {
            t: 'n',
            f:
                `N${row}-` +
                `O${row}-` +
                `P${row}-` +
                `Q${row}-` +
                `T${row}`,
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
        'X',
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
        `Y${footerRow}`
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
            s: {
                r: 0,
                c: 4,
            },
            e: {
                r: 0,
                c: 13,
            },
        },

        /*
         * Deductions
         */
        {
            s: {
                r: 0,
                c: 14,
            },
            e: {
                r: 0,
                c: 21,
            },
        },

        /*
         * Others
         */
        {
            s: {
                r: 0,
                c: 22,
            },
            e: {
                r: 2,
                c: 22,
            },
        },

        /*
         * Total Net Earnings
         */
        {
            s: {
                r: 0,
                c: 23,
            },
            e: {
                r: 2,
                c: 23,
            },
        },

        /*
         * Signature
         */
        {
            s: {
                r: 0,
                c: 24,
            },
            e: {
                r: 2,
                c: 24,
            },
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
            s: {
                r: 1,
                c: 14,
            },
            e: {
                r: 1,
                c: 16,
            },
        },

        /*
         * Loans
         */
        {
            s: {
                r: 1,
                c: 17,
            },
            e: {
                r: 1,
                c: 18,
            },
        },

        /*
         * Cash Advance
         */
        {
            s: {
                r: 1,
                c: 19,
            },
            e: {
                r: 2,
                c: 19,
            },
        },

        /*
         * Others Deductions
         */
        {
            s: {
                r: 1,
                c: 20,
            },
            e: {
                r: 2,
                c: 20,
            },
        },

        /*
         * Total Deductions
         */
        {
            s: {
                r: 1,
                c: 21,
            },
            e: {
                r: 2,
                c: 21,
            },
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
                     * V = Total Deductions
                     * W = Others
                     * X = Total Net Earnings
                     */
                    bold:
                        columnIndex === 1 ||
                        columnIndex === 8 ||
                        columnIndex === 13 ||
                        columnIndex === 21 ||
                        columnIndex === 22 ||
                        columnIndex === 23,

                    /*
                     * Left:
                     *
                     * Employee Name
                     * Department
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
        'X',
    ];

    /*
     * Employee Rows
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
     * Footer
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
            s: {
                r: 0,
                c: 0,
            },
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
        { wch: 5 },   // A No.
        { wch: 10 },  // B ID
        { wch: 24 },  // C Employee
        { wch: 16 },  // D Department

        { wch: 10 },  // E Days
        { wch: 10 },  // F Rate
        { wch: 12 },  // G Basic
        { wch: 10 },  // H Tardy
        { wch: 13 },  // I Total Earnings
        { wch: 9 },   // J COLA
        { wch: 12 },  // K OT
        { wch: 12 },  // L Holiday
        { wch: 13 },  // M NSD
        { wch: 16 },  // N Gross

        { wch: 12 },  // O PhilHealth
        { wch: 12 },  // P Pag-IBIG
        { wch: 10 },  // Q SSS
        { wch: 10 },  // R SSS Loan
        { wch: 12 },  // S Pag-IBIG Loan
        { wch: 13 },  // T Cash Advance
        { wch: 11 },  // U Others
        { wch: 15 },  // V Total Deductions

        { wch: 13 },  // W Others
        { wch: 16 },  // X Net Earnings
        { wch: 16 },  // Y Signature
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
