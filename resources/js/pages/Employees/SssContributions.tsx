import { Link } from '@inertiajs/react'
import { ArrowLeft, CalendarDays, CircleDollarSign, FileText, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout'

type PayrollRun = {
    id: string
    cutoff_start: string
    cutoff_end: string
    pay_date: string | null
    status: string
}

type ContributionTable = {
    id: number
    effective_from: string
    effective_to: string | null
    compensation_min: string | number
    compensation_max: string | number | null
    monthly_salary_credit: string | number
    employee_regular_ss: string | number
    employee_mpf: string | number
    employee_total: string | number
    employer_regular_ss: string | number
    employer_mpf: string | number
    employer_ec: string | number
    employer_total: string | number
    source: string | null
}

type Contribution = {
    id: string
    contribution_date: string
    monthly_compensation: string | number
    monthly_salary_credit: string | number
    employee_regular_ss: string | number
    employee_mpf: string | number
    employee_total: string | number
    employer_regular_ss: string | number
    employer_mpf: string | number
    employer_ec: string | number
    employer_total: string | number
    effective_from: string
    source: string | null
    payroll_run: PayrollRun | null
    contribution_table: ContributionTable | null
}

type Props = {
    employee: {
        id: string
        employee_id: string
        full_name: string
        sss_no: string | null
        sss_deduction_cutoff: 'first' | 'second' | null
    }
    contributions: Contribution[]
}

const peso = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
})

const number = (value: string | number | null | undefined) => Number(value ?? 0)

const date = (value: string | null) => {
    if (!value) return '—'
    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`))
}

const cutoffLabel = (cutoff: Props['employee']['sss_deduction_cutoff']) => {
    if (cutoff === 'first') return '1st cutoff'
    if (cutoff === 'second') return '2nd cutoff'
    return 'Not configured'
}

const bracketLabel = (table: ContributionTable | null) => {
    if (!table) return 'Contribution table unavailable'

    const min = peso.format(number(table.compensation_min))
    const max = table.compensation_max == null
        ? 'and above'
        : peso.format(number(table.compensation_max))

    return `${min} – ${max}`
}

const rate = (amount: string | number, base: string | number) => {
    const baseNumber = number(base)
    if (baseNumber <= 0) return null
    return (number(amount) / baseNumber) * 100
}

const formatRate = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) return '—'
    return `${value.toFixed(2).replace(/\.00$/, '')}%`
}

export default function SssContributions({ employee, contributions }: Props) {
    const employeeTotal = contributions.reduce(
        (sum, item) => sum + number(item.employee_total),
        0,
    )

    const employerTotal = contributions.reduce(
        (sum, item) => sum + number(item.employer_total),
        0,
    )

    const totalRemittance = employeeTotal + employerTotal

    return (
        <AuthenticatedLayout>
            <div className="min-h-svh bg-background p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="icon">
                                <Link href="/employees" aria-label="Back to employees">
                                    <ArrowLeft className="size-4" />
                                </Link>
                            </Button>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                    Employee
                                </p>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    SSS Contributions
                                </h1>
                            </div>
                        </div>
                    </div>

                    <Card>
                        <CardContent className="p-5">
                            <div className="grid gap-5 sm:grid-cols-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Employee</p>
                                    <p className="mt-1 font-semibold">{employee.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{employee.employee_id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">SSS No.</p>
                                    <p className="mt-1 font-medium">{employee.sss_no || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Deduction cutoff</p>
                                    <div className="mt-1">
                                        <Badge variant={employee.sss_deduction_cutoff ? 'secondary' : 'outline'}>
                                            {cutoffLabel(employee.sss_deduction_cutoff)}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <Card>
                            <CardContent className="flex items-center gap-3 p-5">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <FileText className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Contribution records</p>
                                    <p className="text-xl font-semibold">{contributions.length}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex items-center gap-3 p-5">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <CircleDollarSign className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Employee deductions</p>
                                    <p className="text-xl font-semibold">
                                        {peso.format(employeeTotal)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex items-center gap-3 p-5">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Landmark className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Employer contributions</p>
                                    <p className="text-xl font-semibold">
                                        {peso.format(employerTotal)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarDays className="size-5" />
                                Contribution history
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {contributions.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-10 text-center">
                                    <p className="font-medium">No SSS contributions yet</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Contributions will appear here after payroll creates an SSS contribution record.
                                    </p>
                                </div>
                            ) : (
                                contributions.map((item) => {
                                    const monthlyCompensation = number(item.monthly_compensation)
                                    const msc = number(item.monthly_salary_credit)
                                    const employeeSs = number(item.employee_regular_ss)
                                    const employeeMpf = number(item.employee_mpf)
                                    const employeeShare = number(item.employee_total)
                                    const employerSs = number(item.employer_regular_ss)
                                    const employerMpf = number(item.employer_mpf)
                                    const employerEc = number(item.employer_ec)
                                    const employerShare = number(item.employer_total)
                                    const remittance = employeeShare + employerShare
                                    const employeeSsRate = rate(employeeSs, msc)
                                    const employerSsRate = rate(employerSs, msc)

                                    return (
                                        <div key={item.id} className="overflow-hidden rounded-xl border">
                                            <div className="border-b bg-muted/30 px-4 py-4 sm:px-5">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <p className="text-sm font-semibold">
                                                            Contribution for {date(item.contribution_date)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.payroll_run
                                                                ? `${date(item.payroll_run.cutoff_start)} – ${date(item.payroll_run.cutoff_end)}`
                                                                : 'Payroll cutoff unavailable'}
                                                        </p>
                                                    </div>
                                                    <Badge variant="secondary">
                                                        {item.payroll_run?.status || 'Recorded'}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
                                                <Card className="shadow-none">
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-sm">How the MSC was determined</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-3 text-sm">
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-muted-foreground">Monthly compensation used</span>
                                                            <span className="font-mono font-semibold">{peso.format(monthlyCompensation)}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-muted-foreground">Applicable compensation bracket</span>
                                                            <span className="text-right font-medium">{bracketLabel(item.contribution_table)}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4 border-t pt-3">
                                                            <span className="font-medium">Monthly Salary Credit (MSC)</span>
                                                            <span className="font-mono font-bold">{peso.format(msc)}</span>
                                                        </div>
                                                        <p className="rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
                                                            The MSC shown here is the value used by the SSS contribution table for this contribution record. It is the base used for the employee and employer percentage calculations below.
                                                        </p>
                                                    </CardContent>
                                                </Card>

                                                <Card className="shadow-none">
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-sm">Employee share — deducted from payroll</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-3 text-sm">
                                                        <div className="rounded-lg border bg-background p-3">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <span>Regular SS</span>
                                                                <span className="font-mono font-semibold">
                                                                    {peso.format(msc)} × {formatRate(employeeSsRate)} = {peso.format(employeeSs)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {employeeMpf > 0 && (
                                                            <div className="flex justify-between gap-4 rounded-lg border p-3">
                                                                <span>MPF</span>
                                                                <span className="font-mono font-semibold">{peso.format(employeeMpf)}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between gap-4 border-t pt-3">
                                                            <span className="font-semibold">Employee SSS deduction</span>
                                                            <span className="font-mono font-bold text-destructive">{peso.format(employeeShare)}</span>
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                <Card className="shadow-none">
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-sm">Employer share — additional employer cost</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-3 text-sm">
                                                        <div className="rounded-lg border bg-background p-3">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <span>Regular SS</span>
                                                                <span className="font-mono font-semibold">
                                                                    {peso.format(msc)} × {formatRate(employerSsRate)} = {peso.format(employerSs)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {employerMpf > 0 && (
                                                            <div className="flex justify-between gap-4 rounded-lg border p-3">
                                                                <span>MPF</span>
                                                                <span className="font-mono font-semibold">{peso.format(employerMpf)}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between gap-4 rounded-lg border p-3">
                                                            <span>Employer EC</span>
                                                            <span className="font-mono font-semibold">{peso.format(employerEc)}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4 border-t pt-3">
                                                            <span className="font-semibold">Employer contribution cost</span>
                                                            <span className="font-mono font-bold">{peso.format(employerShare)}</span>
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                <Card className="border-primary/30 bg-primary/5 shadow-none">
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-sm">What gets deducted vs. what gets remitted</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-3 text-sm">
                                                        <div className="flex justify-between gap-4">
                                                            <span>Employee payroll deduction</span>
                                                            <span className="font-mono font-bold">{peso.format(employeeShare)}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4">
                                                            <span>Employer contribution cost</span>
                                                            <span className="font-mono font-bold">{peso.format(employerShare)}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4 border-t pt-3 text-base">
                                                            <span className="font-bold">Total remitted to SSS</span>
                                                            <span className="font-mono font-bold">{peso.format(remittance)}</span>
                                                        </div>
                                                        <div className="rounded-lg border border-primary/20 bg-background p-3 text-xs leading-5">
                                                            <strong>Employee clarification:</strong> only {peso.format(employeeShare)} is deducted from the employee's payroll. The {peso.format(employerShare)} employer share is an additional employer cost and does not reduce the employee's net pay.
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            <div className="border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground sm:px-5">
                                                Source: {item.source || 'SSS contribution table'} · Effective {date(item.effective_from)}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </CardContent>
                    </Card>

                    {contributions.length > 0 && (
                        <Card>
                            <CardContent className="p-5">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-semibold">Contribution summary</p>
                                        <p className="text-sm text-muted-foreground">
                                            Employee deductions plus employer contributions equal the total amount remitted to SSS.
                                        </p>
                                    </div>
                                    <p className="font-mono text-lg font-bold">{peso.format(totalRemittance)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
