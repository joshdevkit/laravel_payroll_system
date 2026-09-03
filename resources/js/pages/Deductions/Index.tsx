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

type ContributionCutoff = 'first' | 'second' | null

type Employee = {
    id: string
    employee_id: string
    full_name: string
    sss_no: string | null
    sss_deduction_cutoff: ContributionCutoff
    philhealth_no: string | null
    philhealth_deduction_cutoff: ContributionCutoff
    pagibig_no: string | null
    pagibig_deduction_cutoff: ContributionCutoff
}

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

type DeductionSection = 'sss' | 'philhealth' | 'pagibig'

const navItems: Array<{
    id: DeductionSection
    label: string
    icon: typeof ShieldCheck
}> = [
    { id: 'sss', label: 'SSS', icon: ShieldCheck },
    { id: 'philhealth', label: 'PhilHealth', icon: HeartPulse },
    { id: 'pagibig', label: 'Pag-IBIG', icon: Landmark },
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

const cutoffLabel = (cutoff: ContributionCutoff) => {
    if (cutoff === 'first') return '1st cutoff'
    if (cutoff === 'second') return '2nd cutoff'
    return 'Not configured'
}

export default function Index({
    employees,
    sssContributionTables,
}: {
    employees: Employee[]
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

    const updateSssCutoff = (employee: Employee, cutoff: string) => {
        setSavingEmployee(employee.id)

        router.patch(
            `/deductions/sss-cutoff/${employee.id}`,
            { sss_deduction_cutoff: cutoff || null },
            {
                preserveScroll: true,
                onFinish: () => setSavingEmployee(null),
            },
        )
    }

    const updateGovernmentCutoffs = (
        employee: Employee,
        field: 'philhealth_deduction_cutoff' | 'pagibig_deduction_cutoff',
        cutoff: string,
    ) => {
        setSavingEmployee(employee.id)

        router.patch(
            `/deductions/government-cutoffs/${employee.id}`,
            { [field]: cutoff || null },
            {
                preserveScroll: true,
                onFinish: () => setSavingEmployee(null),
            },
        )
    }

    const renderEmployeeCutoffTable = (
        type: 'sss' | 'philhealth' | 'pagibig',
    ) => {
        const config = {
            sss: {
                numberLabel: 'SSS No.',
                numberKey: 'sss_no' as const,
                cutoffKey: 'sss_deduction_cutoff' as const,
                empty: 'No employees with an SSS number.',
            },
            philhealth: {
                numberLabel: 'PhilHealth No.',
                numberKey: 'philhealth_no' as const,
                cutoffKey: 'philhealth_deduction_cutoff' as const,
                empty: 'No employees with a PhilHealth number.',
            },
            pagibig: {
                numberLabel: 'Pag-IBIG No.',
                numberKey: 'pagibig_no' as const,
                cutoffKey: 'pagibig_deduction_cutoff' as const,
                empty: 'No employees with a Pag-IBIG number.',
            },
        }[type]

        const applicableEmployees = employees.filter(
            (employee) => employee[config.numberKey],
        )

        return (
            <div className="overflow-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>{config.numberLabel}</TableHead>
                            <TableHead>Deduction cutoff</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applicableEmployees.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    {config.empty}
                                </TableCell>
                            </TableRow>
                        ) : (
                            applicableEmployees.map((employee) => {
                                const cutoff = employee[config.cutoffKey]
                                const saving = savingEmployee === employee.id

                                return (
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
                                            {employee[config.numberKey]}
                                        </TableCell>

                                        <TableCell>
                                            <select
                                                value={cutoff ?? ''}
                                                disabled={saving}
                                                onChange={(event) => {
                                                    if (type === 'sss') {
                                                        updateSssCutoff(
                                                            employee,
                                                            event.target.value,
                                                        )
                                                    } else {
                                                        updateGovernmentCutoffs(
                                                            employee,
                                                            config.cutoffKey,
                                                            event.target.value,
                                                        )
                                                    }
                                                }}
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
                                            {cutoff ? (
                                                <Badge variant="secondary">
                                                    {cutoffLabel(cutoff)}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">
                                                    Not configured
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        )
    }

    const active = navItems.find((item) => item.id === section)!
    const ActiveIcon = active.icon

    return (
        <AuthenticatedLayout>
            <div>
                <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    Payroll
                </p>
                <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
                    Deductions
                </h1>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                    Configure statutory contributions and choose which payroll
                    cutoff applies each employee's monthly deduction.
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
                                                SSS uses the contribution table and
                                                deducts the full monthly employee
                                                share only on the selected cutoff.
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
                                                Nothing is deducted until a cutoff
                                                is selected.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            {renderEmployeeCutoffTable('sss')}
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
                                        The employer share and EC are employer-paid
                                        and are never included in employee net pay.
                                    </p>
                                </CardContent>
                            </>
                        ) : (
                            <>
                                <CardHeader className="p-0">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg">
                                            {active.label} Contribution
                                        </CardTitle>
                                        <Badge>Automatic</Badge>
                                    </div>
                                    <CardDescription className="mt-1 max-w-2xl">
                                        {section === 'philhealth'
                                            ? 'Employee contribution is ₱125.00 based on the ₱10,000 minimum salary credit and is deducted once per month on the selected cutoff.'
                                            : 'Employee contribution is ₱200.00 based on the ₱10,000 minimum salary credit and is deducted once per month on the selected cutoff.'}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="mt-6 p-0">
                                    <Card className="border-dashed">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm">
                                                Employee deduction cutoff
                                            </CardTitle>
                                            <CardDescription>
                                                Select the payroll cutoff where
                                                this employee's monthly contribution
                                                will be deducted. No cutoff means
                                                no deduction.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            {renderEmployeeCutoffTable(section)}
                                        </CardContent>
                                    </Card>
                                </CardContent>
                            </>
                        )}
                    </section>
                </div>
            </Card>
        </AuthenticatedLayout>
    )
}
