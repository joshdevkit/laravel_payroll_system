import { Link } from '@inertiajs/react'
import { ArrowLeft, CalendarDays, CircleDollarSign, FileText, Landmark } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type PayrollRun = {
    id: string
    cutoff_start: string
    cutoff_end: string
    pay_date: string | null
    status: string
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

export default function SssContributions({ employee, contributions }: Props) {
    const employeeTotal = contributions.reduce(
        (sum, item) => sum + Number(item.employee_total),
        0,
    )

    const employerTotal = contributions.reduce(
        (sum, item) => sum + Number(item.employer_total),
        0,
    )

    const totalRemittance = employeeTotal + employerTotal

    return (
        <div className="min-h-svh bg-background p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" asChild>
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
                                <p className="text-xl font-semibold">{peso.format(employeeTotal)}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 p-5">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Landmark className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Employer contribution</p>
                                <p className="text-xl font-semibold">{peso.format(employerTotal)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold">SSS contribution breakdown</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Only the employee share is deducted from payroll. The employer share is an additional employer cost and is not deducted from the employee's net pay.
                                </p>
                            </div>
                            <div className="shrink-0 rounded-lg border bg-background px-4 py-3 text-right">
                                <p className="text-xs text-muted-foreground">Total remittance</p>
                                <p className="font-mono text-lg font-semibold">{peso.format(totalRemittance)}</p>
                                <p className="text-xs text-muted-foreground">
                                    {peso.format(employeeTotal)} employee + {peso.format(employerTotal)} employer
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays className="size-5" />
                            Contribution history
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {contributions.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-10 text-center">
                                <p className="font-medium">No SSS contributions yet</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Contributions will appear here after payroll creates an SSS contribution record.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1200px] text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="px-3 py-3 font-medium">Contribution date</th>
                                            <th className="px-3 py-3 font-medium">Payroll cutoff</th>
                                            <th className="px-3 py-3 text-right font-medium">Monthly compensation</th>
                                            <th className="px-3 py-3 text-right font-medium">MSC</th>
                                            <th className="px-3 py-3 text-right font-medium">Employee SS</th>
                                            <th className="px-3 py-3 text-right font-medium">Employee MPF</th>
                                            <th className="px-3 py-3 text-right font-medium">Employee share</th>
                                            <th className="px-3 py-3 text-right font-medium">Employer SS</th>
                                            <th className="px-3 py-3 text-right font-medium">Employer MPF</th>
                                            <th className="px-3 py-3 text-right font-medium">Employer EC</th>
                                            <th className="px-3 py-3 text-right font-medium">Employer share</th>
                                            <th className="px-3 py-3 text-right font-medium">Total remittance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contributions.map((item) => {
                                            const employeeShare = Number(item.employee_total)
                                            const employerShare = Number(item.employer_total)

                                            return (
                                                <tr key={item.id} className="border-b last:border-0">
                                                    <td className="px-3 py-3 font-medium">{date(item.contribution_date)}</td>
                                                    <td className="px-3 py-3">
                                                        {item.payroll_run
                                                            ? `${date(item.payroll_run.cutoff_start)} – ${date(item.payroll_run.cutoff_end)}`
                                                            : '—'}
                                                    </td>
                                                    <td className="px-3 py-3 text-right font-mono">{peso.format(Number(item.monthly_compensation))}</td>
                                                    <td className="px-3 py-3 text-right font-mono">{peso.format(Number(item.monthly_salary_credit))}</td>
                                                    <td className="px-3 py-3 text-right font-mono">{peso.format(Number(item.employee_regular_ss))}</td>
                                                    <td className="px-3 py-3 text-right font-mono">{peso.format(Number(item.employee_mpf))}</td>
                                                    <td className="px-3 py-3 text-right font-mono font-semibold">{peso.format(employeeShare)}</td>
                                                    <td className="px-3 py-3 text-right font-mono">{peso.format(Number(item.employer_regular_ss))}</td>
                                                    <td className="px-3 py-3 text-right font-mono">{peso.format(Number(item.employer_mpf))}</td>
                                                    <td className="px-3 py-3 text-right font-mono">{peso.format(Number(item.employer_ec))}</td>
                                                    <td className="px-3 py-3 text-right font-mono font-semibold">{peso.format(employerShare)}</td>
                                                    <td className="px-3 py-3 text-right font-mono font-semibold">{peso.format(employeeShare + employerShare)}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t bg-muted/30 font-semibold">
                                            <td className="px-3 py-3" colSpan={6}>Totals</td>
                                            <td className="px-3 py-3 text-right font-mono">{peso.format(employeeTotal)}</td>
                                            <td className="px-3 py-3" colSpan={3}></td>
                                            <td className="px-3 py-3 text-right font-mono">{peso.format(employerTotal)}</td>
                                            <td className="px-3 py-3 text-right font-mono">{peso.format(totalRemittance)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
