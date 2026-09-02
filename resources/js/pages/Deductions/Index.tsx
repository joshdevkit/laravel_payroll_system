import { useMemo, useState } from 'react';

import { Navbar } from '@/components/layout/Navbar';
import { FlashMessage } from '@/components/layout/FlashMessage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { HeartPulse, Landmark, ShieldCheck } from 'lucide-react';

type SssContributionTable = {
    id: number;
    effective_from: string;
    effective_to?: string | null;
    compensation_min: string | number;
    compensation_max?: string | number | null;
    monthly_salary_credit: string | number;
    employee_regular_ss: string | number;
    employee_mpf: string | number;
    employee_total: string | number;
    employer_regular_ss: string | number;
    employer_mpf: string | number;
    employer_ec: string | number;
    employer_total: string | number;
    source?: string | null;
};

type DeductionSection = 'sss' | 'philhealth' | 'pagibig';

const navItems: Array<{
    id: DeductionSection;
    label: string;
    description: string;
    icon: typeof ShieldCheck;
}> = [
    {
        id: 'sss',
        label: 'SSS',
        description: 'Social Security System',
        icon: ShieldCheck,
    },
    {
        id: 'philhealth',
        label: 'PhilHealth',
        description: 'Health insurance contribution',
        icon: HeartPulse,
    },
    {
        id: 'pagibig',
        label: 'Pag-IBIG',
        description: 'Home development mutual fund',
        icon: Landmark,
    },
];

const money = (value: string | number) =>
    Number(value).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const compensationRange = (item: SssContributionTable) => {
    const min = money(item.compensation_min);
    const max = item.compensation_max;

    return max === null || max === undefined
        ? `₱${min} and above`
        : `₱${min} – ₱${money(max)}`;
};

export default function Index({
    sssContributionTables,
}: {
    sssContributionTables: SssContributionTable[];
}) {
    const [section, setSection] = useState<DeductionSection>('sss');
    const [search, setSearch] = useState('');

    const filteredTables = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) {
            return sssContributionTables;
        }

        return sssContributionTables.filter((item) =>
            [
                compensationRange(item),
                item.monthly_salary_credit,
                item.employee_total,
                item.employer_total,
            ].some((value) =>
                String(value).toLowerCase().includes(term)
            )
        );
    }, [search, sssContributionTables]);

    const active = navItems.find((item) => item.id === section)!;
    const ActiveIcon = active.icon;

    return (
        <div className="min-h-svh bg-background font-sans">
            <FlashMessage />
            <Navbar />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
                <div>
                    <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        Payroll
                    </p>
                    <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
                        Deductions
                    </h1>
                    <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                        Configure statutory employee deductions in one place.
                        SSS is calculated automatically from the contribution
                        schedule instead of requiring a manual deduction amount.
                    </p>
                </div>

                <Card className="mt-6 overflow-hidden">
                    <div className="grid min-h-[620px] md:grid-cols-[220px_minmax(0,1fr)]">
                        <aside className="border-b bg-muted/20 p-3 md:border-b-0 md:border-r">
                            <div className="px-2 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Contributions
                                </p>
                            </div>

                            <div className="space-y-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const selected = item.id === section;

                                    return (
                                        <Button
                                            key={item.id}
                                            type="button"
                                            variant={selected ? 'secondary' : 'ghost'}
                                            className="h-auto w-full justify-start px-3 py-3 text-left"
                                            onClick={() => setSection(item.id)}
                                        >
                                            <Icon className="mr-3 h-4 w-4 shrink-0" />
                                            <span className="min-w-0">
                                                <span className="block text-sm font-medium">
                                                    {item.label}
                                                </span>
                                                <span className="block truncate text-xs font-normal text-muted-foreground">
                                                    {item.description}
                                                </span>
                                            </span>
                                        </Button>
                                    );
                                })}
                            </div>
                        </aside>

                        <section className="min-w-0 p-5 sm:p-6">
                            {section === 'sss' ? (
                                <>
                                    <CardHeader className="p-0">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-lg">
                                                        SSS Contribution
                                                    </CardTitle>
                                                    <Badge>Automatic</Badge>
                                                </div>
                                                <CardDescription className="mt-1 max-w-2xl">
                                                    Employee contributions are matched against the
                                                    applicable SSS Monthly Salary Credit (MSC) bracket
                                                    during payroll calculation.
                                                </CardDescription>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                                <div className="rounded-md border px-3 py-2">
                                                    <div className="font-semibold">5%</div>
                                                    <div className="text-muted-foreground">Employee</div>
                                                </div>
                                                <div className="rounded-md border px-3 py-2">
                                                    <div className="font-semibold">10%</div>
                                                    <div className="text-muted-foreground">Employer</div>
                                                </div>
                                                <div className="rounded-md border px-3 py-2">
                                                    <div className="font-semibold">₱35k</div>
                                                    <div className="text-muted-foreground">Max MSC</div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="mt-6 p-0">
                                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h2 className="text-sm font-semibold">
                                                    Contribution schedule
                                                </h2>
                                                <p className="text-xs text-muted-foreground">
                                                    Effective January 1, 2025
                                                </p>
                                            </div>

                                            <Input
                                                value={search}
                                                onChange={(event) => setSearch(event.target.value)}
                                                placeholder="Search salary bracket..."
                                                className="sm:w-72"
                                            />
                                        </div>

                                        <div className="max-h-[500px] overflow-auto rounded-md border">
                                            <Table>
                                                <TableHeader className="sticky top-0 bg-background">
                                                    <TableRow>
                                                        <TableHead>Compensation</TableHead>
                                                        <TableHead>MSC</TableHead>
                                                        <TableHead className="text-right">EE Regular SS</TableHead>
                                                        <TableHead className="text-right">EE MPF</TableHead>
                                                        <TableHead className="text-right">EE Total</TableHead>
                                                        <TableHead className="text-right">ER Total</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredTables.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                                No contribution bracket found.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        filteredTables.map((item) => (
                                                            <TableRow key={item.id}>
                                                                <TableCell className="font-medium">
                                                                    {compensationRange(item)}
                                                                </TableCell>
                                                                <TableCell>₱{money(item.monthly_salary_credit)}</TableCell>
                                                                <TableCell className="text-right">
                                                                    ₱{money(item.employee_regular_ss)}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    ₱{money(item.employee_mpf)}
                                                                </TableCell>
                                                                <TableCell className="text-right font-semibold">
                                                                    ₱{money(item.employee_total)}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    ₱{money(item.employer_total)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        <p className="mt-3 text-xs text-muted-foreground">
                                            The employer EC amount is employer-paid and is not included
                                            in the employee deduction. The payroll calculator applies
                                            the employee share only.
                                        </p>
                                    </CardContent>
                                </>
                            ) : (
                                <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                        <ActiveIcon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <h2 className="mt-4 text-lg font-semibold">
                                        {active.label} deductions
                                    </h2>
                                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                        This section is reserved for the {active.label}
                                        contribution rules and calculator. It will be added
                                        without changing the deductions page structure.
                                    </p>
                                    <Badge variant="secondary" className="mt-4">
                                        Coming soon
                                    </Badge>
                                </div>
                            )}
                        </section>
                    </div>
                </Card>
            </main>
        </div>
    );
}
