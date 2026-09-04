import { useForm } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';

import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
            <Header title="Change Password" description="Update your account password." />
            <AuthenticatedLayout>
                <div>
                    <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        Account
                    </p>
                    <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
                        Change Password
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Change your account password. You will need your current password to continue.
                    </p>
                </div>

                <Card className="mt-6 max-w-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="h-4 w-4" />
                            Password Security
                        </CardTitle>
                        <CardDescription>
                            Use a strong password with at least 8 characters.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={submit} className="grid gap-5">
                            <label className="grid gap-2 text-sm font-medium">
                                Current Password
                                <Input
                                    type="password"
                                    value={form.data.current_password}
                                    onChange={(event) => form.setData('current_password', event.target.value)}
                                    aria-invalid={Boolean(form.errors.current_password)}
                                    autoComplete="current-password"
                                />
                                {form.errors.current_password && (
                                    <span className="text-xs text-destructive">
                                        {form.errors.current_password}
                                    </span>
                                )}
                            </label>

                            <label className="grid gap-2 text-sm font-medium">
                                New Password
                                <Input
                                    type="password"
                                    value={form.data.password}
                                    onChange={(event) => form.setData('password', event.target.value)}
                                    aria-invalid={Boolean(form.errors.password)}
                                    autoComplete="new-password"
                                />
                                {form.errors.password && (
                                    <span className="text-xs text-destructive">
                                        {form.errors.password}
                                    </span>
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
                                />
                                {form.errors.password_confirmation && (
                                    <span className="text-xs text-destructive">
                                        {form.errors.password_confirmation}
                                    </span>
                                )}
                            </label>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing ? 'Changing...' : 'Change Password'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </AuthenticatedLayout>
        </>
    );
}
