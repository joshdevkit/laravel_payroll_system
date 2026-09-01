import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { FlashMessage } from '@/components/layout/FlashMessage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Employee = {
    id: string;
    employee_id: string;
    full_name: string;
    sss_no?: string | null;
};

type SssDeduction = {
    id: string;
    employee_id: string;
    amount: string | number;
    deduction_schedule: 'every_payroll' | 'first_cutoff' | 'second_cutoff';
    effective_from: string;
    effective_until?: string | null;
    is_active: boolean;
    notes?: string | null;
    employee?: Employee;
};

const scheduleLabels: Record<SssDeduction['deduction_schedule'], string> = {
    every_payroll: 'Every Payroll',
    first_cutoff: '1st Cutoff',
    second_cutoff: '2nd Cutoff',
};

const emptyForm = {
    employee_id: '',
    amount: '',
    deduction_schedule: 'every_payroll' as SssDeduction['deduction_schedule'],
    effective_from: new Date().toISOString().slice(0, 10),
    effective_until: '',
    is_active: true,
    notes: '',
};

export default function Index({ deductions, employees }: { deductions: SssDeduction[]; employees: Employee[] }) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<SssDeduction | null>(null);
    const [form, setForm] = useState(emptyForm);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return deductions;
        return deductions.filter((item) =>
            [item.employee?.full_name, item.employee?.employee_id, item.employee?.sss_no]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term)),
        );
    }, [deductions, search]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setOpen(true);
    };

    const openEdit = (item: SssDeduction) => {
        setEditing(item);
        setForm({
            employee_id: item.employee_id,
            amount: String(item.amount),
            deduction_schedule: item.deduction_schedule,
            effective_from: item.effective_from,
            effective_until: item.effective_until ?? '',
            is_active: item.is_active,
            notes: item.notes ?? '',
        });
        setOpen(true);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => setOpen(false) };
        if (editing) {
            router.put(`/sss-deductions/${editing.id}`, form, options);
        } else {
            router.post('/sss-deductions', form, options);
        }
    };

    const remove = (item: SssDeduction) => {
        if (!window.confirm(`Delete the SSS deduction for ${item.employee?.full_name ?? 'this employee'}?`)) return;
        router.delete(`/sss-deductions/${item.id}`, { preserveScroll: true });
    };

    return (
        <div className="min-h-svh bg-background font-sans">
            <FlashMessage />
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">Payroll</p>
                        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">SSS Deductions</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Choose which employee receives an SSS deduction and when it should be applied.</p>
                    </div>
                    <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add SSS Deduction</Button>
                </div>

                <Card className="mt-6">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-base">Employee deduction schedules</CardTitle>
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee..." className="pl-9" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-sm">
                                <thead className="border-y bg-muted/40 text-left">
                                    <tr>
                                        <th className="px-4 py-3">Employee</th>
                                        <th className="px-4 py-3">SSS No.</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">When to deduct</th>
                                        <th className="px-4 py-3">Effective</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No SSS deduction schedules found.</td></tr>
                                    ) : filtered.map((item) => (
                                        <tr key={item.id} className="border-b last:border-0">
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{item.employee?.full_name ?? 'Unknown employee'}</div>
                                                <div className="text-xs text-muted-foreground">ID: {item.employee?.employee_id ?? item.employee_id}</div>
                                            </td>
                                            <td className="px-4 py-3">{item.employee?.sss_no || '—'}</td>
                                            <td className="px-4 py-3 font-medium">₱{Number(item.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3">{scheduleLabels[item.deduction_schedule]}</td>
                                            <td className="px-4 py-3">{item.effective_from}{item.effective_until ? ` → ${item.effective_until}` : ' → Ongoing'}</td>
                                            <td className="px-4 py-3"><Badge variant={item.is_active ? 'default' : 'secondary'}>{item.is_active ? 'Active' : 'Inactive'}</Badge></td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label="Edit SSS deduction"><Pencil className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => remove(item)} aria-label="Delete SSS deduction"><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </main>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
                    <form onSubmit={submit} className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-xl">
                        <div className="mb-5">
                            <h2 className="text-lg font-semibold">{editing ? 'Edit SSS Deduction' : 'Add SSS Deduction'}</h2>
                            <p className="text-sm text-muted-foreground">Assign the deduction to a specific employee.</p>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-sm font-medium">Employee
                                <select required value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} className="mt-1 flex h-9 w-full rounded-md border bg-background px-3 text-sm">
                                    <option value="">Select employee</option>
                                    {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name} — {employee.employee_id}</option>)}
                                </select>
                            </label>
                            <label className="block text-sm font-medium">SSS deduction amount
                                <Input required min="0" step="0.01" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1" placeholder="500.00" />
                            </label>
                            <label className="block text-sm font-medium">When to deduct
                                <select value={form.deduction_schedule} onChange={(e) => setForm({ ...form, deduction_schedule: e.target.value as SssDeduction['deduction_schedule'] })} className="mt-1 flex h-9 w-full rounded-md border bg-background px-3 text-sm">
                                    <option value="every_payroll">Every Payroll</option>
                                    <option value="first_cutoff">1st Cutoff</option>
                                    <option value="second_cutoff">2nd Cutoff</option>
                                </select>
                            </label>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <label className="block text-sm font-medium">Effective from
                                    <Input required type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} className="mt-1" />
                                </label>
                                <label className="block text-sm font-medium">Effective until
                                    <Input type="date" value={form.effective_until} onChange={(e) => setForm({ ...form, effective_until: e.target.value })} className="mt-1" />
                                </label>
                            </div>
                            <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
                            <label className="block text-sm font-medium">Notes
                                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Optional notes" />
                            </label>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit">{editing ? 'Save Changes' : 'Add Deduction'}</Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
