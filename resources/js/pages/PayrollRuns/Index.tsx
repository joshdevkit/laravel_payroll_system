import { useState } from 'react';
import { Plus } from 'lucide-react';
import { router } from '@inertiajs/react';
import { Navbar } from '@/components/layout/Navbar';
import { FlashMessage } from '@/components/layout/FlashMessage';
import { Button } from '@/components/ui/button';
import { PayrollRunStats } from '@/components/payroll-run/PayrollRunStats';
import { PayrollRunHistory } from '@/components/payroll-run/PayrollRunHistory';
import { CreatePayrollRunDialog, DeletePayrollRunDialog } from '@/components/payroll-run/PayrollRunDialogs';
import type { PayrollRun } from '@/components/payroll-run/types';

export default function PayrollRuns({ payrollRuns }: { payrollRuns: (PayrollRun & { items_count?: number })[] }) {
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<PayrollRun | null>(null);
    const [cutoffStart, setCutoffStart] = useState('');
    const [cutoffEnd, setCutoffEnd] = useState('');
    const [payDate, setPayDate] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const create = () => {
        if (!cutoffStart || !cutoffEnd || !payDate || cutoffEnd < cutoffStart) return;
        setSaving(true);
        router.post('/payroll', { cutoff_start: cutoffStart, cutoff_end: cutoffEnd, pay_date: payDate }, {
            preserveScroll: true,
            onSuccess: () => { setCreateOpen(false); setCutoffStart(''); setCutoffEnd(''); setPayDate(''); },
            onFinish: () => setSaving(false),
        });
    };

    const remove = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/payroll/${deleteTarget.id}`, { preserveScroll: true, onFinish: () => { setDeleting(false); setDeleteOpen(false); setDeleteTarget(null); } });
    };

    const completed = payrollRuns.filter((run) => run.status === 'completed').length;
    const drafts = payrollRuns.filter((run) => run.status === 'draft').length;

    return <div className="min-h-svh bg-background font-sans">
        <FlashMessage /><Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div><p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">Payroll</p><h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">Payroll Register</h1><p className="mt-1 text-sm text-muted-foreground">Create, calculate, review, and confirm payroll for each cutoff period.</p></div>
                <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />New payroll register</Button>
            </header>
            <PayrollRunStats total={payrollRuns.length} drafts={drafts} completed={completed} />
            <PayrollRunHistory runs={payrollRuns} onReview={(run) => router.get(`/payroll/${run.id}`)} onDelete={(run) => { setDeleteTarget(run); setDeleteOpen(true); }} />
        </main>
        <CreatePayrollRunDialog open={createOpen} onOpenChange={setCreateOpen} cutoffStart={cutoffStart} cutoffEnd={cutoffEnd} payDate={payDate} onCutoffStartChange={setCutoffStart} onCutoffEndChange={setCutoffEnd} onPayDateChange={setPayDate} onCreate={create} saving={saving} />
        <DeletePayrollRunDialog open={deleteOpen} onOpenChange={setDeleteOpen} target={deleteTarget} deleting={deleting} onDelete={remove} />
    </div>;
}
