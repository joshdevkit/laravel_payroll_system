import { CalendarClock, ClipboardList, Users } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import {
    PayrollLedgerCard,
    type PayrollSummary,
} from '@/components/dashboard/PayrollLedgerCard';
import { StatCard } from '@/components/dashboard/StatCard';

interface RecentPayrollRun {
    id: string;
    cutoff: string;
    payDate: string;
    netTotal: number;
    status: 'draft' | 'processing' | 'completed' | 'cancelled';
}

interface PendingLeaveRequest {
    id: string;
    employeeName: string;
    leaveType: string;
    days: number;
}

interface Holiday {
    name: string;
    date: string;
}

const formatPeso = (amount: number) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);

const summary: PayrollSummary = {
    cutoffLabel: 'Aug 16 – Aug 31, 2026',
    payDate: 'Sep 5, 2026',
    employeeCount: 24,
    grossPay: 198750,
    bonuses: 12500,
    deductions: 24800,
    netPay: 186450,
};

const recentPayrollRuns: RecentPayrollRun[] = [
    {
        id: 'PR-2026-08-2',
        cutoff: 'Aug 16 – Aug 31, 2026',
        payDate: 'Sep 5, 2026',
        netTotal: 186450,
        status: 'processing',
    },
    {
        id: 'PR-2026-08-1',
        cutoff: 'Aug 1 – Aug 15, 2026',
        payDate: 'Aug 20, 2026',
        netTotal: 181920,
        status: 'completed',
    },
    {
        id: 'PR-2026-07-2',
        cutoff: 'Jul 16 – Jul 31, 2026',
        payDate: 'Aug 5, 2026',
        netTotal: 179680,
        status: 'completed',
    },
];

const pendingLeaveRequests: PendingLeaveRequest[] = [
    {
        id: 'leave-001',
        employeeName: 'Joshua Mendoza Pacho',
        leaveType: 'Vacation Leave',
        days: 2,
    },
    {
        id: 'leave-002',
        employeeName: 'Marlon Alegre',
        leaveType: 'Sick Leave',
        days: 1,
    },
    {
        id: 'leave-003',
        employeeName: 'Maria Santos',
        leaveType: 'Vacation Leave',
        days: 3,
    },
];

const upcomingHolidays: Holiday[] = [
    { name: 'National Heroes Day', date: 'Aug 31, 2026' },
    { name: 'Ninoy Aquino Day', date: 'Aug 21, 2026' },
    { name: 'Bonifacio Day', date: 'Nov 30, 2026' },
];

export default function Index() {
    return (
        <div className="min-h-svh bg-background font-sans">
            <Navbar />

            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
                <div>
                    <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        Dashboard
                    </p>
                    <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
                        Good day, Admin
                    </h1>
                </div>

                <div className="mt-8">
                    <PayrollLedgerCard summary={summary} />
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard icon={Users} label="Employees" value="24" hint="Active records" />
                    <StatCard icon={ClipboardList} label="Pending leave requests" value="3" hint="Awaiting your approval" />
                    <StatCard icon={CalendarClock} label="Next holiday" value="National Heroes Day" hint="Aug 31, 2026" />
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <section className="overflow-hidden rounded-lg border bg-card text-card-foreground lg:col-span-2">
                        <div className="p-6">
                            <h2 className="font-display text-base font-semibold">Recent payroll runs</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-y bg-muted/30 text-left">
                                        <th className="px-6 py-3 font-medium">Cutoff</th>
                                        <th className="px-6 py-3 font-medium">Pay date</th>
                                        <th className="px-6 py-3 text-right font-medium">Net total</th>
                                        <th className="px-6 py-3 text-right font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentPayrollRuns.map((run) => (
                                        <tr key={run.id} className="border-b last:border-0">
                                            <td className="px-6 py-4">{run.cutoff}</td>
                                            <td className="px-6 py-4 text-muted-foreground">{run.payDate}</td>
                                            <td className="px-6 py-4 text-right font-mono tabular-nums">{formatPeso(run.netTotal)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize">{run.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <div className="flex flex-col gap-6">
                        <section className="rounded-lg border bg-card text-card-foreground">
                            <div className="p-6 pb-3">
                                <h2 className="font-display text-base font-semibold">Pending leave</h2>
                            </div>
                            <div className="space-y-3 px-6 pb-6">
                                {pendingLeaveRequests.map((request, index) => (
                                    <div key={request.id}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-medium">{request.employeeName}</p>
                                                <p className="text-xs text-muted-foreground">{request.leaveType} · {request.days}d</p>
                                            </div>
                                            <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-primary">pending</span>
                                        </div>
                                        {index < pendingLeaveRequests.length - 1 && <div className="mt-3 border-t" />}
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-lg border bg-card text-card-foreground">
                            <div className="p-6 pb-3">
                                <h2 className="font-display text-base font-semibold">Upcoming holidays</h2>
                            </div>
                            <div className="space-y-3 px-6 pb-6">
                                {upcomingHolidays.map((holiday, index) => (
                                    <div key={`${holiday.name}-${holiday.date}`}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-medium">{holiday.name}</p>
                                                <p className="text-xs text-muted-foreground">{holiday.date}</p>
                                            </div>
                                            <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        </div>
                                        {index < upcomingHolidays.length - 1 && <div className="mt-3 border-t" />}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
