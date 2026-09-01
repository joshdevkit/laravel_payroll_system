import { Link } from '@inertiajs/react';
import type { PayrollItem } from './types';
import { num, peso, totalDeductions, totalEarnings } from './payrollRunUtils';

type Props = {
    items: PayrollItem[];
};

export function PayrollRegisterTable({ items }: Props) {
    const th =
        'border border-black/70 dark:border-white/15 px-2 py-1.5 font-semibold uppercase tracking-tight whitespace-nowrap';

    const td =
        'border border-black/20 dark:border-white/10 px-2 py-1 tabular-nums text-foreground';

    const sum = (
        fn: (item: PayrollItem) => number
    ) =>
        items.reduce(
            (total, item) => total + fn(item),
            0
        );

    return (
        <div className="hidden min-w-[1750px] md:block">
            <table className="w-full border-collapse text-[11px] leading-tight">
                <thead>
                    {/* MAIN HEADER */}
                    <tr className="bg-amber-400 text-black dark:bg-amber-500/20 dark:text-amber-100">
                        <th rowSpan={3} className={th}>
                            No.
                        </th>

                        <th rowSpan={3} className={th}>
                            ID No.
                        </th>

                        <th
                            rowSpan={3}
                            className={`${th} min-w-[180px] text-left`}
                        >
                            Employee Name
                        </th>

                        <th
                            rowSpan={3}
                            className={`${th} min-w-[140px] text-left`}
                        >
                            Department
                        </th>

                        <th colSpan={10} className={th}>
                            Earnings
                        </th>

                        <th colSpan={8} className={th}>
                            Deductions
                        </th>

                        <th rowSpan={3} className={th}>
                            Total Net Earnings
                        </th>

                        <th rowSpan={3} className={th}>
                            Signature
                        </th>
                    </tr>

                    {/* EARNINGS / DEDUCTIONS HEADER */}
                    <tr className="bg-amber-400 text-black dark:bg-amber-500/20 dark:text-amber-100">
                        <th rowSpan={2} className={th}>
                            No. of Days
                        </th>

                        <th rowSpan={2} className={th}>
                            Rate
                        </th>

                        <th rowSpan={2} className={th}>
                            Basic Salary
                        </th>

                        {/* TARDY MOVED BEFORE TOTAL EARNINGS */}
                        <th rowSpan={2} className={th}>
                            Tardy
                        </th>

                        {/* TOTAL EARNINGS */}
                        <th rowSpan={2} className={th}>
                            Total Earnings
                        </th>

                        {/* COLA MOVED AFTER TOTAL EARNINGS */}
                        <th rowSpan={2} className={th}>
                            COLA
                        </th>

                        <th rowSpan={2} className={th}>
                            Overtime Pay
                        </th>

                        <th rowSpan={2} className={th}>
                            Holiday Pay
                        </th>

                        <th rowSpan={2} className={th}>
                            Night Shift Pay
                        </th>

                        <th rowSpan={2} className={th}>
                            Total Gross Earning
                        </th>

                        <th colSpan={3} className={th}>
                            Contribution
                        </th>

                        <th colSpan={2} className={th}>
                            Loans
                        </th>

                        <th rowSpan={2} className={th}>
                            Cash Advance
                        </th>

                        <th rowSpan={2} className={th}>
                            Others
                        </th>

                        <th rowSpan={2} className={th}>
                            Total Deductions
                        </th>
                    </tr>

                    {/* DEDUCTION SUB-HEADERS */}
                    <tr className="bg-amber-400 text-black dark:bg-amber-500/20 dark:text-amber-100">
                        <th className={th}>
                            PhilHealth
                        </th>

                        <th className={th}>
                            Pag-IBIG
                        </th>

                        <th className={th}>
                            SSS
                        </th>

                        <th className={th}>
                            SSS
                        </th>

                        <th className={th}>
                            Pag-IBIG
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {items.map((item, index) => {
                        const rate =
                            item.employee?.rate_type === 'daily'
                                ? Number(
                                    item.employee.daily_rate ??
                                    item.employee.basic_rate ??
                                    0
                                )
                                : Number(
                                    item.employee?.basic_rate ?? 0
                                ) / 26;

                        /*
                         * Tardy deduction is now stored directly
                         * in payroll_items.
                         */
                        const tardyDeduction = Number(
                            item.tardy_deduction ?? 0
                        );

                        /*
                         * Total earnings BEFORE deductions.
                         *
                         * This should be:
                         *
                         * Basic Pay
                         * + Overtime
                         * + Holiday
                         * + NSD
                         * + Leave
                         *
                         * Tardy is NOT an earning.
                         */
                        const grossEarnings =
                            Number(
                                item.basic_pay ?? 0
                            ) +
                            Number(
                                item.overtime_pay ?? 0
                            ) +
                            Number(
                                item.holiday_pay ?? 0
                            ) +
                            Number(
                                item.night_diff ?? 0
                            ) +
                            Number(
                                item.leave_pay ?? 0
                            ) +
                            Number(
                                item.bonus ?? 0
                            );

                        /*
                         * Total earnings column.
                         *
                         * Use stored/generated value when available.
                         * Otherwise calculate from components.
                         */
                        const earnings =
                            item.total_earnings != null
                                ? Number(
                                    item.total_earnings
                                )
                                : grossEarnings;

                        /*
                         * COLA.
                         *
                         * No COLA field currently exists in the
                         * PayrollItem shown, so keep it at zero.
                         *
                         * Change this to item.cola once the
                         * payroll_items table has a cola column.
                         */
                        const cola = Number(
                            (item as PayrollItem & {
                                cola?: number | string | null;
                            }).cola ?? 0
                        );

                        /*
                         * Other deductions.
                         */
                        const others =
                            Number(
                                item.other_deductions ?? 0
                            ) +
                            Number(
                                item.tax_deduction ?? 0
                            ) +
                            Number(
                                item.leave_deduction ?? 0
                            );

                        /*
                         * Total deductions.
                         *
                         * This includes tardy.
                         */
                        const deductions =
                            item.total_deductions != null
                                ? Number(
                                    item.total_deductions
                                )
                                : tardyDeduction +
                                Number(
                                    item.sss_deduction ?? 0
                                ) +
                                Number(
                                    item.philhealth_deduction ?? 0
                                ) +
                                Number(
                                    item.pagibig_deduction ?? 0
                                ) +
                                others;

                        /*
                         * Net pay.
                         *
                         * Prefer stored generated net_pay.
                         */
                        const netPay =
                            item.net_pay != null
                                ? Number(item.net_pay)
                                : earnings +
                                cola -
                                deductions;

                        return (
                            <tr
                                key={item.id}
                                className="align-top text-center odd:bg-white even:bg-amber-50/40 dark:odd:bg-transparent dark:even:bg-amber-500/5"
                            >
                                <td className={td}>
                                    {index + 1}
                                </td>

                                <td
                                    className={`${td} font-semibold`}
                                >
                                    {item.employee?.employee_id ??
                                        item.employee_id}
                                </td>

                                <td
                                    className={`${td} text-left font-medium`}
                                >
                                    <Link
                                        href={`/employees/${item.employee?.id}/attendance`}
                                        target="_blank"
                                        className="underline-offset-2 hover:underline"
                                    >
                                        {item.employee?.full_name}
                                    </Link>
                                </td>

                                <td
                                    className={`${td} text-left`}
                                >
                                    -
                                </td>

                                {/* NO. OF DAYS */}
                                <td className={td}>
                                    {item.present_days}
                                </td>

                                {/* RATE */}
                                <td className={td}>
                                    {rate
                                        ? peso(rate)
                                        : '-'}
                                </td>

                                {/* BASIC SALARY */}
                                <td className={td}>
                                    {num(
                                        item.basic_pay
                                    )}
                                </td>

                                {/* TARDY */}
                                <td className={td}>
                                    {tardyDeduction
                                        ? num(
                                            tardyDeduction
                                        )
                                        : '-'}
                                </td>

                                {/* TOTAL EARNINGS */}
                                <td
                                    className={`${td} font-medium`}
                                >
                                    {num(earnings)}
                                </td>

                                {/* COLA */}
                                <td className={td}>
                                    {cola
                                        ? num(cola)
                                        : '-'}
                                </td>

                                {/* OVERTIME */}
                                <td className={td}>
                                    {item.overtime_pay
                                        ? num(
                                            item.overtime_pay
                                        )
                                        : '-'}
                                </td>

                                {/* HOLIDAY */}
                                <td className={td}>
                                    {item.holiday_pay
                                        ? num(
                                            item.holiday_pay
                                        )
                                        : '-'}
                                </td>

                                {/* NIGHT SHIFT */}
                                <td className={td}>
                                    {item.night_diff
                                        ? num(
                                            item.night_diff
                                        )
                                        : '-'}
                                </td>

                                {/* TOTAL GROSS EARNING */}
                                <td
                                    className={`${td} font-medium`}
                                >
                                    {num(
                                        earnings + cola
                                    )}
                                </td>

                                {/* PHILHEALTH */}
                                <td className={td}>
                                    {item.philhealth_deduction
                                        ? num(
                                            item.philhealth_deduction
                                        )
                                        : '-'}
                                </td>

                                {/* PAG-IBIG */}
                                <td className={td}>
                                    {item.pagibig_deduction
                                        ? num(
                                            item.pagibig_deduction
                                        )
                                        : '-'}
                                </td>

                                {/* SSS */}
                                <td className={td}>
                                    {item.sss_deduction
                                        ? num(
                                            item.sss_deduction
                                        )
                                        : '-'}
                                </td>

                                {/* SSS LOAN */}
                                <td className={td}>
                                    -
                                </td>

                                {/* PAG-IBIG LOAN */}
                                <td className={td}>
                                    -
                                </td>

                                {/* CASH ADVANCE */}
                                <td className={td}>
                                    -
                                </td>

                                {/* OTHERS */}
                                <td className={td}>
                                    {others
                                        ? num(others)
                                        : '-'}
                                </td>

                                {/* TOTAL DEDUCTIONS */}
                                <td className={td}>
                                    {deductions
                                        ? num(
                                            deductions
                                        )
                                        : '-'}
                                </td>

                                {/* NET PAY */}
                                <td
                                    className={`${td} font-semibold`}
                                >
                                    {num(netPay)}
                                </td>

                                {/* SIGNATURE */}
                                <td className={td}></td>
                            </tr>
                        );
                    })}
                </tbody>

                <tfoot>
                    <tr className="bg-amber-200 text-center font-semibold text-black dark:bg-amber-500/15 dark:text-amber-100">
                        <td
                            colSpan={4}
                            className={`${td} text-right`}
                        >
                            Total
                        </td>

                        {/* DAYS */}
                        <td className={td}>
                            {sum(
                                (i) =>
                                    Number(
                                        i.present_days ?? 0
                                    )
                            )}
                        </td>

                        {/* RATE */}
                        <td className={td}>
                            -
                        </td>

                        {/* BASIC SALARY */}
                        <td className={td}>
                            {num(
                                sum(
                                    (i) =>
                                        Number(
                                            i.basic_pay ?? 0
                                        )
                                )
                            )}
                        </td>

                        {/* TARDY */}
                        <td className={td}>
                            {num(
                                sum(
                                    (i) =>
                                        Number(
                                            i.tardy_deduction ??
                                            0
                                        )
                                )
                            )}
                        </td>

                        {/* TOTAL EARNINGS */}
                        <td className={td}>
                            {num(
                                sum(
                                    (i) =>
                                        i.total_earnings !=
                                            null
                                            ? Number(
                                                i.total_earnings
                                            )
                                            : Number(
                                                i.basic_pay ??
                                                0
                                            ) +
                                            Number(
                                                i.overtime_pay ??
                                                0
                                            ) +
                                            Number(
                                                i.holiday_pay ??
                                                0
                                            ) +
                                            Number(
                                                i.night_diff ??
                                                0
                                            ) +
                                            Number(
                                                i.leave_pay ??
                                                0
                                            ) +
                                            Number(
                                                i.bonus ?? 0
                                            )
                                )
                            )}
                        </td>

                        {/* COLA */}
                        <td className={td}>
                            {num(
                                sum(
                                    (i) =>
                                        Number(
                                            (i as PayrollItem & {
                                                cola?: number | string | null;
                                            }).cola ?? 0
                                        )
                                )
                            )}
                        </td>

                        {/* OVERTIME */}
                        <td className={td}>
                            {num(
                                sum(
                                    (i) =>
                                        Number(
                                            i.overtime_pay ?? 0
                                        )
                                )
                            )}
                        </td>

                        {/* HOLIDAY */}
                        <td className={td}>
                            {num(
                                sum(
                                    (i) =>
                                        Number(
                                            i.holiday_pay ?? 0
                                        )
                                )
                            )}
                        </td>

                        {/* NIGHT SHIFT */}
                        <td className={td}>
                            {num(
                                sum(
                                    (i) =>
                                        Number(
                                            i.night_diff ?? 0
                                        )
                                )
                            )}
                        </td>

                        {/* TOTAL GROSS EARNING */}
                        <td className={td}>
                            {num(
                                sum(
                                    (i) =>
                                        Number(
                                            i.total_earnings ??
                                            (
                                                Number(
                                                    i.basic_pay ??
                                                    0
                                                ) +
                                                Number(
                                                    i.overtime_pay ??
                                                    0
                                                ) +
                                                Number(
                                                    i.holiday_pay ??
                                                    0
                                                ) +
                                                Number(
                                                    i.night_diff ??
                                                    0
                                                ) +
                                                Number(
                                                    i.leave_pay ??
                                                    0
                                                ) +
                                                Number(
                                                    i.bonus ?? 0
                                                )
                                            )
                                        ) +
                                        Number(
                                            (i as PayrollItem & {
                                                cola?: number | string | null;
                                            }).cola ?? 0
                                        )
                                )
                            )}
                        </td>

                        {/* PHILHEALTH */}
                        <td className={td}>
                            {num(
                                sum(
                                    (i) =>
                                        Number(
                                            i.philhealth_deduction ??
                                            0
                                        )
                                )
                            )}
                        </td>

                        {/* PAG-IBIG */}
                        <td className={td}>
                            {num(
                                sum(
                                    (i) =>
                                        Number(
                                            i.pagibig_deduction ??
                                            0
                                        )
                                )
                            )}
                        </td>

                        {/* SSS */}
                        <td className={td}>
                            {num(
                                sum(
                                    (i) =>
                                        Number(
                                            i.sss_deduction ??
                                            0
                                        )
                                )
                            )}
                        </td>

                        {/* SSS LOAN */}
                        <td className={td}>
                            -
                        </td>

                        {/* PAG-IBIG LOAN */}
                        <td className={td}>
                            -
                        </td>

                        {/* CASH ADVANCE */}
                        <td className={td}>
                            -
                        </td>

                        {/* OTHERS */}
                        <td className={td}>
                            {num(
                                sum(
                                    (i) =>
                                        Number(
                                            i.other_deductions ??
                                            0
                                        ) +
                                        Number(
                                            i.tax_deduction ??
                                            0
                                        ) +
                                        Number(
                                            i.leave_deduction ??
                                            0
                                        )
                                )
                            )}
                        </td>

                        {/* TOTAL DEDUCTIONS */}
                        <td className={td}>
                            {num(
                                sum(
                                    (i) =>
                                        i.total_deductions !=
                                            null
                                            ? Number(
                                                i.total_deductions
                                            )
                                            : Number(
                                                i.tardy_deduction ??
                                                0
                                            ) +
                                            Number(
                                                i.sss_deduction ??
                                                0
                                            ) +
                                            Number(
                                                i.philhealth_deduction ??
                                                0
                                            ) +
                                            Number(
                                                i.pagibig_deduction ??
                                                0
                                            ) +
                                            Number(
                                                i.other_deductions ??
                                                0
                                            ) +
                                            Number(
                                                i.tax_deduction ??
                                                0
                                            ) +
                                            Number(
                                                i.leave_deduction ??
                                                0
                                            )
                                )
                            )}
                        </td>

                        {/* NET PAY */}
                        <td className={td}>
                            {num(
                                sum(
                                    (i) =>
                                        i.net_pay !=
                                            null
                                            ? Number(
                                                i.net_pay
                                            )
                                            : Number(
                                                i.total_earnings ??
                                                0
                                            ) +
                                            Number(
                                                (i as PayrollItem & {
                                                    cola?: number | string | null;
                                                }).cola ?? 0
                                            ) -
                                            Number(
                                                i.total_deductions ??
                                                0
                                            )
                                )
                            )}
                        </td>

                        {/* SIGNATURE */}
                        <td className={td}></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
