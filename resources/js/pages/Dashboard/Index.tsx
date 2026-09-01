import { CalendarClock, ClipboardList, Users } from 'lucide-react';
import { usePage } from '@inertiajs/react';

import { Navbar } from '@/components/layout/Navbar';
import {
    PayrollLedgerCard,
    type PayrollSummary,
} from '@/components/dashboard/PayrollLedgerCard';
import { StatCard } from '@/components/dashboard/StatCard';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

type PayrollStatus =
    | 'draft'
    | 'processing'
    | 'completed'
    | 'cancelled'
    | string;

interface PayrollSummaryData {
    id: string;
    cutoffStart: string | null;
    cutoffEnd: string | null;
    payDate: string | null;
    employeeCount: number;
    grossPay: number;
    bonuses: number;
    deductions: number;
    netPay: number;
    status: PayrollStatus;
}

interface RecentPayrollRun {
    id: string;
    cutoffStart: string | null;
    cutoffEnd: string | null;
    payDate: string | null;
    netTotal: number;
    employeeCount: number;
    status: PayrollStatus;
}

interface Holiday {
    name: string;
    date: string;
    type?: string | null;
}

interface DashboardData {
    employeeCount: number;
    payrollSummary: PayrollSummaryData | null;
    recentPayrollRuns: RecentPayrollRun[];
    pendingLeaveRequests: unknown[];
    upcomingHolidays: Holiday[];
}

type PageProps = {
    auth?: {
        user?: {
            name?: string;
            email?: string;
        };
    };
    dashboard: DashboardData;
};

const formatDate = (value: string | null | undefined) => {
    if (!value) return '—';

    const date = new Date(`${value}T00:00:00`);

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
};

const formatCutoff = (
    start: string | null,
    end: string | null,
) => {
    if (!start || !end) return 'No payroll run yet';

    return `${formatDate(start)} – ${formatDate(end)}`;
};

const formatPeso = (amount: number) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);

export default function Index() {
    const { auth, dashboard } = usePage<PageProps>().props;

    const payrollSummary: PayrollSummary | null =
        dashboard.payrollSummary
            ? {
                cutoffLabel: formatCutoff(
                    dashboard.payrollSummary.cutoffStart,
                    dashboard.payrollSummary.cutoffEnd,
                ),
                payDate: formatDate(
                    dashboard.payrollSummary.payDate,
                ),
                employeeCount:
                    dashboard.payrollSummary.employeeCount,
                grossPay:
                    dashboard.payrollSummary.grossPay,
                bonuses:
                    dashboard.payrollSummary.bonuses,
                deductions:
                    dashboard.payrollSummary.deductions,
                netPay:
                    dashboard.payrollSummary.netPay,
            }
            : null;

    const userName =
        auth?.user?.name?.slice(0, auth?.user?.name.indexOf(' ')) ||
        auth?.user?.email?.split('@')[0];

    const nextHoliday = dashboard.upcomingHolidays[0];

    return (
        <AuthenticatedLayout>
            <>
            <div>
                <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    Dashboard
                </p>
                <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
                    Good day, {userName}!
                </h1>
            </div>

            {payrollSummary ? (
                <div className="mt-8">
                    <PayrollLedgerCard summary={payrollSummary} />
                </div>
            ) : (
                <section className="mt-8 rounded-lg border bg-card p-6 text-card-foreground">
                    <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        Current cutoff
                    </p>
                    <h2 className="mt-1 font-display text-xl font-semibold">
                        No payroll run yet
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Create a payroll run to see payroll totals here.
                    </p>
                </section>
            )}

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                    icon={Users}
                    label="Employees"
                    value={String(dashboard.employeeCount)}
                    hint="Employee records"
                />
                <StatCard
                    icon={ClipboardList}
                    label="Pending leave requests"
                    value="—"
                    hint="Leave workflow not connected"
                />
                <StatCard
                    icon={CalendarClock}
                    label="Next holiday"
                    value={nextHoliday?.name ?? '—'}
                    hint={
                        nextHoliday
                            ? formatDate(nextHoliday.date)
                            : 'No holiday data available'
                    }
                />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="overflow-hidden rounded-lg border bg-card text-card-foreground lg:col-span-2">
                    <div className="p-6">
                        <h2 className="font-display text-base font-semibold">
                            Recent payroll runs
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Live data from payroll runs and payroll items.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        {dashboard.recentPayrollRuns.length === 0 ? (
                            <div className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
                                No payroll runs have been created yet.
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-y bg-muted/30 text-left">
                                        <th className="px-6 py-3 font-medium">
                                            Cutoff
                                        </th>
                                        <th className="px-6 py-3 font-medium">
                                            Pay date
                                        </th>
                                        <th className="px-6 py-3 text-right font-medium">
                                            Net total
                                        </th>
                                        <th className="px-6 py-3 text-right font-medium">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboard.recentPayrollRuns.map(
                                        (run) => (
                                            <tr
                                                key={run.id}
                                                className="border-b last:border-0"
                                            >
                                                <td className="px-6 py-4">
                                                    {formatCutoff(
                                                        run.cutoffStart,
                                                        run.cutoffEnd,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {formatDate(
                                                        run.payDate,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono tabular-nums">
                                                    {formatPeso(
                                                        run.netTotal,
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize">
                                                        {run.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>

                <div className="flex flex-col gap-6">
                    <section className="rounded-lg border bg-card text-card-foreground">
                        <div className="p-6 pb-3">
                            <h2 className="font-display text-base font-semibold">
                                Pending leave
                            </h2>
                        </div>
                        <div className="px-6 pb-6 text-sm text-muted-foreground">
                            Leave data is intentionally not connected yet.
                        </div>
                    </section>

                    <section className="rounded-lg border bg-card text-card-foreground">
                        <div className="p-6 pb-3">
                            <h2 className="font-display text-base font-semibold">
                                Upcoming holidays
                            </h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Philippine holidays from the public holiday API.
                            </p>
                        </div>

                        <div className="space-y-3 px-6 pb-6">
                            {dashboard.upcomingHolidays.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Holiday data is temporarily unavailable.
                                </p>
                            ) : (
                                dashboard.upcomingHolidays.map(
                                    (holiday, index) => (
                                        <div
                                            key={`${holiday.name}-${holiday.date}`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {holiday.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(
                                                            holiday.date,
                                                        )}
                                                    </p>
                                                </div>
                                                <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            </div>
                                            {index <
                                                dashboard.upcomingHolidays
                                                    .length -
                                                1 && (
                                                    <div className="mt-3 border-t" />
                                                )}
                                        </div>
                                    ),
                                )
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </>
        </AuthenticatedLayout>
    );
}
