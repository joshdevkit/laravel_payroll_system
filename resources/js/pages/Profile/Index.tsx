import { useForm } from '@inertiajs/react';
import { ArrowRight, Mail, UserRound } from 'lucide-react';

import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type ProfileUser = {
    name: string;
    email: string;
};

type Props = {
    user: ProfileUser;
};

export default function Profile({ user }: Props) {
    const form = useForm({
        name: user.name ?? '',
        email: user.email ?? '',
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        form.put('/profile', {
            preserveScroll: true,
        });
    };

    const initials = (form.data.name || user.email || 'A')
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <>
            <Header title="Profile" description="Manage your payroll system account." />

            <AuthenticatedLayout>
                <div className="mx-auto max-w-5xl">
                    <div className="mb-7">
                        <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                            Account / Profile
                        </p>
                        <div className="mt-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                            <div>
                                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                    Profile settings
                                </h1>
                                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                    Keep your account information accurate for payroll administration and system records.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Card className="overflow-hidden border-border/70 shadow-sm">
                        <div className="border-b bg-muted/30 px-5 py-5 sm:px-7">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border bg-background text-sm font-bold tracking-wide text-primary shadow-sm">
                                    {initials}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                        Account identity
                                    </p>
                                    <h2 className="mt-1 truncate text-lg font-semibold text-foreground">
                                        {form.data.name || 'Your account'}
                                    </h2>
                                    <p className="truncate text-sm text-muted-foreground">
                                        {form.data.email || 'No email address'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <CardContent className="p-5 sm:p-7">
                            <form onSubmit={submit} className="grid gap-7">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        Personal information
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        These details identify the administrator currently signed in to the payroll system.
                                    </p>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <label className="grid gap-2 text-sm font-medium">
                                        Full Name
                                        <div className="relative">
                                            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                className="pl-9"
                                                value={form.data.name}
                                                onChange={(event) => form.setData('name', event.target.value)}
                                                aria-invalid={Boolean(form.errors.name)}
                                                autoComplete="name"
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                        {form.errors.name && (
                                            <span className="text-xs text-destructive">{form.errors.name}</span>
                                        )}
                                    </label>

                                    <label className="grid gap-2 text-sm font-medium">
                                        Email Address
                                        <div className="relative">
                                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                className="pl-9"
                                                type="email"
                                                value={form.data.email}
                                                onChange={(event) => form.setData('email', event.target.value)}
                                                aria-invalid={Boolean(form.errors.email)}
                                                autoComplete="email"
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                        {form.errors.email && (
                                            <span className="text-xs text-destructive">{form.errors.email}</span>
                                        )}
                                    </label>
                                </div>

                                <div className="flex flex-col justify-between gap-4 border-t pt-5 sm:flex-row sm:items-center">
                                    <p className="text-xs text-muted-foreground">
                                        Changes are saved to your account immediately.
                                    </p>
                                    <Button type="submit" disabled={form.processing} className="group">
                                        {form.processing ? 'Saving...' : 'Save Profile'}
                                        {!form.processing && (
                                            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
