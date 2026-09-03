import { useMemo, useState } from 'react'
import { router } from '@inertiajs/react'
import { HeartPulse, Landmark, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout'

type SssContributionTable = {
    id: number
    effective_from: string
    effective_to?: string | null
    compensation_min: string | number
    compensation_max?: string | number | null
    monthly_salary_credit: string | number
    employee_regular_ss: string | number
    employee_mpf: string | number
    employee_total: string | number
    employer_regular_ss: string | number
    employer_mpf: string | number
    employer_ec: string | number
    employer_total: string | number
    source?: string | null
}

type SssEmployee = {
    id: string
    employee_id: string
    full_name: string
    sss_no: string | null
    sss_deduction_cutoff: 'first' | 'second' | null
}

type DeductionSection = 'sss' | 'philhealth' | 'pagibig'

const navItems: Array<{
    id: DeductionSection
    label: string
    icon: typeof ShieldCheck
}> = [
    {
        id: 'sss',
        label: 'SSS',
        icon: ShieldCheck,
    },
    {
        id: 'philhealth',
        label: 'PhilHealth',
        icon: HeartPulse,
    },
    {
        id: 'pagibig',
        label: 'Pag-IBIG',
        icon: Landmark,
    },
]

const money = (value: string | number) =>
    Number(value).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

const compensationRange = (item: SssContributionTable) => {
    const min = money(item.compensation_min)
    const max = item.compensation_max

    return max === null || max === undefined
        ? `₱${min} and above`
        : `₱${min} – ₱${money(max)}`
}

export default function Index({
    employees,
    sssContributionTables,
}: {
    employees: SssEmployee[]
    sssContributionTables: SssContributionTable[]
}) {
    const [section, setSection] = useState<DeductionSection>('sss')
    const [search, setSearch] = useState('')
    const [savingEmployee, setSavingEmployee] = useState<string | null>(null)

    const filteredTables = useMemo(() => {
        const term = search.trim().toLowerCase()

        if (!term) return sssContributionTables

        return sssContributionTables.filter((item) =>
            [
                compensationRange(item),
                item.monthly_salary_credit,
                item.employee_total,
                item.employer_total,
            ].some((value) => String(value).toLowerCase().includes(term)),
        )
    }, [search, sssContributionTables])

    const active = navItems.find((item) => item.id === section)!
    const ActiveIcon = active.icon

    const updateCutoff = (employee: SssEmployee, cutoff: string) => {
        setSavingEmployee(employee.id)

        router.patch(
            `/deductions/sss-cutoff/${employee.id}`,
            {
                sss_deduction_cutoff: cutoff || null,
            },
            {
                preserveScroll: true,
                onFinish: () => setSavingEmployee(null),
            },
        )
    }

    return (
        <>
        <AuthenticatedLayout>
                    <div>
                    <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        Payroll
                    </p>
                    <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
                        Deductions
                    </h1>
                    <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                        Configure statutory contributions and the cutoff where each
                        employee's contribution is deducted.
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
                                    const Icon = item.icon
                                    const selected = item.id === section

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
                                            </span>
                                        </Button>
                                    )
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
                                                    The SSS amount is calculated from the
                                                    applicable contribution table. The employee
                                                    decides whether the full monthly employee
                                                    share is deducted on the first or second cutoff.
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
                                        <Card className="mb-6 border-dashed">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm">
                                                    Employee deduction cutoff
                                                </CardTitle>
                                                <CardDescription>
                                                    Choose where the employee's entire monthly SSS
                                                    share will be deducted. Nothing is deducted until
                                                    a cutoff is selected.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <div className="overflow-auto rounded-md border">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Employee</TableHead>
                                                                <TableHead>SSS No.</TableHead>
                                                                <TableHead>Deduction cutoff</TableHead>
                                                                <TableHead>Status</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {employees.length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell
                                                                        colSpan={4}
                                                                        className="h-24 text-center text-muted-foreground"
                                                                    >
                                                                        No employees with an SSS number.
                                                                    </TableCell>
                                                                </TableRow>
                                                            ) : (
                                                                employees.map((employee) => (
                                                                    <TableRow key={employee.id}>
                                                                        <TableCell>
                                                                            <div className="font-medium">
                                                                                {employee.full_name}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground">
                                                                                {employee.employee_id}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="font-mono text-xs">
                                                                            {employee.sss_no}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <select
                                                                                value={employee.sss_deduction_cutoff ?? ''}
                                                                                disabled={savingEmployee === employee.id}
                                                                                onChange={(event) =>
                                                                                    updateCutoff(
                                                                                        employee,
                                                                                        event.target.value,
                                                                                    )
                                                                                }
                                                                                className="border-input bg-background flex h-9 w-full min-w-40 rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                                            >
                                                                                <option value="">
                                                                                    Select cutoff
                                                                                </option>
                                                                                <option value="first">
                                                                                    1st cutoff
                                                                                </option>
                                                                                <option value="second">
                                                                                    2nd cutoff
                                                                                </option>
                                                                            </select>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {employee.sss_deduction_cutoff ? (
                                                                                <Badge variant="secondary">
                                                                                    {employee.sss_deduction_cutoff === 'first'
                                                                                        ? '1st cutoff'
                                                                                        : '2nd cutoff'}
                                                                                </Badge>
                                                                            ) : (
                                                                                <Badge variant="outline">
                                                                                    Not configured
                                                                                </Badge>
                                                                            )}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h2 className="text-sm font-semibold">
                                                    Contribution schedule
                                                </h2>
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
                                            The employer share and EC are employer-paid and are
                                            never included in the employee's net-pay deduction.
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
        </AuthenticatedLayout>
        </>
    )
}
