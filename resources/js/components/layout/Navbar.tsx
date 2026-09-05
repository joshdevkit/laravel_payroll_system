import { useEffect, useRef, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    CalendarClock,
    CalendarRange,
    LayoutDashboard,
    LockKeyhole,
    LogOut,
    Moon,
    ShieldCheck,
    Sun,
    Settings2,
    UserRound,
    Users,
    Wallet,
} from 'lucide-react';

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Employees', href: '/employees', icon: Users },
    { label: 'Scheduling', href: '/scheduling', icon: CalendarRange },
    { label: 'Payroll Register', href: '/payroll', icon: Wallet },
    { label: 'Deduction', href: '/deductions', icon: ShieldCheck },
    { label: 'Holidays', href: '/holidays', icon: CalendarClock },
    { label: 'Settings', href: '/settings', icon: Settings2 },
];

export function Navbar() {
    const { props, url } = usePage();
    const auth = props.auth as { user: { name: string; email: string } } | undefined;
    const [open, setOpen] = useState(false);
    const [dark, setDark] = useState(false);
    const accountMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');

        const isDark =
            savedTheme === 'dark' ||
            (!savedTheme &&
                window.matchMedia('(prefers-color-scheme: dark)').matches);

        document.documentElement.classList.toggle('dark', isDark);
        setDark(isDark);
    }, []);

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                accountMenuRef.current &&
                !accountMenuRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    const displayName =
        auth?.user?.name ||
        auth?.user?.email?.split('@')[0] ||
        'Admin';

    const initials = displayName
        .split(' ')
        .filter(Boolean)
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
        setOpen(false);
        router.post('/logout');
    };

    const isActive = (href: string) => {
        const pathname = new URL(url, window.location.origin).pathname;

        return (
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href + '/'))
        );
    };

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
                            const active = isActive(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${active
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
                    <div ref={accountMenuRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setOpen((current) => !current)}
                            className={`group rounded-full ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${open ? 'ring-2 ring-primary/30 ring-offset-2' : ''}`}
                            aria-label="Open account menu"
                            aria-expanded={open}
                        >
                            <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/50 bg-amber-100 text-xs font-bold text-amber-900 shadow-sm transition-colors group-hover:border-amber-500 dark:bg-amber-500/15 dark:text-amber-100">
                                {initials}
                                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
                            </span>
                        </button>

                        {open && (
                            <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[290px] overflow-hidden rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-xl shadow-black/10 dark:shadow-black/30">
                                {/* Account identity */}
                                <div className="border-b bg-amber-50/70 px-4 py-4 dark:bg-amber-500/[0.07]">
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber-500/50 bg-amber-100 text-sm font-bold text-amber-900 dark:bg-amber-500/15 dark:text-amber-100">
                                            {initials}
                                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-popover bg-emerald-500" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold">
                                                {displayName}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {auth?.user?.email || 'Payroll account'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Account active
                                    </div>
                                </div>

                                {/* Account */}
                                <div className="p-2">
                                    <p className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                                        Account
                                    </p>

                                    <Link
                                        href="/profile"
                                        onClick={() => setOpen(false)}
                                        className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-amber-50 dark:hover:bg-amber-500/10"
                                    >
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors group-hover:border-amber-500/40 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                                            <UserRound className="h-4 w-4" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-sm font-medium">
                                                Profile
                                            </span>
                                            <span className="block truncate text-[11px] text-muted-foreground">
                                                Update your personal information
                                            </span>
                                        </span>
                                    </Link>

                                    <Link
                                        href="/profile/password"
                                        onClick={() => setOpen(false)}
                                        className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-amber-50 dark:hover:bg-amber-500/10"
                                    >
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors group-hover:border-amber-500/40 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                                            <LockKeyhole className="h-4 w-4" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-sm font-medium">
                                                Password &amp; Security
                                            </span>
                                            <span className="block truncate text-[11px] text-muted-foreground">
                                                Change your account password
                                            </span>
                                        </span>
                                    </Link>
                                </div>

                                {/* Appearance */}
                                <div className="border-t p-2">
                                    <p className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                                        Appearance
                                    </p>

                                    <button
                                        type="button"
                                        onClick={toggleTheme}
                                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-amber-50 dark:hover:bg-amber-500/10"
                                    >
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                                            {dark ? (
                                                <Sun className="h-4 w-4" />
                                            ) : (
                                                <Moon className="h-4 w-4" />
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-medium">
                                                {dark ? 'Light mode' : 'Dark mode'}
                                            </span>
                                            <span className="block text-[11px] text-muted-foreground">
                                                Switch the application appearance
                                            </span>
                                        </span>
                                        <span className="rounded-full border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                            {dark ? 'Dark' : 'Light'}
                                        </span>
                                    </button>
                                </div>

                                {/* Sign out */}
                                <div className="border-t p-2">
                                    <button
                                        type="button"
                                        onClick={logout}
                                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-destructive transition-colors hover:bg-destructive/10"
                                    >
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-destructive/20 bg-destructive/5">
                                            <LogOut className="h-4 w-4" />
                                        </span>
                                        <span>
                                            <span className="block text-sm font-medium">
                                                Sign out
                                            </span>
                                            <span className="block text-[11px] text-muted-foreground">
                                                End your current session
                                            </span>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Keep the standalone theme button for the main navbar */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Toggle theme"
                    >
                        {dark ? (
                            <Sun className="h-4 w-4" />
                        ) : (
                            <Moon className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>

            <nav className="flex items-center gap-1 overflow-x-auto border-t px-4 py-2 md:hidden">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${active
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </header>
    );
}
