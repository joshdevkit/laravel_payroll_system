import { CalendarRange, CheckCircle2, WalletCards } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function PayrollRunStats({ total, drafts, completed }: { total: number; drafts: number; completed: number }) {
    return (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card><CardContent className="flex items-center gap-3 pt-6"><WalletCards className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Total runs</p><p className="text-xl font-semibold">{total}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 pt-6"><CalendarRange className="h-5 w-5" /><div><p className="text-xs text-muted-foreground">Draft runs</p><p className="text-xl font-semibold">{drafts}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 pt-6"><CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /><div><p className="text-xs text-muted-foreground">Completed</p><p className="text-xl font-semibold">{completed}</p></div></CardContent></Card>
        </div>
    );
}
