import { useEffect, useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Plus,
    Search,
    UserRoundX,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    EmployeeFormDialog,
    type Employee,
} from '@/components/employees/EmployeeFormDialog';

const PAGE_SIZE = 15;

type PageProps = {
    employees: Employee[];
};

const employmentTypeLabel: Record<Employee['employment_type'], string> = {
    regular: 'Regular',
    probationary: 'Probationary',
    contractual: 'Contractual',
};

const formatPeso = (amount: number) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);

export default function Employees() {
    const { employees } = usePage<PageProps>().props;
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [formOpen, setFormOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
    const [menuEmployee, setMenuEmployee] = useState<string | null>(null);

    const filtered = useMemo(
        () =>
            employees.filter((employee) =>
                employee.full_name.toLowerCase().includes(search.toLowerCase()),
            ),
        [employees, search],
    );

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginatedEmployees = filtered.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE,
    );

    const firstRecord = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const lastRecord = Math.min(page * PAGE_SIZE, filtered.length);

    useEffect(() => setPage(1), [search]);

    useEffect(() => {
        if (page > pageCount) setPage(pageCount);
    }, [page, pageCount]);

    const openAddDialog = () => {
        setEditingEmployee(null);
        setFormOpen(true);
    };

    const openEditDialog = (employee: Employee) => {
        setMenuEmployee(null);
        setEditingEmployee(employee);
        setFormOpen(true);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;

        router.delete(`/employees/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
                setMenuEmployee(null);
            },
        });
    };

    return (
        <div
            className="min-h-svh bg-background font-sans"
            onClick={() => setMenuEmployee(null)}
        >
            <Navbar />

            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                            Team
                        </p>
                        <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
                            Employees
                        </h1>
                    </div>

                    <Button onClick={openAddDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add employee
                    </Button>
                </div>

                <div className="relative mt-6 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by name…"
                        className="pl-9"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>

                <div className="mt-4 rounded-lg border">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 p-10 text-center">
                            <UserRoundX className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm font-medium text-foreground">
                                {search
                                    ? 'No employees match your search'
                                    : 'No employees yet'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {search
                                    ? 'Try a different name.'
                                    : 'Add your first employee to get started.'}
                            </p>
                            {!search && (
                                <Button
                                    size="sm"
                                    className="mt-2"
                                    onClick={openAddDialog}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add employee
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="relative w-full overflow-x-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr>
                                            <th className="h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground">
                                                Emp ID
                                            </th>
                                            <th className="h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground">
                                                Name
                                            </th>
                                            <th className="h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground">
                                                Type
                                            </th>
                                            <th className="h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground">
                                                Rate
                                            </th>
                                            <th className="h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground">
                                                Date hired
                                            </th>
                                            <th className="h-10 whitespace-nowrap px-2 text-right align-middle font-medium text-foreground">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {paginatedEmployees.map((employee) => {
                                            const rate =
                                                employee.rate_type === 'daily'
                                                    ? employee.daily_rate
                                                    : employee.basic_rate;

                                            return (
                                                <tr
                                                    key={employee.id}
                                                    className="border-b transition-colors hover:bg-muted/50"
                                                    onClick={() =>
                                                        setMenuEmployee(null)
                                                    }
                                                >
                                                    <td className="whitespace-nowrap p-2 align-middle font-mono tabular-nums">
                                                        {employee.employee_id}
                                                    </td>
                                                    <td className="whitespace-nowrap p-2 align-middle font-medium">
                                                        {employee.full_name}
                                                    </td>
                                                    <td className="whitespace-nowrap p-2 align-middle">
                                                        <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium">
                                                            {
                                                                employmentTypeLabel[
                                                                    employee.employment_type
                                                                ]
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap p-2 align-middle font-mono tabular-nums">
                                                        {formatPeso(Number(rate ?? 0))}
                                                        <span className="ml-1 text-xs text-muted-foreground">
                                                            /
                                                            {employee.rate_type ===
                                                            'daily'
                                                                ? 'day'
                                                                : 'mo'}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap p-2 align-middle text-muted-foreground">
                                                        {new Date(
                                                            `${employee.date_hired}T00:00:00`,
                                                        ).toLocaleDateString('en-PH', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </td>
                                                    <td className="whitespace-nowrap p-2 text-right align-middle">
                                                        <div
                                                            className="relative inline-block"
                                                            onClick={(event) =>
                                                                event.stopPropagation()
                                                            }
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() =>
                                                                    setMenuEmployee(
                                                                        menuEmployee ===
                                                                            employee.id
                                                                            ? null
                                                                            : employee.id,
                                                                    )
                                                                }
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>

                                                            {menuEmployee ===
                                                                employee.id && (
                                                                <div className="absolute right-0 z-50 mt-1 w-44 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                                                                    <Link
                                                                        href={`/employees/${employee.id}/attendance`}
                                                                        className="flex rounded-sm px-3 py-2 text-left text-sm hover:bg-muted"
                                                                        onClick={() =>
                                                                            setMenuEmployee(
                                                                                null,
                                                                            )
                                                                        }
                                                                    >
                                                                        View attendance
                                                                    </Link>
                                                                    <button
                                                                        type="button"
                                                                        className="flex w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-muted"
                                                                        onClick={() =>
                                                                            openEditDialog(
                                                                                employee,
                                                                            )
                                                                        }
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="flex w-full rounded-sm px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                                                                        onClick={() => {
                                                                            setDeleteTarget(
                                                                                employee,
                                                                            );
                                                                            setMenuEmployee(
                                                                                null,
                                                                            );
                                                                        }}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
                                <p className="text-sm text-muted-foreground">
                                    Showing {firstRecord}–{lastRecord} of{' '}
                                    {filtered.length} employees
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setPage((current) =>
                                                Math.max(1, current - 1),
                                            )
                                        }
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft className="mr-1 h-4 w-4" />
                                        Previous
                                    </Button>
                                    <span className="px-2 text-sm text-muted-foreground">
                                        Page {page} of {pageCount}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setPage((current) =>
                                                Math.min(pageCount, current + 1),
                                            )
                                        }
                                        disabled={page === pageCount}
                                    >
                                        Next
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <EmployeeFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                employee={editingEmployee}
            />

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[min(var(--radius-4xl),24px)] bg-popover p-6 text-popover-foreground shadow-xl ring-1 ring-foreground/5">
                        <h2 className="text-base font-medium">
                            Delete {deleteTarget.full_name}?
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            This removes their employee record. This can't be
                            undone.
                        </p>
                        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteTarget(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
