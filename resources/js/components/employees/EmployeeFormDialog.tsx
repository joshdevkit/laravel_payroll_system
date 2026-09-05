import { UserRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Branch } from "./BranchDialog";
import { Employee } from "@/types/employee";
import { Category } from "../payroll-run/types";
import { useEmployeeForm } from "@/hooks/useEmployeeform";
import { PersonalInformationSection } from "./PersonalInformationSection";
import { EmploymentPayrollSection } from "./EmploymentPayrollSection";
import { GovernmentIdsSection } from "./GovernmentSectionIdSection";



interface EmployeeFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: Employee | null;
    category: Category[] | null;
    branches: Branch[] | null;
}

export function EmployeeFormDialog({
    open,
    onOpenChange,
    employee,
    category,
    branches,
}: EmployeeFormDialogProps) {
    const { form, isEditMode, handleRateTypeChange, submit, errors } =
        useEmployeeForm({
            open,
            employee,
            onSuccess: () => onOpenChange(false),
        });

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
                {/* =====================================================
                    HEADER (fixed)
                ====================================================== */}
                <div className="flex shrink-0 items-center justify-between border-b bg-muted/30 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <UserRound className="size-5" />
                        </div>

                        <div>
                            <h2 className="text-base font-semibold tracking-tight">
                                {isEditMode ? "Edit employee" : "Add employee"}
                            </h2>

                            <p className="text-xs text-muted-foreground">
                                {isEditMode
                                    ? "Update employee information and payroll details."
                                    : "Create a new employee record for payroll."}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Close"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* =====================================================
                    FORM (scrolls internally; header/footer stay put)
                ====================================================== */}
                <form
                    id="employee-form"
                    onSubmit={submit}
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
                >
                    <div className="space-y-4 px-6 py-4">
                        <PersonalInformationSection
                            data={form.data}
                            errors={errors}
                            setData={form.setData}
                        />

                        <EmploymentPayrollSection
                            data={form.data}
                            errors={errors}
                            setData={form.setData}
                            onRateTypeChange={handleRateTypeChange}
                            category={category}
                            branches={branches}
                        />

                        <GovernmentIdsSection
                            data={form.data}
                            errors={errors}
                            setData={form.setData}
                        />
                    </div>
                </form>

                {/* =====================================================
                    FOOTER (fixed)
                ====================================================== */}
                <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-muted/20 px-6 py-3">
                    <p className="hidden text-[11px] text-muted-foreground sm:block">
                        {isEditMode
                            ? "Changes will be saved to this employee record."
                            : "Complete the employee information before saving."}
                    </p>

                    <div className="ml-auto flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            disabled={form.processing}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            form="employee-form"
                            size="sm"
                            disabled={form.processing}
                        >
                            {form.processing
                                ? "Saving…"
                                : isEditMode
                                  ? "Save changes"
                                  : "Add employee"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}