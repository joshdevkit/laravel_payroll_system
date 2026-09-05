import { CalendarDays, UserRound } from "lucide-react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EmployeeFormData, FormErrors, SetFieldValue } from "@/types/employee";


interface PersonalInformationSectionProps {
    data: EmployeeFormData;
    errors: FormErrors;
    setData: SetFieldValue;
}

export function PersonalInformationSection({
    data,
    errors,
    setData,
}: PersonalInformationSectionProps) {
    return (
        <section>
            <div className="mb-2 flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <UserRound className="size-3.5" />
                </div>

                <div>
                    <h3 className="text-sm font-semibold">
                        Personal Information
                    </h3>

                    <p className="text-[11px] text-muted-foreground">
                        Employee identity and contact details.
                    </p>
                </div>
            </div>

            <div className="rounded-xl border bg-card p-4">
                <div className="grid gap-x-4 gap-y-3 sm:grid-cols-3">
                    {/* Employee ID */}
                    <Field data-invalid={!!errors.employee_id}>
                        <FieldLabel
                            htmlFor="employee-employee_id"
                            className="text-xs"
                        >
                            Employee ID
                        </FieldLabel>

                        <Input
                            id="employee-employee_id"
                            placeholder="e.g. EMP-001"
                            value={data.employee_id}
                            onChange={(event) =>
                                setData("employee_id", event.target.value)
                            }
                            aria-invalid={!!errors.employee_id}
                            className="h-9"
                        />

                        {errors.employee_id && (
                            <p className="text-[11px] text-destructive">
                                {errors.employee_id}
                            </p>
                        )}
                    </Field>

                    {/* Full Name */}
                    <Field data-invalid={!!errors.full_name}>
                        <FieldLabel
                            htmlFor="employee-full_name"
                            className="text-xs"
                        >
                            Full Name
                        </FieldLabel>

                        <Input
                            id="employee-full_name"
                            placeholder="Juan Dela Cruz"
                            value={data.full_name}
                            onChange={(event) =>
                                setData("full_name", event.target.value)
                            }
                            aria-invalid={!!errors.full_name}
                            className="h-9"
                        />

                        {errors.full_name && (
                            <p className="text-[11px] text-destructive">
                                {errors.full_name}
                            </p>
                        )}
                    </Field>

                    {/* Birthday */}
                    <Field data-invalid={!!errors.birthday}>
                        <FieldLabel
                            htmlFor="employee-birthday"
                            className="text-xs"
                        >
                            Birthday
                        </FieldLabel>

                        <div className="relative">
                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                id="employee-birthday"
                                type="date"
                                value={data.birthday}
                                onChange={(event) =>
                                    setData("birthday", event.target.value)
                                }
                                aria-invalid={!!errors.birthday}
                                className="h-9 pl-9"
                            />
                        </div>

                        {errors.birthday && (
                            <p className="text-[11px] text-destructive">
                                {errors.birthday}
                            </p>
                        )}
                    </Field>

                    {/* Place of Birth */}
                    <Field data-invalid={!!errors.place_of_birth}>
                        <FieldLabel
                            htmlFor="employee-place_of_birth"
                            className="text-xs"
                        >
                            Place of Birth
                        </FieldLabel>

                        <Input
                            id="employee-place_of_birth"
                            placeholder="City / Municipality"
                            value={data.place_of_birth}
                            onChange={(event) =>
                                setData("place_of_birth", event.target.value)
                            }
                            aria-invalid={!!errors.place_of_birth}
                            className="h-9"
                        />

                        {errors.place_of_birth && (
                            <p className="text-[11px] text-destructive">
                                {errors.place_of_birth}
                            </p>
                        )}
                    </Field>

                    {/* Sex */}
                    <Field data-invalid={!!errors.sex}>
                        <FieldLabel htmlFor="employee-sex" className="text-xs">
                            Sex
                        </FieldLabel>

                        <select
                            id="employee-sex"
                            value={data.sex}
                            onChange={(event) =>
                                setData(
                                    "sex",
                                    event.target
                                        .value as EmployeeFormData["sex"],
                                )
                            }
                            aria-invalid={!!errors.sex}
                            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">Select sex</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>

                        {errors.sex && (
                            <p className="text-[11px] text-destructive">
                                {errors.sex}
                            </p>
                        )}
                    </Field>

                    {/* Civil Status */}
                    <Field data-invalid={!!errors.civil_status}>
                        <FieldLabel
                            htmlFor="employee-civil_status"
                            className="text-xs"
                        >
                            Civil Status
                        </FieldLabel>

                        <select
                            id="employee-civil_status"
                            value={data.civil_status}
                            onChange={(event) =>
                                setData(
                                    "civil_status",
                                    event.target
                                        .value as EmployeeFormData["civil_status"],
                                )
                            }
                            aria-invalid={!!errors.civil_status}
                            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">Select status</option>
                            <option value="single">Single</option>
                            <option value="married">Married</option>
                            <option value="widow">Widow</option>
                            <option value="separated">Separated</option>
                        </select>

                        {errors.civil_status && (
                            <p className="text-[11px] text-destructive">
                                {errors.civil_status}
                            </p>
                        )}
                    </Field>

                    {/* Nationality */}
                    <Field data-invalid={!!errors.nationality}>
                        <FieldLabel
                            htmlFor="employee-nationality"
                            className="text-xs"
                        >
                            Nationality
                        </FieldLabel>

                        <Input
                            id="employee-nationality"
                            placeholder="e.g. Filipino"
                            value={data.nationality}
                            onChange={(event) =>
                                setData("nationality", event.target.value)
                            }
                            aria-invalid={!!errors.nationality}
                            className="h-9"
                        />

                        {errors.nationality && (
                            <p className="text-[11px] text-destructive">
                                {errors.nationality}
                            </p>
                        )}
                    </Field>

                    {/* Contact Number */}
                    <Field data-invalid={!!errors.contact_number}>
                        <FieldLabel
                            htmlFor="employee-contact_number"
                            className="text-xs"
                        >
                            Contact Number
                        </FieldLabel>

                        <Input
                            id="employee-contact_number"
                            type="tel"
                            placeholder="09XXXXXXXXX"
                            value={data.contact_number}
                            onChange={(event) =>
                                setData("contact_number", event.target.value)
                            }
                            aria-invalid={!!errors.contact_number}
                            className="h-9"
                        />

                        {errors.contact_number && (
                            <p className="text-[11px] text-destructive">
                                {errors.contact_number}
                            </p>
                        )}
                    </Field>

                    {/* Email */}
                    <Field data-invalid={!!errors.email_address}>
                        <FieldLabel
                            htmlFor="employee-email_address"
                            className="text-xs"
                        >
                            Email Address
                        </FieldLabel>

                        <Input
                            id="employee-email_address"
                            type="email"
                            placeholder="employee@example.com"
                            value={data.email_address}
                            onChange={(event) =>
                                setData("email_address", event.target.value)
                            }
                            aria-invalid={!!errors.email_address}
                            className="h-9"
                        />

                        {errors.email_address && (
                            <p className="text-[11px] text-destructive">
                                {errors.email_address}
                            </p>
                        )}
                    </Field>

                    {/* Home Address */}
                    <Field
                        data-invalid={!!errors.home_address}
                        className="sm:col-span-3"
                    >
                        <FieldLabel
                            htmlFor="employee-home_address"
                            className="text-xs"
                        >
                            Home Address
                        </FieldLabel>

                        <Input
                            id="employee-home_address"
                            placeholder="House No., Street, Barangay, Municipality, Province"
                            value={data.home_address}
                            onChange={(event) =>
                                setData("home_address", event.target.value)
                            }
                            aria-invalid={!!errors.home_address}
                            className="h-9"
                        />

                        {errors.home_address && (
                            <p className="text-[11px] text-destructive">
                                {errors.home_address}
                            </p>
                        )}
                    </Field>
                </div>
            </div>
        </section>
    );
}