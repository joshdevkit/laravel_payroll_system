import { useForm } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, KeyRound, LockKeyhole } from 'lucide-react';

import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type PasswordForm = {
    current_password: string;
    password: string;
    password_confirmation: string;
};

export default function Password() {
    const form = useForm<PasswordForm>({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        form.put('/profile/password', {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <>
            <Header title="Change Password" description="Manage your account password and security." />

            <AuthenticatedLayout>
                <div className="mx-auto max-w-5xl">
                    <div className="mb-7">
                        <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                            Account / Security
                        </p>
                        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            Password & security
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            Update your password to keep access to the payroll system secure.
                        </p>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                        <Card className="overflow-hidden border-border/70 shadow-sm">
                            <div className="border-b bg-muted/30 px-5 py-5 sm:px-7">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-background text-primary shadow-sm">
                                        <KeyRound className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                            Authentication
                                        </p>
                                        <h2 className="mt-1 text-lg font-semibold text-foreground">
                                            Change your password
                                        </h2>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Verify your current password before choosing a new one.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <CardContent className="p-5 sm:p-7">
                                <form onSubmit={submit} className="grid gap-6">
                                    <label className="grid gap-2 text-sm font-medium">
                                        Current Password
                                        <div className="relative">
                                            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                className="pl-9"
                                                type="password"
                                                value={form.data.current_password}
                                                onChange={(event) => form.setData('current_password', event.target.value)}
                                                aria-invalid={Boolean(form.errors.current_password)}
                                                autoComplete="current-password"
                                                placeholder="Enter current password"
                                            />
                                        </div>
                                        {form.errors.current_password && (
                                            <span className="text-xs text-destructive">{form.errors.current_password}</span>
                                        )}
                                    </label>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <label className="grid gap-2 text-sm font-medium">
                                            New Password
                                            <Input
                                                type="password"
                                                value={form.data.password}
                                                onChange={(event) => form.setData('password', event.target.value)}
                                                aria-invalid={Boolean(form.errors.password)}
                                                autoComplete="new-password"
                                                placeholder="Enter new password"
                                            />
                                            {form.errors.password && (
                                                <span className="text-xs text-destructive">{form.errors.password}</span>
                                            )}
                                        </label>

                                        <label className="grid gap-2 text-sm font-medium">
                                            Confirm New Password
                                            <Input
                                                type="password"
                                                value={form.data.password_confirmation}
                                                onChange={(event) => form.setData('password_confirmation', event.target.value)}
                                                aria-invalid={Boolean(form.errors.password_confirmation)}
                                                autoComplete="new-password"
                                                placeholder="Repeat new password"
                                            />
                                            {form.errors.password_confirmation && (
                                                <span className="text-xs text-destructive">{form.errors.password_confirmation}</span>
                                            )}
                                        </label>
                                    </div>

                                    <div className="flex flex-col justify-between gap-4 border-t pt-5 sm:flex-row sm:items-center">
                                        <p className="text-xs text-muted-foreground">
                                            Use at least 8 characters and avoid easily guessed passwords.
                                        </p>
                                        <Button type="submit" disabled={form.processing} className="group">
                                            {form.processing ? 'Updating...' : 'Update Password'}
                                            {!form.processing && (
                                                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="h-fit border-border/70 shadow-sm">
                            <CardContent className="p-5">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <h3 className="mt-4 font-semibold text-foreground">
                                    Security checklist
                                </h3>
                                <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
                                    <li className="flex gap-2">
                                        <span className="mt-0.5 text-primary">✓</span>
                                        Use a password you do not reuse elsewhere.
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="mt-0.5 text-primary">✓</span>
                                        Keep your password private and never share it.
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="mt-0.5 text-primary">✓</span>
                                        Make the new password difficult to guess.
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
