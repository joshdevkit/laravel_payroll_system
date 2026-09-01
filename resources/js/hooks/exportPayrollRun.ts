import XLSX from 'xlsx-js-style';
import type { PayrollItem, PayrollRun } from '@/components/payroll-run/types';
import { num } from '@/components/payroll-run/payrollRunUtils';

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
    font: {
        bold: true,
        color: { rgb: BLACK },
        sz: 9,
    },
    fill: {
        fgColor: {
            rgb: AMBER_HEADER,
        },
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
        fgColor: {
            rgb: AMBER_FOOTER,
        },
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
            fgColor: {
                rgb: AMBER_ROW,
            },
        }
        : undefined,

    alignment: {
        horizontal: options.left ? 'left' : 'center',
        vertical: 'center',
    },

    border: thinBorder,
});

const dash = (
    value: string | number | null | undefined,
) => {
    const numeric = Number(value ?? 0);

    return numeric !== 0
        ? numeric
        : '-';
};

/*
|--------------------------------------------------------------------------
| Excel Headers
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| COLA is AFTER TOTAL EARNINGS.
|
| Earnings:
|
| E No. of Days
| F Rate
| G Basic Salary
| H Total Earnings
| I COLA
| J Tardy
| K Overtime Pay
| L Holiday Pay
| M Night Shift Pay
| N Total Gross Earning
|
| Deductions:
|
| O PhilHealth
| P Pag-IBIG
| Q SSS
| R SSS Loan
| S Pag-IBIG Loan
| T Cash Advance
| U Others
| V Total Deductions
|
| W Total Net Earnings
| X Signature
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
    'Total Earnings',
    'COLA',
    'Tardy',
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

/*
|--------------------------------------------------------------------------
| Excel Column Helpers
|--------------------------------------------------------------------------
*/

const column = (index: number) =>
    XLSX.utils.encode_col(index);

const cellAddress = (
    columnIndex: number,
    rowNumber: number,
) =>
    `${column(columnIndex)}${rowNumber}`;

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export function exportPayrollRunToExcel(
    run: PayrollRun,
    items: PayrollItem[],
) {
    /*
     * Excel row 1-3 are headers.
     * Actual employee data begins at Excel row 4.
     */
    const rows: unknown[][] = [
        HEADER_ROW_1,
        HEADER_ROW_2,
        HEADER_ROW_3,
    ];

    /*
     * Store employee rows as RAW NUMERIC VALUES.
     *
     * Do NOT store:
     *
     * `₱${num(rate)}`
     *
     * because that creates TEXT and causes:
     *
     * #VALUE!
     *
     * Excel formulas need actual numbers.
     */
    items.forEach((item, index) => {
        const rate =
            item.employee?.rate_type === 'daily'
                ? Number(
                    item.employee.daily_rate ??
                    item.employee.basic_rate ??
                    0,
                )
                : Number(
                    item.employee?.basic_rate ?? 0,
                ) / 26;

        const basicPay = Number(
            item.basic_pay ?? 0,
        );

        const overtimePay = Number(
            item.overtime_pay ?? 0,
        );

        const holidayPay = Number(
            item.holiday_pay ?? 0,
        );

        const nightDiff = Number(
            item.night_diff ?? 0,
        );

        /*
         * COLA is intentionally ZERO.
         *
         * No COLA calculation was requested.
         */
        const cola = 0;

        /*
         * Tardy is a DEDUCTION.
         *
         * It comes from the newly-added payroll_items
         * tardy_deduction column.
         */
        const tardyDeduction = Number(
            item.tardy_deduction ?? 0,
        );

        const philhealth = Number(
            item.philhealth_deduction ?? 0,
        );

        const pagibig = Number(
            item.pagibig_deduction ?? 0,
        );

        const sss = Number(
            item.sss_deduction ?? 0,
        );

        /*
         * These columns are currently not configured
         * in PayrollItem, so they remain zero.
         *
         * R = SSS Loan
         * S = Pag-IBIG Loan
         * T = Cash Advance
         */
        const sssLoan = 0;
        const pagibigLoan = 0;
        const cashAdvance = 0;

        /*
         * Others contains the existing miscellaneous
         * deductions.
         */
        const others =
            Number(
                item.other_deductions ?? 0,
            ) +
            Number(
                item.tax_deduction ?? 0,
            ) +
            Number(
                item.leave_deduction ?? 0,
            );

        /*
         * IMPORTANT:
         *
         * "Total Earnings" is the basic salary portion.
         *
         * It is NOT added again as another gross amount.
         *
         * Therefore:
         *
         * H = Basic Salary
         *
         * N = H + COLA + OT + Holiday + NSD
         */
        const totalEarnings = basicPay;

        /*
         * Gross earnings.
         *
         * Tardy is NOT included here.
         */
        const totalGrossEarnings =
            totalEarnings +
            cola +
            overtimePay +
            holidayPay +
            nightDiff;

        /*
         * Total deductions.
         *
         * Tardy is explicitly included.
         */
        const totalDeductions =
            tardyDeduction +
            philhealth +
            pagibig +
            sss +
            sssLoan +
            pagibigLoan +
            cashAdvance +
            others;

        /*
         * Net earnings.
         */
        const netPay =
            totalGrossEarnings -
            totalDeductions;

        /*
         * Push RAW values.
         *
         * Formulas will be applied AFTER worksheet creation.
         */
        rows.push([
            index + 1,

            item.employee?.employee_id ??
            item.employee_id,

            item.employee?.full_name ?? '',

            '-',

            /*
             * E - No. of Days
             */
            Number(
                item.present_days ?? 0,
            ),

            /*
             * F - Rate
             *
             * NUMERIC, not ₱ string.
             */
            rate,

            /*
             * G - Basic Salary
             */
            basicPay,

            /*
             * H - Total Earnings
             *
             * Initial numeric value.
             * Replaced with Excel formula later.
             */
            totalEarnings,

            /*
             * I - COLA
             *
             * Explicitly zero.
             */
            cola,

            /*
             * J - Tardy
             */
            tardyDeduction,

            /*
             * K - Overtime
             */
            overtimePay,

            /*
             * L - Holiday
             */
            holidayPay,

            /*
             * M - Night Shift
             */
            nightDiff,

            /*
             * N - Total Gross
             */
            totalGrossEarnings,

            /*
             * O - PhilHealth
             */
            philhealth,

            /*
             * P - Pag-IBIG
             */
            pagibig,

            /*
             * Q - SSS
             */
            sss,

            /*
             * R - SSS Loan
             */
            sssLoan,

            /*
             * S - Pag-IBIG Loan
             */
            pagibigLoan,

            /*
             * T - Cash Advance
             */
            cashAdvance,

            /*
             * U - Others
             */
            others,

            /*
             * V - Total Deductions
             */
            totalDeductions,

            /*
             * W - Net Earnings
             */
            netPay,

            /*
             * X - Signature
             */
            '',
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Worksheet
    |--------------------------------------------------------------------------
    */

    const worksheet =
        XLSX.utils.aoa_to_sheet(rows);

    /*
    |--------------------------------------------------------------------------
    | Excel Formulas
    |--------------------------------------------------------------------------
    |
    | We now apply REAL Excel formulas.
    |
    | This means if someone changes:
    |
    | - Basic Salary
    | - COLA
    | - Tardy
    | - OT
    | - Holiday
    | - NSD
    | - deductions
    |
    | Excel will recalculate the payroll.
    |
    |--------------------------------------------------------------------------
    */

    items.forEach((_, index) => {
        /*
         * Excel employee rows start at 4.
         */
        const row = 4 + index;

        /*
         * H - Total Earnings
         *
         * Basic Salary only.
         *
         * We do NOT include COLA here because COLA
         * is positioned after Total Earnings.
         */
        worksheet[`H${row}`] = {
            t: 'n',
            f: `G${row}`,
        };

        /*
         * I - COLA
         *
         * No calculation.
         *
         * Explicitly zero.
         */
        worksheet[`I${row}`] = {
            t: 'n',
            v: 0,
        };

        /*
         * N - Total Gross Earning
         *
         * Basic/Total Earnings
         * + COLA
         * + OT
         * + Holiday
         * + NSD
         */
        worksheet[`N${row}`] = {
            t: 'n',
            f: `H${row}+I${row}+K${row}+L${row}+M${row}`,
        };

        /*
         * V - Total Deductions
         *
         * Tardy
         * + PhilHealth
         * + Pag-IBIG
         * + SSS
         * + SSS Loan
         * + Pag-IBIG Loan
         * + Cash Advance
         * + Others
         */
        worksheet[`V${row}`] = {
            t: 'n',
            f: `J${row}+O${row}+P${row}+Q${row}+R${row}+S${row}+T${row}+U${row}`,
        };

        /*
         * W - Total Net Earnings
         *
         * Gross - deductions
         */
        worksheet[`W${row}`] = {
            t: 'n',
            f: `N${row}-V${row}`,
        };
    });

    /*
    |--------------------------------------------------------------------------
    | Footer / Totals
    |--------------------------------------------------------------------------
    */

    const footerRow =
        4 + items.length;

    /*
     * Footer values.
     *
     * We initially create the row with numeric values.
     * Then replace calculated columns with SUM formulas.
     */
    rows.push([
        'Total',
        '',
        '',
        '',

        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,

        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,

        '',
    ]);

    /*
     * Make sure footer exists in worksheet.
     *
     * Since worksheet was created before the footer was pushed,
     * add the footer cells directly.
     */
    worksheet[`A${footerRow}`] = {
        t: 's',
        v: 'Total',
    };

    /*
     * Numeric totals.
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

    numericColumns.forEach((columnName) => {
        if (items.length === 0) {
            worksheet[`${columnName}${footerRow}`] = {
                t: 'n',
                v: 0,
            };

            return;
        }

        worksheet[
            `${columnName}${footerRow}`
        ] = {
            t: 'n',
            f: `SUM(${columnName}4:${columnName}${footerRow - 1})`,
        };
    });

    /*
     * Footer signature.
     */
    worksheet[`X${footerRow}`] = {
        t: 's',
        v: '',
    };

    /*
    |--------------------------------------------------------------------------
    | Merges
    |--------------------------------------------------------------------------
    */

    worksheet['!merges'] = [
        /*
         * A-D
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
         *
         * E:N
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
         *
         * O:V
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
         * Total Net Earnings
         *
         * W
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
         * Signature
         *
         * X
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
         * Earnings subheaders.
         *
         * E:N
         */
        ...Array.from(
            {
                length: 10,
            },
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
         *
         * O:Q
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
         *
         * R:S
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
         *
         * T
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
         * Others
         *
         * U
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
         *
         * V
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
    | Employee Styling
    |--------------------------------------------------------------------------
    */

    items.forEach((_, index) => {
        const row =
            3 + index;

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
                cellStyle(
                    shaded,
                    {
                        bold:
                            columnIndex === 1 ||
                            columnIndex === 13 ||
                            columnIndex === 21 ||
                            columnIndex === 22,

                        left:
                            columnIndex === 2 ||
                            columnIndex === 3,
                    },
                );
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
    |
    | Currency columns:
    |
    | F Rate
    | G Basic
    | H Total Earnings
    | I COLA
    | J Tardy
    | K OT
    | L Holiday
    | M NSD
    | N Gross
    | O-V deductions
    | W Net
    |
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
     * Employee currency formatting.
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
     * Footer currency formatting.
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
    | Extend Sheet Range to Include Footer
    |--------------------------------------------------------------------------
    |
    | aoa_to_sheet() computed !ref before the footer row existed, so without
    | this the footer cells are outside the range Excel reads and get
    | dropped from the export.
    |
    |--------------------------------------------------------------------------
    */

    worksheet['!ref'] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: footerRow - 1, c: COLUMN_COUNT - 1 },
    });

    /*
    |--------------------------------------------------------------------------
    | Column Widths
    |--------------------------------------------------------------------------
    */

    worksheet['!cols'] = [
        { wch: 5 },   // A No.
        { wch: 10 },  // B ID
        { wch: 24 },  // C Name
        { wch: 16 },  // D Department

        { wch: 10 },  // E Days
        { wch: 10 },  // F Rate
        { wch: 12 },  // G Basic
        { wch: 13 },  // H Total Earnings
        { wch: 9 },   // I COLA
        { wch: 10 },  // J Tardy
        { wch: 12 },  // K OT
        { wch: 12 },  // L Holiday
        { wch: 13 },  // M NSD
        { wch: 16 },  // N Gross

        { wch: 12 },  // O PhilHealth
        { wch: 12 },  // P PagIBIG
        { wch: 10 },  // Q SSS
        { wch: 10 },  // R SSS Loan
        { wch: 12 },  // S PagIBIG Loan
        { wch: 13 },  // T Cash Advance
        { wch: 11 },  // U Others
        { wch: 15 },  // V Total Deductions

        { wch: 16 },  // W Net
        { wch: 16 },  // X Signature
    ];

    /*
    |--------------------------------------------------------------------------
    | Row Heights
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