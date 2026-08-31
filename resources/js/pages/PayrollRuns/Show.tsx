import { Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Wallet } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { FlashMessage } from '@/components/layout/FlashMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Employee = { id: string; employee_id: string; full_name: string; rate_type: string; daily_rate?: string | null; basic_rate?: string | null };
type Detail = { id: string; work_date: string; segment_no: number; scheduled_minutes: number; worked_minutes: number; late_minutes: number; undertime_minutes: number; overtime_minutes: number; night_diff_minutes: number; is_present: boolean; overtime_pay: string; night_diff_pay: string };
type Item = { id: string; employee: Employee; scheduled_workdays: string; present_days: string; absent_days: string; late_minutes: number; undertime_minutes: number; overtime_minutes: number; night_diff_minutes: number; basic_pay: string; overtime_pay: string; night_diff: string; total_earnings: string; total_deductions: string; net_pay: string; schedule_details: Detail[] };
type PayrollRun = { id: string; cutoff_start: string; cutoff_end: string; pay_date: string; status: string; items: Item[] };

export default function Show({ payrollRun }: { payrollRun: PayrollRun }) {
    return (
        <div className="min-h-svh bg-background font-sans">
            <FlashMessage />
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3"><Link href="/payroll"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
                        <div className="flex flex-wrap items-center gap-2"><Wallet className="h-5 w-5 text-primary" /><h1 className="font-display text-2xl font-bold">Payroll Run</h1><Badge variant="outline">{payrollRun.status}</Badge></div>
                        <p className="mt-1 text-sm text-muted-foreground"><CalendarDays className="mr-1 inline h-4 w-4" />{payrollRun.cutoff_start} → {payrollRun.cutoff_end} · Pay date {payrollRun.pay_date}</p>
                    </div>
                </div>

                <Card className="mt-6">
                    <CardHeader><CardTitle className="text-base">Payroll preview</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full min-w-[1100px] text-sm">
                                <thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="px-3 py-3">Employee</th><th className="px-3 py-3">Scheduled</th><th className="px-3 py-3">Present</th><th className="px-3 py-3">Absent</th><th className="px-3 py-3">Late</th><th className="px-3 py-3">OT</th><th className="px-3 py-3">Basic Pay</th><th className="px-3 py-3">OT Pay</th><th className="px-3 py-3">ND</th><th className="px-3 py-3">Net Pay</th></tr></thead>
                                <tbody className="divide-y">
                                    {payrollRun.items.map((item) => <tr key={item.id} className="hover:bg-muted/30"><td className="px-3 py-3"><div className="font-medium">{item.employee.full_name}</div><div className="text-xs text-muted-foreground">{item.employee.employee_id}</div></td><td className="px-3 py-3">{item.scheduled_workdays}</td><td className="px-3 py-3">{item.present_days}</td><td className="px-3 py-3">{item.absent_days}</td><td className="px-3 py-3">{item.late_minutes}m</td><td className="px-3 py-3">{item.overtime_minutes}m</td><td className="px-3 py-3">₱{item.basic_pay}</td><td className="px-3 py-3">₱{item.overtime_pay}</td><td className="px-3 py-3">₱{item.night_diff}</td><td className="px-3 py-3 font-semibold">₱{item.net_pay}</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {payrollRun.items.map((item) => <Card key={item.id}><CardHeader><CardTitle className="text-sm">{item.employee.full_name}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Worked</span><span>{item.schedule_details.reduce((sum, d) => sum + d.worked_minutes, 0)} min</span></div><div className="flex justify-between"><span className="text-muted-foreground">Undertime</span><span>{item.undertime_minutes} min</span></div><div className="flex justify-between"><span className="text-muted-foreground">Overtime</span><span>{item.overtime_minutes} min</span></div><div className="flex justify-between border-t pt-2 font-semibold"><span>Net pay</span><span>₱{item.net_pay}</span></div></CardContent></Card>)}
                </div>
            </main>
        </div>
    );
}
