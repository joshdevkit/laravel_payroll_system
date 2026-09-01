import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    CalendarClock,
    CalendarRange,
    LayoutDashboard,
    LogOut,
    Moon,
    ShieldCheck,
    Sun,
    Settings2,
    Users,
    Wallet,
} from 'lucide-react';

import { useLayoutShell } from '@/components/layout/LayoutShellContext';

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Employees', href: '/employees', icon: Users },
    { label: 'Scheduling', href: '/scheduling', icon: CalendarRange },
    { label: 'Payroll Register', href: '/payroll', icon: Wallet },
    { label: 'SSS Deductions', href: '/sss-deductions', icon: ShieldCheck },
    { label: 'Holidays', href: '/holidays', icon: CalendarClock },
    { label: 'Settings', href: '/settings', icon: Settings2 },
];

type PageProps = {
    auth?: {
        user?: {
            name?: string;
            email?: string;
        };
    };
};

export function Navbar() {
    const inLayoutShell = useLayoutShell();

    if (inLayoutShell) {
        return null;
    }

    const { auth } = usePage<PageProps>().props;
    const [open, setOpen] = useState(false);
    const [dark, setDark] = useState(() =>
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
    );

    const displayName = auth?.user?.name || auth?.user?.email?.split('@')[0] || 'Admin';
    const initials = displayName
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const toggleTheme = () => {
        const next = !dark;
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
        setDark(next);
    };

    const logout = () => {
        router.post('/logout');
    };
    const window = typeof document !== 'undefined' ? document.defaultView : undefined;

    return (
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="mx-auto flex h-16 max-w-full items-center justify-between px-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-8">
                    <Link href="/dashboard" className="shrink-0">
                        <span className="font-display text-sm font-semibold uppercase tracking-[0.15em]">
                            {import.meta.env.VITE_APP_NAME}
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-1 overflow-x-auto md:flex">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active =
                                window?.location.pathname === item.href ||
                                (item.href !== '/dashboard' && window?.location.pathname.startsWith(item.href + '/'));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                        active
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="relative flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setOpen(!open)}
                        className="rounded-full ring-offset-background transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        aria-label="Open account menu"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border bg-muted text-xs font-medium">
                            {initials}
                        </span>
                    </button>

                    {open && (
                        <div className="absolute right-10 top-10 z-50 w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                            <div className="px-3 py-2">
                                <p className="text-sm font-medium">My Account</p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {auth?.user?.email || displayName}
                                </p>
                            </div>
                            <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-muted">
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    )}

                    <button type="button" onClick={toggleTheme} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Toggle theme">
                        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            <nav className="flex items-center gap-1 overflow-x-auto border-t px-4 py-2 md:hidden">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = window?.location.pathname === item.href || (item.href !== '/dashboard' && window?.location.pathname.startsWith(item.href + '/'));
                    return (
                        <Link key={item.href} href={item.href} className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </header>
    );
}
