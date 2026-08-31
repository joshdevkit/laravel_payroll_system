import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PayrollItem } from './types';
import { money, minutes } from './types';

export function PayrollRegisterTable({ items }: { items: PayrollItem[] }) {
    return <div className="overflow-x-auto rounded-lg border"><Table className="min-w-[1450px]"><TableHeader><TableRow>
        <TableHead>Employee</TableHead><TableHead>Scheduled</TableHead><TableHead>Present</TableHead><TableHead>Absent</TableHead><TableHead>Leave</TableHead><TableHead>Late</TableHead><TableHead>Undertime</TableHead><TableHead>OT</TableHead><TableHead>ND</TableHead><TableHead>Basic Pay</TableHead><TableHead>OT Pay</TableHead><TableHead>Holiday</TableHead><TableHead>ND Pay</TableHead><TableHead>Total Earnings</TableHead><TableHead>Total Deductions</TableHead><TableHead className="text-right">Net Pay</TableHead>
    </TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}>
        <TableCell><Link className="font-medium hover:underline" href={`/employees/${item.employee.id}/attendance`} target="_blank">{item.employee.full_name}</Link><div className="text-xs text-muted-foreground">{item.employee.employee_id}</div></TableCell>
        <TableCell>{item.scheduled_workdays}</TableCell><TableCell>{item.present_days}</TableCell><TableCell>{item.absent_days}</TableCell><TableCell>{item.leave_days ?? 0}</TableCell><TableCell>{minutes(item.late_minutes)}</TableCell><TableCell>{minutes(item.undertime_minutes)}</TableCell><TableCell>{minutes(item.overtime_minutes)}</TableCell><TableCell>{minutes(item.night_diff_minutes)}</TableCell><TableCell>{money(item.basic_pay)}</TableCell><TableCell>{money(item.overtime_pay)}</TableCell><TableCell>{money(item.holiday_pay)}</TableCell><TableCell>{money(item.night_diff)}</TableCell><TableCell>{money(item.total_earnings)}</TableCell><TableCell>{money(item.total_deductions)}</TableCell><TableCell className="text-right font-semibold">{money(item.net_pay)}</TableCell>
    </TableRow>)}</TableBody></Table></div>;
}

export function PayrollItemMobileCard({ item, leavePayEnabled }: { item: PayrollItem; leavePayEnabled: boolean }) {
    const worked = item.schedule_details.reduce((sum, detail) => sum + Number(detail.worked_minutes || 0), 0);
    return <div className="rounded-lg border p-4"><div className="flex items-start justify-between gap-3"><div><Link href={`/employees/${item.employee.id}/attendance`} target="_blank" className="font-semibold hover:underline">{item.employee.full_name}</Link><p className="text-xs text-muted-foreground">{item.employee.employee_id}</p></div><Badge variant="outline">{item.present_days} present</Badge></div><div className="mt-4 grid grid-cols-2 gap-2 text-sm"><span className="text-muted-foreground">Worked</span><span className="text-right">{worked} min</span><span className="text-muted-foreground">Late</span><span className="text-right">{item.late_minutes} min</span><span className="text-muted-foreground">Undertime</span><span className="text-right">{item.undertime_minutes} min</span><span className="text-muted-foreground">Overtime</span><span className="text-right">{item.overtime_minutes} min</span><span className="text-muted-foreground">Night diff</span><span className="text-right">{money(item.night_diff)}</span>{leavePayEnabled && <><span className="text-muted-foreground">Leave pay</span><span className="text-right">{money(item.leave_pay)}</span></>}<span className="border-t pt-2 font-semibold">Net pay</span><span className="border-t pt-2 text-right font-semibold">{money(item.net_pay)}</span></div></div>;
}
