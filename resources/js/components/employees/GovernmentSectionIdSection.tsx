import { IdCard } from "lucide-react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EmployeeFormData, FormErrors, SetFieldValue } from "@/types/employee";


interface GovernmentIdsSectionProps {
    data: EmployeeFormData;
    errors: FormErrors;
    setData: SetFieldValue;
}

export function GovernmentIdsSection({
    data,
    errors,
    setData,
}: GovernmentIdsSectionProps) {
    return (
        <section>
            <div className="mb-2 flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <IdCard className="size-3.5" />
                </div>

                <div>
                    <h3 className="text-sm font-semibold">Government IDs</h3>

                    <p className="text-[11px] text-muted-foreground">
                        Optional government identification numbers.
                    </p>
                </div>
            </div>

            <div className="rounded-xl border bg-card p-4">
                <div className="grid gap-x-4 gap-y-3 sm:grid-cols-4">
                    {/* SSS */}
                    <Field data-invalid={!!errors.sss_no}>
                        <FieldLabel
                            htmlFor="employee-sss_no"
                            className="text-xs"
                        >
                            SSS No.
                        </FieldLabel>

                        <Input
                            id="employee-sss_no"
                            placeholder="Optional"
                            value={data.sss_no}
                            onChange={(event) =>
                                setData("sss_no", event.target.value)
                            }
                            aria-invalid={!!errors.sss_no}
                            className="h-9"
                        />

                        {errors.sss_no && (
                            <p className="text-[11px] text-destructive">
                                {errors.sss_no}
                            </p>
                        )}
                    </Field>

                    {/* PhilHealth */}
                    <Field data-invalid={!!errors.philhealth_no}>
                        <FieldLabel
                            htmlFor="employee-philhealth_no"
                            className="text-xs"
                        >
                            PhilHealth No.
                        </FieldLabel>

                        <Input
                            id="employee-philhealth_no"
                            placeholder="Optional"
                            value={data.philhealth_no}
                            onChange={(event) =>
                                setData("philhealth_no", event.target.value)
                            }
                            aria-invalid={!!errors.philhealth_no}
                            className="h-9"
                        />

                        {errors.philhealth_no && (
                            <p className="text-[11px] text-destructive">
                                {errors.philhealth_no}
                            </p>
                        )}
                    </Field>

                    {/* Pag-IBIG */}
                    <Field data-invalid={!!errors.pagibig_no}>
                        <FieldLabel
                            htmlFor="employee-pagibig_no"
                            className="text-xs"
                        >
                            Pag-IBIG No.
                        </FieldLabel>

                        <Input
                            id="employee-pagibig_no"
                            placeholder="Optional"
                            value={data.pagibig_no}
                            onChange={(event) =>
                                setData("pagibig_no", event.target.value)
                            }
                            aria-invalid={!!errors.pagibig_no}
                            className="h-9"
                        />

                        {errors.pagibig_no && (
                            <p className="text-[11px] text-destructive">
                                {errors.pagibig_no}
                            </p>
                        )}
                    </Field>

                    {/* TIN */}
                    <Field data-invalid={!!errors.tin}>
                        <FieldLabel htmlFor="employee-tin" className="text-xs">
                            TIN
                        </FieldLabel>

                        <Input
                            id="employee-tin"
                            placeholder="Optional"
                            value={data.tin}
                            onChange={(event) =>
                                setData("tin", event.target.value)
                            }
                            aria-invalid={!!errors.tin}
                            className="h-9"
                        />

                        {errors.tin && (
                            <p className="text-[11px] text-destructive">
                                {errors.tin}
                            </p>
                        )}
                    </Field>
                </div>
            </div>
        </section>
    );
}