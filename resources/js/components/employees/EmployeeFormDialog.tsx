import { FormEvent, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export interface Employee {
    id: string
    employee_id: string
    full_name: string
    employment_type: 'regular' | 'probationary' | 'contractual'
    rate_type: 'daily' | 'monthly'
    basic_rate: string | number | null
    daily_rate: string | number | null
    sss_no: string | null
    philhealth_no: string | null
    pagibig_no: string | null
    tin: string | null
    date_hired: string
    created_at: string
}

export type EmployeeFormData = {
    employee_id: string
    full_name: string
    employment_type: Employee['employment_type']
    rate_type: Employee['rate_type']
    basic_rate: string | number | null
    daily_rate: string | number | null
    sss_no: string
    philhealth_no: string
    pagibig_no: string
    tin: string
    date_hired: string
}

interface EmployeeFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employee: Employee | null
}

const emptyDefaults: EmployeeFormData = {
    employee_id: '',
    full_name: '',
    employment_type: 'regular',
    rate_type: 'daily',
    basic_rate: null,
    daily_rate: null,
    sss_no: '',
    philhealth_no: '',
    pagibig_no: '',
    tin: '',
    date_hired: '',
}

export function EmployeeFormDialog({
    open,
    onOpenChange,
    employee,
}: EmployeeFormDialogProps) {
    const isEditMode = employee !== null

    const form = useForm<EmployeeFormData>(emptyDefaults)

    useEffect(() => {
        if (!open) return

        if (!employee) {
            form.reset()
            return
        }

        form.setData({
            employee_id: employee.employee_id ?? '',
            full_name: employee.full_name,
            employment_type: employee.employment_type,
            rate_type: employee.rate_type,
            basic_rate:
                employee.rate_type === 'monthly'
                    ? employee.basic_rate ?? null
                    : null,
            daily_rate:
                employee.rate_type === 'daily'
                    ? employee.daily_rate ?? employee.basic_rate ?? null
                    : null,
            sss_no: employee.sss_no ?? '',
            philhealth_no: employee.philhealth_no ?? '',
            pagibig_no: employee.pagibig_no ?? '',
            tin: employee.tin ?? '',
            date_hired: employee.date_hired,
        })
        form.clearErrors()
    }, [open, employee])

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const payload: EmployeeFormData = {
            ...form.data,
            basic_rate:
                form.data.rate_type === 'monthly'
                    ? form.data.basic_rate || null
                    : null,
            daily_rate:
                form.data.rate_type === 'daily'
                    ? form.data.daily_rate || null
                    : null,
        }

        if (isEditMode) {
            form.put(`/employees/${employee.id}`, {
                data: payload,
                preserveScroll: true,
                onSuccess: () => onOpenChange(false),
            })
            return
        }

        form.post('/employees', {
            data: payload,
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        })
    }

    if (!open) return null

    const errors = form.errors as Record<string, string | undefined>

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
            <div className="relative grid max-h-[90vh] w-full max-w-lg gap-6 overflow-y-auto rounded-[min(var(--radius-4xl),24px)] bg-popover p-6 text-sm text-popover-foreground shadow-xl ring-1 ring-foreground/5">
                <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md bg-secondary text-foreground hover:bg-secondary/80"
                    aria-label="Close"
                >
                    <X className="size-4" />
                </button>

                <div className="flex flex-col gap-1.5">
                    <h2 className="font-display text-base leading-none font-medium">
                        {isEditMode ? 'Edit employee' : 'Add employee'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {isEditMode
                            ? "Update this employee's details."
                            : 'Fill in the details for the new employee.'}
                    </p>
                </div>

                <form id="employee-form" onSubmit={submit}>
                    <FieldGroup>
                        <Field data-invalid={!!errors.employee_id}>
                            <FieldLabel htmlFor="employee-employee_id">
                                Employee ID
                            </FieldLabel>
                            <Input
                                id="employee-employee_id"
                                placeholder="e.g. EMP-001"
                                value={form.data.employee_id}
                                onChange={(event) =>
                                    form.setData('employee_id', event.target.value)
                                }
                                aria-invalid={!!errors.employee_id}
                            />
                            <p className="text-xs text-muted-foreground">
                                Company-provided employee ID.
                            </p>
                            {errors.employee_id && (
                                <p className="text-sm text-destructive">
                                    {errors.employee_id}
                                </p>
                            )}
                        </Field>

                        <Field data-invalid={!!errors.full_name}>
                            <FieldLabel htmlFor="employee-full_name">
                                Full name
                            </FieldLabel>
                            <Input
                                id="employee-full_name"
                                placeholder="Juan Dela Cruz"
                                value={form.data.full_name}
                                onChange={(event) =>
                                    form.setData('full_name', event.target.value)
                                }
                                aria-invalid={!!errors.full_name}
                            />
                            {errors.full_name && (
                                <p className="text-sm text-destructive">
                                    {errors.full_name}
                                </p>
                            )}
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel htmlFor="employee-employment_type">
                                    Employment type
                                </FieldLabel>
                                <select
                                    id="employee-employment_type"
                                    value={form.data.employment_type}
                                    onChange={(event) =>
                                        form.setData(
                                            'employment_type',
                                            event.target.value as Employee['employment_type'],
                                        )
                                    }
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                >
                                    <option value="regular">Regular</option>
                                    <option value="probationary">Probationary</option>
                                    <option value="contractual">Contractual</option>
                                </select>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="employee-rate_type">
                                    Rate type
                                </FieldLabel>
                                <select
                                    id="employee-rate_type"
                                    value={form.data.rate_type}
                                    onChange={(event) =>
                                        form.setData(
                                            'rate_type',
                                            event.target.value as Employee['rate_type'],
                                        )
                                    }
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </Field>
                        </div>

                        {form.data.rate_type === 'daily' ? (
                            <Field data-invalid={!!errors.daily_rate}>
                                <FieldLabel htmlFor="employee-daily_rate">
                                    Fixed daily rate (₱)
                                </FieldLabel>
                                <Input
                                    id="employee-daily_rate"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="font-mono"
                                    placeholder="500.00"
                                    value={form.data.daily_rate ?? ''}
                                    onChange={(event) =>
                                        form.setData('daily_rate', event.target.value)
                                    }
                                    aria-invalid={!!errors.daily_rate}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Payroll uses this rate for each payable attendance day.
                                </p>
                                {errors.daily_rate && (
                                    <p className="text-sm text-destructive">
                                        {errors.daily_rate}
                                    </p>
                                )}
                            </Field>
                        ) : (
                            <Field data-invalid={!!errors.basic_rate}>
                                <FieldLabel htmlFor="employee-basic_rate">
                                    Monthly basic rate (₱)
                                </FieldLabel>
                                <Input
                                    id="employee-basic_rate"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="font-mono"
                                    placeholder="15000.00"
                                    value={form.data.basic_rate ?? ''}
                                    onChange={(event) =>
                                        form.setData('basic_rate', event.target.value)
                                    }
                                    aria-invalid={!!errors.basic_rate}
                                />
                                {errors.basic_rate && (
                                    <p className="text-sm text-destructive">
                                        {errors.basic_rate}
                                    </p>
                                )}
                            </Field>
                        )}

                        <Field data-invalid={!!errors.date_hired}>
                            <FieldLabel htmlFor="employee-date_hired">
                                Date hired
                            </FieldLabel>
                            <Input
                                id="employee-date_hired"
                                type="date"
                                value={form.data.date_hired}
                                onChange={(event) =>
                                    form.setData('date_hired', event.target.value)
                                }
                                aria-invalid={!!errors.date_hired}
                            />
                            {errors.date_hired && (
                                <p className="text-sm text-destructive">
                                    {errors.date_hired}
                                </p>
                            )}
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel htmlFor="employee-sss_no">SSS No.</FieldLabel>
                                <Input
                                    id="employee-sss_no"
                                    placeholder="Optional"
                                    value={form.data.sss_no}
                                    onChange={(event) =>
                                        form.setData('sss_no', event.target.value)
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="employee-philhealth_no">
                                    PhilHealth No.
                                </FieldLabel>
                                <Input
                                    id="employee-philhealth_no"
                                    placeholder="Optional"
                                    value={form.data.philhealth_no}
                                    onChange={(event) =>
                                        form.setData('philhealth_no', event.target.value)
                                    }
                                />
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel htmlFor="employee-pagibig_no">
                                    Pag-IBIG No.
                                </FieldLabel>
                                <Input
                                    id="employee-pagibig_no"
                                    placeholder="Optional"
                                    value={form.data.pagibig_no}
                                    onChange={(event) =>
                                        form.setData('pagibig_no', event.target.value)
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="employee-tin">TIN</FieldLabel>
                                <Input
                                    id="employee-tin"
                                    placeholder="Optional"
                                    value={form.data.tin}
                                    onChange={(event) =>
                                        form.setData('tin', event.target.value)
                                    }
                                />
                            </Field>
                        </div>
                    </FieldGroup>
                </form>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="employee-form"
                        disabled={form.processing}
                    >
                        {form.processing
                            ? 'Saving…'
                            : isEditMode
                              ? 'Save changes'
                              : 'Add employee'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
