import { useForm } from '@inertiajs/react';
import { UserRound } from 'lucide-react';

import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

    return (
        <>
            <Header title="Profile" description="Update your account profile." />
            <AuthenticatedLayout>
                <div>
                    <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        Account
                    </p>
                    <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
                        Profile
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Update the name and email address associated with your account.
                    </p>
                </div>

                <Card className="mt-6 max-w-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserRound className="h-4 w-4" />
                            Account Information
                        </CardTitle>
                        <CardDescription>
                            These details are used throughout the payroll system.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={submit} className="grid gap-5">
                            <label className="grid gap-2 text-sm font-medium">
                                Name
                                <Input
                                    value={form.data.name}
                                    onChange={(event) => form.setData('name', event.target.value)}
                                    aria-invalid={Boolean(form.errors.name)}
                                    autoComplete="name"
                                />
                                {form.errors.name && (
                                    <span className="text-xs text-destructive">
                                        {form.errors.name}
                                    </span>
                                )}
                            </label>

                            <label className="grid gap-2 text-sm font-medium">
                                Email
                                <Input
                                    type="email"
                                    value={form.data.email}
                                    onChange={(event) => form.setData('email', event.target.value)}
                                    aria-invalid={Boolean(form.errors.email)}
                                    autoComplete="email"
                                />
                                {form.errors.email && (
                                    <span className="text-xs text-destructive">
                                        {form.errors.email}
                                    </span>
                                )}
                            </label>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </AuthenticatedLayout>
        </>
    );
}
