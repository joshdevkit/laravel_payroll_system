import { useMemo, useState } from "react";

import { Head, Link } from "@inertiajs/react";

import { Plus, Search, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { Employee, LoanAndCashAdvance, LoanType } from "@/types/loans";
import { getTypeLabel } from "@/utils/loan-utils";
import LoanSummary from "@/components/employees/loans-and-cash-advances/LoanSummary";
import LoanTable from "@/components/employees/loans-and-cash-advances/LoanTable";
import LoanFormDialog from "@/components/employees/loans-and-cash-advances/LoanFormDialog";
import LoanHistoryDialog from "@/components/employees/loans-and-cash-advances/LoanHistoryDialog";
import DeleteLoanDialog from "@/components/employees/loans-and-cash-advances/DeleteLoanDialog";
import FilterButton from "@/components/employees/loans-and-cash-advances/button";

interface Props {
    employee: Employee;
    loansAndCashAdvances: LoanAndCashAdvance[];
}

type Filter = "all" | LoanType;

export default function Index({
    employee,
    loansAndCashAdvances,
}: Props) {
    const [filter, setFilter] = useState<Filter>("all");
    const [search, setSearch] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editingLoan, setEditingLoan] =
        useState<LoanAndCashAdvance | null>(null);
    const [historyLoan, setHistoryLoan] =
        useState<LoanAndCashAdvance | null>(null);
    const [deleteLoan, setDeleteLoan] =
        useState<LoanAndCashAdvance | null>(null);

    const filteredLoans = useMemo(() => {
        const query = search.trim().toLowerCase();

        return loansAndCashAdvances.filter((loan) => {
            const matchesType =
                filter === "all" || loan.type === filter;

            if (!matchesType) {
                return false;
            }

            if (!query) {
                return true;
            }

            return (
                getTypeLabel(loan.type).toLowerCase().includes(query) ||
                loan.reference_no?.toLowerCase().includes(query) ||
                loan.status.toLowerCase().includes(query)
            );
        });
    }, [loansAndCashAdvances, filter, search]);

    function openCreate() {
        setEditingLoan(null);
        setFormOpen(true);
    }

    function openEdit(loan: LoanAndCashAdvance) {
        setEditingLoan(loan);
        setFormOpen(true);
    }

    function closeForm() {
        setFormOpen(false);
        setEditingLoan(null);
    }

    return (
        <AuthenticatedLayout>
            <Head
                title={`Loans & Cash Advances - ${employee.full_name}`}
            />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-10">
                            <Link href={'/employees'}>
                                <span className="font-large font-semibold text-foreground text-xl underline decoration-black underline-offset-3">
                                    {employee.full_name}
                                </span>
                            </Link>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <WalletCards className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                                <h1 className="truncate text-2xl font-semibold tracking-tight">
                                    Loans & Cash Advances
                                </h1>

                                <p className="text-sm text-muted-foreground">
                                    Manage loans, cash advances, and
                                    payroll deductions.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button
                        className="w-full md:w-auto"
                        onClick={openCreate}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Record
                    </Button>
                </div>

                {/* Summary */}
                <LoanSummary loans={loansAndCashAdvances} />

                {/* Records */}
                <Card>
                    <CardHeader className="space-y-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <CardTitle>
                                    Financial Obligations
                                </CardTitle>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Loans and advances assigned to this
                                    employee.
                                </p>
                            </div>

                            <div className="relative w-full lg:w-72">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Search records..."
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <FilterButton
                                active={filter === "all"}
                                onClick={() => setFilter("all")}
                            >
                                All
                            </FilterButton>

                            <FilterButton
                                active={filter === "sss"}
                                onClick={() => setFilter("sss")}
                            >
                                SSS
                            </FilterButton>

                            <FilterButton
                                active={filter === "pag_ibig"}
                                onClick={() => setFilter("pag_ibig")}
                            >
                                Pag-IBIG
                            </FilterButton>

                            <FilterButton
                                active={filter === "cash_advance"}
                                onClick={() => setFilter("cash_advance")}
                            >
                                Cash Advance
                            </FilterButton>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <LoanTable
                            loans={filteredLoans}
                            onView={setHistoryLoan}
                            onEdit={openEdit}
                            onDelete={setDeleteLoan}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Add / Edit */}
            <LoanFormDialog
                open={formOpen}
                employee={employee}
                editingLoan={editingLoan}
                onClose={closeForm}
            />

            {/* History */}
            <LoanHistoryDialog
                employee={employee}
                loan={historyLoan}
                onClose={() => setHistoryLoan(null)}
            />

            {/* Delete */}
            <DeleteLoanDialog
                employee={employee}
                loan={deleteLoan}
                onClose={() => setDeleteLoan(null)}
            />
        </AuthenticatedLayout>
    );
}