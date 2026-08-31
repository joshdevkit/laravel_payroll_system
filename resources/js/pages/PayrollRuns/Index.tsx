import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, router } from '@inertiajs/react';
import { CalendarDays, Eye, Plus, Trash2, Wallet } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { FlashMessage } from '@/components/layout/FlashMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export type PayrollRun = {
    id: string;
    cutoff_start: string;
    cutoff_end: string;
    pay_date: string;
    status: string;
    items_count?: number;
};

type Props = { payrollRuns: PayrollRun[] };

export default function PayrollRuns({ payrollRuns }: Props) {
    const [cutoffStart, setCutoffStart] = useState('');
    const [cutoffEnd, setCutoffEnd] = useState('');
    const [payDate, setPayDate] = useState('');
    const [saving, setSaving] = useState(false);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        setSaving(true);
        router.post('/payroll', {
            cutoff_start: cutoffStart,
            cutoff_end: cutoffEnd,
            pay_date: payDate,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setCutoffStart('');
                setCutoffEnd('');
                setPayDate('');
            },
            onFinish: () => setSaving(false),
        });
    };

    const remove = (id: string) => {
        if (!window.confirm('Delete this draft payroll run?')) return;
        router.delete(`/payroll/${id}`, { preserveScroll: true });
    };

    return (
        <div className="min-h-svh bg-background font-sans">
            <FlashMessage />
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
                <div>
                    <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">Payroll</p>
                    <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Payroll Runs</h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        Create and review payroll calculations from schedules and attendance for a cutoff period.
                    </p>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base"><Plus className="h-5 w-5 text-primary" />New payroll run</CardTitle>
                            <CardDescription>Generate a draft from the current payroll settings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <Field label="Cutoff start"><Input type="date" value={cutoffStart} onChange={(e) => setCutoffStart(e.target.value)} required /></Field>
                                <Field label="Cutoff end"><Input type="date" value={cutoffEnd} onChange={(e) => setCutoffEnd(e.target.value)} required /></Field>
                                <Field label="Pay date"><Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} required /></Field>
                                <Button className="w-full" disabled={saving}><Wallet className="mr-2 h-4 w-4" />{saving ? 'Generating…' : 'Create payroll run'}</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Payroll history</CardTitle>
                            <CardDescription>{payrollRuns.length} payroll run{payrollRuns.length === 1 ? '' : 's'}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {payrollRuns.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No payroll runs yet. Create the first draft on the left.</div>
                            ) : (
                                <div className="space-y-3">
                                    {payrollRuns.map((run) => (
                                        <div key={run.id} className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">{run.cutoff_start} → {run.cutoff_end}</span><Badge variant="outline">{run.status}</Badge></div>
                                                <p className="mt-1 text-xs text-muted-foreground">Pay date: {run.pay_date} · {run.items_count ?? 0} employee{run.items_count === 1 ? '' : 's'}</p>
                                            </div>
                                            <div className="flex shrink-0 gap-2">
                                                <Button asChild size="sm"><Link href={`/payroll/${run.id}`}><Eye className="mr-2 h-4 w-4" />Review</Link></Button>
                                                {run.status === 'draft' && <Button type="button" size="sm" variant="outline" onClick={() => remove(run.id)}><Trash2 className="h-4 w-4" /></Button>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return <label className="grid gap-2 text-sm font-medium">{label}{children}</label>;
}
