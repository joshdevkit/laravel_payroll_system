import { Link } from "@inertiajs/react";
import type { PayrollItem } from "./types";
import { num, peso } from "./payrollRunUtils";

type Props = {
    items: PayrollItem[];
};

type PayrollItemWithCola = PayrollItem & {
    cola?: number | string | null;
};

/*
 * ---------------------------------------------------------
 * HELPERS
 * ---------------------------------------------------------
 */

const number = (value: unknown): number => {
    return Number(value ?? 0);
};

export function PayrollRegisterTable({ items }: Props) {

    const th =
        "border border-black/70 dark:border-white/15 px-2 py-1.5 font-semibold uppercase tracking-tight whitespace-nowrap";

    const td =
        "border border-black/20 dark:border-white/10 px-2 py-1 tabular-nums text-foreground";

    /*
     * ---------------------------------------------------------
     * SUM
     * ---------------------------------------------------------
     */

    const sum = (fn: (item: PayrollItem) => number) =>
        items.reduce((total, item) => total + fn(item), 0);

    /*
     * ---------------------------------------------------------
     * COLA
     * ---------------------------------------------------------
     */

    const colaOf = (item: PayrollItem): number => {
        return number((item as PayrollItemWithCola).cola);
    };

    /*
     * ---------------------------------------------------------
     * TOTAL EARNINGS
     *
     * Basic Salary - Tardy
     * ---------------------------------------------------------
     */

    const totalEarningsOf = (item: PayrollItem): number => {
        return number(item.basic_pay) - number(item.tardy_deduction);
    };

    /*
     * ---------------------------------------------------------
     * TOTAL GROSS EARNING
     *
     * Total Earnings
     * + Overtime
     * + Holiday
     * + Night Shift
     *
     * COLA is NOT included here according to your formula.
     * ---------------------------------------------------------
     */

    const totalGrossEarningOf = (item: PayrollItem): number => {
        return (
            totalEarningsOf(item) +
            number(item.overtime_pay) +
            number(item.holiday_pay) +
            number(item.night_diff) + number(item.cola)
        );
    };

    /*
     * ---------------------------------------------------------
     * TOTAL DEDUCTIONS
     *
     * PhilHealth
     * + Pag-IBIG
     * + SSS
     * + SSS Loan
     * + Pag-IBIG Loan
     * + Cash Advance
     *
     * IMPORTANT:
     * Tardy is NOT included because it was already deducted
     * from Total Earnings.
     *
     * We also do not include tax/leave/other deductions here
     * because your specified payroll register formula does not
     * include them.
     * ---------------------------------------------------------
     */

    const totalDeductionsOf = (item: PayrollItem): number => {
        return (
            number(item.philhealth_deduction) +
            number(item.pagibig_deduction) +
            number(item.sss_deduction) +
            number(item.sss_loan_deduction) +
            number(item.pagibig_loan_deduction) +
            number(item.cash_advance_deduction) +
            number(item.tardy_deduction)
        );
    };

    /*
     * ---------------------------------------------------------
     * OTHERS
     *
     * COLA
     * + Overtime Pay
     * + Holiday Pay
     * + Night Shift Pay
     *
     * This is displayed as a separate subtotal.
     *
     * It is NOT added again to Total Net Earnings because
     * OT/Holiday/Night Shift are already part of Gross Earnings.
     * Only COLA is additionally added to Gross Earnings.
     * ---------------------------------------------------------
     */

    const othersEarningsOf = (item: PayrollItem): number => {
        return (
            colaOf(item) +
            number(item.overtime_pay) +
            number(item.holiday_pay) +
            number(item.night_diff)
        );
    };

    /*
     * ---------------------------------------------------------
     * TOTAL NET EARNINGS
     *
     * Total Gross Earning
     * + COLA
     * - Total Deductions
     * ---------------------------------------------------------
     */

    const totalNetEarningsOf = (item: PayrollItem): number => {
        return (
            totalGrossEarningOf(item)  - totalDeductionsOf(item)
        );
    };

    /*
     * ---------------------------------------------------------
     * FOOTER TOTALS
     * ---------------------------------------------------------
     */

    const footerTotalEarnings = sum(totalEarningsOf);

    const footerTotalGross = sum(totalGrossEarningOf);

    const footerTotalDeductions = sum(totalDeductionsOf);

    const footerOthers = sum(othersEarningsOf);

    const footerNetEarnings = sum(totalNetEarningsOf);

    return (
        <div className="hidden min-w-[1850px] md:block">
            <table className="w-full border-collapse text-[11px] leading-tight">
                <thead>
                    {/* =====================================================
        HEADER LEVEL 1
    ====================================================== */}

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

                        {/* EARNINGS */}
                        <th colSpan={10} className={th}>
                            Earnings
                        </th>

                        {/* DEDUCTIONS */}
                        <th colSpan={7} className={th}>
                            Deductions
                        </th>

                        <th rowSpan={3} className={th}>
                            Others
                        </th>

                        <th rowSpan={3} className={th}>
                            Total Net Earnings
                        </th>

                        <th rowSpan={3} className={th}>
                            Signature
                        </th>
                    </tr>

                    {/* =====================================================
        HEADER LEVEL 2
    ====================================================== */}

                    <tr className="bg-amber-400 text-black dark:bg-amber-500/20 dark:text-amber-100">
                        {/* =======================
            EARNINGS
        ======================== */}

                        <th rowSpan={2} className={th}>
                            No. of Days
                        </th>

                        <th rowSpan={2} className={th}>
                            Rate
                        </th>

                        <th rowSpan={2} className={th}>
                            Basic Salary
                        </th>

                        <th rowSpan={2} className={th}>
                            Tardy
                        </th>

                        <th rowSpan={2} className={th}>
                            Total Earnings
                        </th>

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

                        {/* =======================
            DEDUCTIONS
        ======================== */}

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
                            Total Deductions
                        </th>
                    </tr>

                    {/* =====================================================
        HEADER LEVEL 3
    ====================================================== */}

                    <tr className="bg-amber-400 text-black dark:bg-amber-500/20 dark:text-amber-100">
                        {/* CONTRIBUTION */}
                        <th className={th}>PhilHealth</th>

                        <th className={th}>Pag-IBIG</th>

                        <th className={th}>SSS</th>

                        {/* LOANS */}
                        <th className={th}>SSS Loan</th>

                        <th className={th}>Pag-IBIG Loan</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => {
                        /*
                         * -------------------------------------------------
                         * EMPLOYEE RATE
                         * -------------------------------------------------
                         */

                        const rate =
                            item.employee?.rate_type === "daily"
                                ? number(
                                      item.employee.daily_rate ??
                                          item.employee.basic_rate,
                                  )
                                : number(item.employee?.basic_rate) / 26;

                        /*
                         * -------------------------------------------------
                         * INDIVIDUAL VALUES
                         * -------------------------------------------------
                         */

                        const basicSalary = number(item.basic_pay);

                        const tardyDeduction = number(item.tardy_deduction);

                        const cola = colaOf(item);

                        const overtimePay = number(item.overtime_pay);

                        const holidayPay = number(item.holiday_pay);

                        const nightShiftPay = number(item.night_diff);

                        /*
                         * -------------------------------------------------
                         * CALCULATED PAYROLL VALUES
                         * -------------------------------------------------
                         */

                        const totalEarnings = totalEarningsOf(item);

                        const totalGrossEarning = totalGrossEarningOf(item);

                        const totalDeductions = totalDeductionsOf(item);

                        const othersEarnings = othersEarningsOf(item);

                        const totalNetEarnings = totalNetEarningsOf(item);

                        return (
                            <tr
                                key={item.id}
                                className="align-top text-center odd:bg-white even:bg-amber-50/40 dark:odd:bg-transparent dark:even:bg-amber-500/5"
                            >
                                {/* No. */}
                                <td className={td}>{index + 1}</td>

                                {/* Employee ID */}
                                <td className={`${td} font-semibold`}>
                                    {item.employee?.employee_id ??
                                        item.employee_id}
                                </td>

                                {/* Employee Name */}
                                <td className={`${td} text-left font-medium`}>
                                    <Link
                                        href={`/employees/${item.employee?.id}/attendance`}
                                        target="_blank"
                                        className="underline-offset-2 hover:underline"
                                    >
                                        {item.employee?.full_name}
                                    </Link>
                                </td>

                                {/* Department */}
                                <td className={`${td} text-left`}>
                                    {item.employee?.category?.name ?? "-"}
                                </td>

                                {/* =================================================
                                    EARNINGS
                                ================================================== */}

                                {/* No. of Days */}
                                <td className={td}>{item.present_days}</td>

                                {/* Rate */}
                                <td className={td}>
                                    {rate ? peso(rate) : "-"}
                                </td>

                                {/* Basic Salary */}
                                <td className={td}>{num(basicSalary)}</td>

                                {/* Tardy */}
                                <td className={td}>
                                    {tardyDeduction ? num(tardyDeduction) : "-"}
                                </td>

                                {/* Total Earnings = Basic - Tardy */}
                                <td className={`${td} font-medium`}>
                                    {num(totalEarnings)}
                                </td>

                                {/* COLA */}
                                <td className={td}>{cola ? num(cola) : "-"}</td>

                                {/* Overtime */}
                                <td className={td}>
                                    {overtimePay ? num(overtimePay) : "-"}
                                </td>

                                {/* Holiday */}
                                <td className={td}>
                                    {holidayPay ? num(holidayPay) : "-"}
                                </td>

                                {/* Night Shift */}
                                <td className={td}>
                                    {nightShiftPay ? num(nightShiftPay) : "-"}
                                </td>

                                {/* Total Gross Earning */}
                                <td className={`${td} font-semibold`}>
                                    {num(totalGrossEarning)}
                                </td>

                                {/* =================================================
                                    DEDUCTIONS
                                ================================================== */}

                                {/* PhilHealth */}
                                <td className={td}>
                                    {number(item.philhealth_deduction)
                                        ? num(item.philhealth_deduction)
                                        : "-"}
                                </td>

                                {/* Pag-IBIG */}
                                <td className={td}>
                                    {number(item.pagibig_deduction)
                                        ? num(item.pagibig_deduction)
                                        : "-"}
                                </td>

                                {/* SSS */}
                                <td className={td}>
                                    {number(item.sss_deduction)
                                        ? num(item.sss_deduction)
                                        : "-"}
                                </td>

                                {/* SSS Loan */}
                                <td className={td}>
                                    {number(item.sss_loan_deduction)
                                        ? num(item.sss_loan_deduction)
                                        : "-"}
                                </td>

                                {/* Pag-IBIG Loan */}
                                <td className={td}>
                                    {number(item.pagibig_loan_deduction)
                                        ? num(item.pagibig_loan_deduction)
                                        : "-"}
                                </td>

                                {/* Cash Advance */}
                                <td className={td}>
                                    {number(item.cash_advance_deduction)
                                        ? num(item.cash_advance_deduction)
                                        : "-"}
                                </td>

                                {/* Total Deductions */}
                                <td className={`${td} font-semibold`}>
                                    {num(totalDeductions)}
                                </td>

                                {/* =================================================
                                    OTHERS
                                    
                                    COLA + OT + Holiday + Night Shift
                                ================================================== */}

                                <td className={`${td} font-medium`}>
                                    {othersEarnings ? num(othersEarnings) : "-"}
                                </td>

                                {/* =================================================
                                    TOTAL NET EARNINGS

                                    Gross + COLA - deductions
                                ================================================== */}

                                <td className={`${td} font-bold`}>
                                    {num(totalNetEarnings)}
                                </td>

                                {/* Signature */}
                                <td className={td}></td>
                            </tr>
                        );
                    })}
                </tbody>

                {/* =============================================================
                    FOOTER
                ============================================================= */}

                <tfoot>
                    <tr className="bg-amber-200 text-center font-semibold text-black dark:bg-amber-500/15 dark:text-amber-100">
                        <td colSpan={4} className={`${td} text-right`}>
                            Total
                        </td>

                        {/* Days */}
                        <td className={td}>
                            {sum((i) => number(i.present_days))}
                        </td>

                        {/* Rate */}
                        <td className={td}>-</td>

                        {/* Basic Salary */}
                        <td className={td}>
                            {num(sum((i) => number(i.basic_pay)))}
                        </td>

                        {/* Tardy */}
                        <td className={td}>
                            {num(sum((i) => number(i.tardy_deduction)))}
                        </td>

                        {/* Total Earnings */}
                        <td className={td}>{num(footerTotalEarnings)}</td>

                        {/* COLA */}
                        <td className={td}>{num(sum(colaOf))}</td>

                        {/* Overtime */}
                        <td className={td}>
                            {num(sum((i) => number(i.overtime_pay)))}
                        </td>

                        {/* Holiday */}
                        <td className={td}>
                            {num(sum((i) => number(i.holiday_pay)))}
                        </td>

                        {/* Night Shift */}
                        <td className={td}>
                            {num(sum((i) => number(i.night_diff)))}
                        </td>

                        {/* Total Gross */}
                        <td className={td}>{num(footerTotalGross)}</td>

                        {/* PhilHealth */}
                        <td className={td}>
                            {num(sum((i) => number(i.philhealth_deduction)))}
                        </td>

                        {/* Pag-IBIG */}
                        <td className={td}>
                            {num(sum((i) => number(i.pagibig_deduction)))}
                        </td>

                        {/* SSS */}
                        <td className={td}>
                            {num(sum((i) => number(i.sss_deduction)))}
                        </td>

                        {/* SSS Loan */}
                        <td className={td}>
                            {num(sum((i) => number(i.sss_loan_deduction)))}
                        </td>

                        {/* Pag-IBIG Loan */}
                        <td className={td}>
                            {num(sum((i) => number(i.pagibig_loan_deduction)))}
                        </td>

                        {/* Cash Advance */}
                        <td className={td}>
                            {num(sum((i) => number(i.cash_advance_deduction)))}
                        </td>

                        {/* Total Deductions */}
                        <td className={td}>{num(footerTotalDeductions)}</td>

                        {/* Others */}
                        <td className={td}>{num(footerOthers)}</td>

                        {/* Total Net Earnings */}
                        <td className={`${td} font-bold`}>
                            {num(footerNetEarnings)}
                        </td>

                        {/* Signature */}
                        <td className={td}></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
