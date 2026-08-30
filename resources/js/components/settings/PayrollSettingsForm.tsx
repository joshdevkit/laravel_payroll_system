import { useEffect, useState } from 'react';
import { FileSpreadsheet, Loader2, Settings2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type ToggleProps = { enabled: boolean; onChange: (value: boolean) => void };

function Toggle({ enabled, onChange }: ToggleProps) {
    return (
        <Button type="button" size="sm" variant={enabled ? 'default' : 'outline'} onClick={() => onChange(!enabled)} className="min-w-20" aria-pressed={enabled}>
            {enabled ? 'Enabled' : 'Disabled'}
        </Button>
    );
}

export type PayrollSettings = {
    daily_work_hours: number | string;
    late_enabled: boolean;
    undertime_enabled: boolean;
    overtime_enabled: boolean;
    overtime_multiplier: number | string;
    overtime_threshold_minutes: number;
    late_grace_minutes: number;
    unpaid_break_minutes: number;
    night_diff_enabled: boolean;
    night_diff_start: string;
    night_diff_end: string;
    night_diff_multiplier: number | string;
    holiday_pay_enabled: boolean;
    holiday_regular_multiplier: number | string;
    holiday_special_multiplier: number | string;
    leave_pay_enabled: boolean;
    monthly_daily_rate_divisor: number | string;
    work_schedule: Record<string, unknown> | null;
    shift_options: unknown[] | null;
    attendance_import_start_cell: string;
    schedule_import_start_cell: string;
};

const toggleRows = [
    ['late_enabled', 'Late deductions', 'Deduct pay for recorded late minutes.'],
    ['undertime_enabled', 'Undertime deductions', 'Deduct pay for recorded undertime minutes.'],
    ['overtime_enabled', 'Overtime pay', 'Pay qualifying time worked beyond scheduled hours.'],
    ['night_diff_enabled', 'Night differential', 'Pay actual time worked inside the configured night window.'],
    ['holiday_pay_enabled', 'Holiday pay', 'Apply the configured multiplier based on holiday type.'],
    ['leave_pay_enabled', 'Leave pay', 'Pay approved paid leave.'],
] as const;

export function PayrollSettingsForm({ initialSettings }: { initialSettings: PayrollSettings }) {
    const [settings, setSettings] = useState(initialSettings);
    const [saving, setSaving] = useState(false);

    useEffect(() => setSettings(initialSettings), [initialSettings]);

    const set = <K extends keyof PayrollSettings>(key: K, value: PayrollSettings[K]) => setSettings((current) => ({ ...current, [key]: value }));
    const number = (value: number | string) => Math.max(0, Number(value) || 0);

    const save = () => {
        setSaving(true);
        router.put('/settings', {
            ...settings,
            daily_work_hours: number(settings.daily_work_hours),
            overtime_multiplier: number(settings.overtime_multiplier),
            overtime_threshold_minutes: number(settings.overtime_threshold_minutes),
            late_grace_minutes: number(settings.late_grace_minutes),
            unpaid_break_minutes: number(settings.unpaid_break_minutes),
            night_diff_multiplier: number(settings.night_diff_multiplier),
            holiday_regular_multiplier: number(settings.holiday_regular_multiplier),
            holiday_special_multiplier: number(settings.holiday_special_multiplier),
            monthly_daily_rate_divisor: Math.max(1, number(settings.monthly_daily_rate_divisor)),
            attendance_import_start_cell: settings.attendance_import_start_cell.trim().toUpperCase(),
            schedule_import_start_cell: settings.schedule_import_start_cell.trim().toUpperCase(),
        }, { preserveScroll: true, onFinish: () => setSaving(false) });
    };

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-base"><Settings2 className="h-5 w-5 text-primary" /> Payroll calculation rules</CardTitle>
                <CardDescription>Payroll Run uses these saved values. Employee rates come from the employees table.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <section className="space-y-3">
                    <div><h3 className="text-sm font-semibold">Payroll components</h3><p className="text-xs text-muted-foreground">Enable or disable individual payroll components.</p></div>
                    <div className="divide-y rounded-lg border">
                        {toggleRows.map(([key, title, description]) => (
                            <div key={key} className="flex items-center justify-between gap-4 p-4">
                                <div><p className="text-sm font-medium">{title}</p><p className="text-xs text-muted-foreground">{description}</p></div>
                                <Toggle enabled={Boolean(settings[key])} onChange={(value) => set(key, value as never)} />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <div><h3 className="text-sm font-semibold">Overtime</h3><p className="text-xs text-muted-foreground">Configure the overtime multiplier and minimum qualifying minutes.</p></div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="OT multiplier"><Input type="number" min="0" step="0.05" value={settings.overtime_multiplier} onChange={(e) => set('overtime_multiplier', e.target.value)} /></Field>
                        <Field label="OT threshold (minutes)"><Input type="number" min="0" value={settings.overtime_threshold_minutes} onChange={(e) => set('overtime_threshold_minutes', Number(e.target.value))} /></Field>
                        <Field label="Monthly daily-rate divisor"><Input type="number" min="1" step="0.01" value={settings.monthly_daily_rate_divisor} onChange={(e) => set('monthly_daily_rate_divisor', e.target.value)} /></Field>
                    </div>
                </section>

                <section className="space-y-4">
                    <div><h3 className="text-sm font-semibold">Night differential</h3><p className="text-xs text-muted-foreground">The multiplier is applied to the employee's actual hourly rate.</p></div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="Night start"><Input type="time" value={settings.night_diff_start.slice(0, 5)} onChange={(e) => set('night_diff_start', e.target.value)} /></Field>
                        <Field label="Night end"><Input type="time" value={settings.night_diff_end.slice(0, 5)} onChange={(e) => set('night_diff_end', e.target.value)} /></Field>
                        <Field label="ND multiplier"><Input type="number" min="0" step="0.01" value={settings.night_diff_multiplier} onChange={(e) => set('night_diff_multiplier', e.target.value)} /></Field>
                    </div>
                </section>

                <section className="space-y-4">
                    <div><h3 className="text-sm font-semibold">Holiday pay</h3><p className="text-xs text-muted-foreground">Configure total holiday pay multipliers.</p></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Regular holiday multiplier"><Input type="number" min="0" step="0.05" value={settings.holiday_regular_multiplier} onChange={(e) => set('holiday_regular_multiplier', e.target.value)} /></Field>
                        <Field label="Special non-working holiday multiplier"><Input type="number" min="0" step="0.05" value={settings.holiday_special_multiplier} onChange={(e) => set('holiday_special_multiplier', e.target.value)} /></Field>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-start gap-3"><FileSpreadsheet className="mt-0.5 h-5 w-5 text-primary" /><div><h3 className="text-sm font-semibold">Excel import settings</h3><p className="text-xs text-muted-foreground">Configure where the header row starts in each import file. Data is read from the row immediately below the header.</p></div></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Employee Attendance starting cell" hint="Example: C3 means headers are on row 3 starting in column C."><Input value={settings.attendance_import_start_cell} onChange={(e) => set('attendance_import_start_cell', e.target.value)} placeholder="C3" className="uppercase" /></Field>
                        <Field label="Bulk Schedule starting cell" hint="Example: C3 means headers are on row 3 starting in column C."><Input value={settings.schedule_import_start_cell} onChange={(e) => set('schedule_import_start_cell', e.target.value)} placeholder="C3" className="uppercase" /></Field>
                    </div>
                </section>

                <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save configurations</Button></div>
            </CardContent>
        </Card>
    );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return <label className="grid gap-2 text-sm font-medium">{label}{children}{hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}</label>;
}
