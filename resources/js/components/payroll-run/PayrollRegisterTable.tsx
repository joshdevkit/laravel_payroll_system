import { Link } from '@inertiajs/react';
import type { PayrollItem } from './types';
import { num, peso } from './payrollRunUtils';

type Props = {
    items: PayrollItem[];
};

type PayrollItemWithCola = PayrollItem & {
    cola?: number | string | null;
};

export function PayrollRegisterTable({ items }: Props) {
    const th =
        'border border-black/70 dark:border-white/15 px-2 py-1.5 font-semibold uppercase tracking-tight whitespace-nowrap';

    const td =
        'border border-black/20 dark:border-white/10 px-2 py-1 tabular-nums text-foreground';

    const sum = (fn: (item: PayrollItem) => number) =>
        items.reduce((total, item) => total + fn(item), 0);

    const colaOf = (item: PayrollItem) =>
        Number((item as PayrollItemWithCola).cola ?? 0);

    const othersEarningsOf = (item: PayrollItem) =>
        colaOf(item) +
        Number(item.overtime_pay ?? 0) +
        Number(item.holiday_pay ?? 0) +
        Number(item.night_diff ?? 0);
    
    const totalEarnings = (item: PayrollItem) =>
        Number(item.basic_pay) - Number(item.tardy_deduction);
    
    const totalGross = (item: PayrollItem) =>
        totalEarnings(item) +
        Number(item.overtime_pay ?? 0) +
        Number(item.holiday_pay ?? 0) +
        Number(item.night_diff ?? 0) +
        colaOf(item);

    return (
        <div className="hidden min-w-[1850px] md:block">
            <table className="w-full border-collapse text-[11px] leading-tight">
                <thead>
                    <tr className="bg-amber-400 text-black dark:bg-amber-500/20 dark:text-amber-100">
                        <th rowSpan={3} className={th}>No.</th>
                        <th rowSpan={3} className={th}>ID No.</th>
                        <th rowSpan={3} className={`${th} min-w-[180px] text-left`}>Employee Name</th>
                        <th rowSpan={3} className={`${th} min-w-[140px] text-left`}>Department</th>

                        <th colSpan={10} className={th}>Earnings</th>
                        <th colSpan={8} className={th}>Deductions</th>
                        <th rowSpan={3} className={th}>Others</th>
                        <th rowSpan={3} className={th}>Total Net Earnings</th>
                        <th rowSpan={3} className={th}>Signature</th>
                    </tr>

                    <tr className="bg-amber-400 text-black dark:bg-amber-500/20 dark:text-amber-100">
                        <th rowSpan={2} className={th}>No. of Days</th>
                        <th rowSpan={2} className={th}>Rate</th>
                        <th rowSpan={2} className={th}>Basic Salary</th>
                        <th rowSpan={2} className={th}>Tardy</th>
                        <th rowSpan={2} className={th}>Total Earnings</th>
                        <th rowSpan={2} className={th}>COLA</th>
                        <th rowSpan={2} className={th}>Overtime Pay</th>
                        <th rowSpan={2} className={th}>Holiday Pay</th>
                        <th rowSpan={2} className={th}>Night Shift Pay</th>
                        <th rowSpan={2} className={th}>Total Gross Earning</th>

                        <th colSpan={3} className={th}>Contribution</th>
                        <th colSpan={2} className={th}>Loans</th>
                        <th rowSpan={2} className={th}>Cash Advance</th>
                        <th rowSpan={2} className={th}>Others</th>
                        <th rowSpan={2} className={th}>Total Deductions</th>
                    </tr>

                    <tr className="bg-amber-400 text-black dark:bg-amber-500/20 dark:text-amber-100">
                        <th className={th}>PhilHealth</th>
                        <th className={th}>Pag-IBIG</th>
                        <th className={th}>SSS</th>
                        <th className={th}>SSS</th>
                        <th className={th}>Pag-IBIG</th>
                    </tr>
                </thead>

                <tbody>
                    {items.map((item, index) => {
                        const rate =
                            item.employee?.rate_type === 'daily'
                                ? Number(item.employee.daily_rate ?? item.employee.basic_rate ?? 0)
                                : Number(item.employee?.basic_rate ?? 0) / 26;

                        const tardyDeduction = Number(item.tardy_deduction ?? 0);
                        const cola = colaOf(item);

                        const grossEarnings =
                            Number(item.basic_pay ?? 0) +
                            Number(item.overtime_pay ?? 0) +
                            Number(item.holiday_pay ?? 0) +
                            Number(item.night_diff ?? 0) +
                            Number(item.leave_pay ?? 0) +
                            Number(item.bonus ?? 0);

                        const earnings =
                            item.total_earnings != null
                                ? Number(item.total_earnings)
                                : grossEarnings;

                        const deductionOthers =
                            Number(item.other_deductions ?? 0) +
                            Number(item.tax_deduction ?? 0) +
                            Number(item.leave_deduction ?? 0);

                        const deductions =
                            item.total_deductions != null
                                ? Number(item.total_deductions)
                                : tardyDeduction +
                                    Number(item.sss_deduction ?? 0) +
                                    Number(item.philhealth_deduction ?? 0) +
                                    Number(item.pagibig_deduction ?? 0) +
                                    deductionOthers;

                        const othersEarnings = othersEarningsOf(item);

                        const netPay =
                            item.net_pay != null
                                ? Number(item.net_pay)
                                : earnings + cola - deductions;

                        return (
                            <tr
                                key={item.id}
                                className="align-top text-center odd:bg-white even:bg-amber-50/40 dark:odd:bg-transparent dark:even:bg-amber-500/5"
                            >
                                <td className={td}>{index + 1}</td>
                                <td className={`${td} font-semibold`}>
                                    {item.employee?.employee_id ?? item.employee_id}
                                </td>
                                <td className={`${td} text-left font-medium`}>
                                    <Link
                                        href={`/employees/${item.employee?.id}/attendance`}
                                        target="_blank"
                                        className="underline-offset-2 hover:underline"
                                    >
                                        {item.employee?.full_name}
                                    </Link>
                                </td>
                                <td className={`${td} text-left`}>-</td>

                                <td className={td}>{item.present_days}</td>
                                <td className={td}>{rate ? peso(rate) : '-'}</td>
                                <td className={td}>{num(item.basic_pay)}</td>
                                <td className={td}>{tardyDeduction ? num(tardyDeduction) : '-'}</td>
                                <td className={`${td} font-medium`}>{totalEarnings(item).toFixed(2)}</td>
                                <td className={td}>{cola ? num(cola) : '-'}</td>
                                <td className={td}>{item.overtime_pay ? num(item.overtime_pay) : '-'}</td>
                                <td className={td}>{item.holiday_pay ? num(item.holiday_pay) : '-'}</td>
                                <td className={td}>{item.night_diff ? num(item.night_diff) : '-'}</td>
                                <td className={`${td} font-medium`}>{totalGross(item).toFixed(2)}</td>

                                <td className={td}>{item.philhealth_deduction ? num(item.philhealth_deduction) : '-'}</td>
                                <td className={td}>{item.pagibig_deduction ? num(item.pagibig_deduction) : '-'}</td>
                                <td className={td}>{item.sss_deduction ? num(item.sss_deduction) : '-'}</td>
                                <td className={td}>-</td>
                                <td className={td}>-</td>
                                <td className={td}>-</td>
                                <td className={td}>{deductionOthers ? num(deductionOthers) : '-'}</td>
                                <td className={td}>{deductions ? num(deductions) : '-'}</td>

                                {/* OTHERS EARNINGS = COLA + OT + Holiday + Night Shift */}
                                <td className={`${td} font-medium`}>
                                    {othersEarnings ? num(othersEarnings) : '-'}
                                </td>

                                <td className={`${td} font-semibold`}>{num(netPay)}</td>
                                <td className={td}></td>
                            </tr>
                        );
                    })}
                </tbody>

                <tfoot>
                    <tr className="bg-amber-200 text-center font-semibold text-black dark:bg-amber-500/15 dark:text-amber-100">
                        <td colSpan={4} className={`${td} text-right`}>Total</td>
                        <td className={td}>{sum((i) => Number(i.present_days ?? 0))}</td>
                        <td className={td}>-</td>
                        <td className={td}>{num(sum((i) => Number(i.basic_pay ?? 0)))}</td>
                        <td className={td}>{num(sum((i) => Number(i.tardy_deduction ?? 0)))}</td>
                        <td className={td}>{num(sum((i) => Number(i.total_earnings ?? 0)))}</td>
                        <td className={td}>{num(sum(colaOf))}</td>
                        <td className={td}>{num(sum((i) => Number(i.overtime_pay ?? 0)))}</td>
                        <td className={td}>{num(sum((i) => Number(i.holiday_pay ?? 0)))}</td>
                        <td className={td}>{num(sum((i) => Number(i.night_diff ?? 0)))}</td>
                        <td className={td}>{num(sum((i) => Number(i.total_earnings ?? 0) + colaOf(i)))}</td>

                        <td className={td}>{num(sum((i) => Number(i.philhealth_deduction ?? 0)))}</td>
                        <td className={td}>{num(sum((i) => Number(i.pagibig_deduction ?? 0)))}</td>
                        <td className={td}>{num(sum((i) => Number(i.sss_deduction ?? 0)))}</td>
                        <td className={td}>-</td>
                        <td className={td}>-</td>
                        <td className={td}>-</td>
                        <td className={td}>{num(sum((i) => Number(i.other_deductions ?? 0) + Number(i.tax_deduction ?? 0) + Number(i.leave_deduction ?? 0)))}</td>
                        <td className={td}>{num(sum((i) => Number(i.total_deductions ?? 0)))}</td>

                        {/* OTHERS EARNINGS TOTAL */}
                        <td className={td}>{num(sum(othersEarningsOf))}</td>

                        <td className={td}>{num(sum((i) => Number(i.net_pay ?? 0)))}</td>
                        <td className={td}></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
