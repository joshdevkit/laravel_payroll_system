import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { router, usePage } from "@inertiajs/react";
import { Plus, UserRoundX } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { EmployeeActionsMenu } from "@/components/employees/EmployeeActionsMenu";
import {
    Category,
    EmployeeFormDialog,
    type Employee,
} from "@/components/employees/EmployeeFormDialog";
import { EmployeePagination } from "@/components/employees/EmployeePagination";
import { EmployeeSearch } from "@/components/employees/EmployeeSearch";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { FlashMessage } from "@/components/layout/FlashMessage";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { Header } from "@/components/layout/Header";
import { DepartmentDialog } from "@/components/employees/DepartmentDialog";

const PAGE_SIZE = 15;

type PageProps = {
    employees: Employee[];
    categories: Category[];
};

type MenuPosition = {
    top: number;
    left: number;
};

export default function Employees() {
    const { employees, categories } = usePage<PageProps>().props;

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [formOpen, setFormOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(
        null,
    );
    const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
    const [menuEmployee, setMenuEmployee] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
    const [departmentOpen, setDepartmentOpen] = useState(false);
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

    useEffect(() => {
        setPage(1);
    }, [search]);

    useEffect(() => {
        if (page > pageCount) {
            setPage(pageCount);
        }
    }, [page, pageCount]);

    useEffect(() => {
        if (!menuEmployee) return;

        const closeMenu = () => {
            setMenuEmployee(null);
            setMenuPosition(null);
        };

        window.addEventListener("scroll", closeMenu, true);
        window.addEventListener("resize", closeMenu);

        return () => {
            window.removeEventListener("scroll", closeMenu, true);
            window.removeEventListener("resize", closeMenu);
        };
    }, [menuEmployee]);

    const closeMenu = () => {
        setMenuEmployee(null);
        setMenuPosition(null);
    };

    const toggleMenu = (
        employee: Employee,
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        event.stopPropagation();

        if (menuEmployee === employee.id) {
            closeMenu();
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const menuWidth = 176;
        const menuHeight = 128;
        const gap = 4;

        const left = Math.min(
            Math.max(8, rect.right - menuWidth),
            window.innerWidth - menuWidth - 8,
        );

        const openAbove =
            rect.bottom + menuHeight + gap > window.innerHeight - 8;

        const top = openAbove
            ? Math.max(8, rect.top - menuHeight - gap)
            : rect.bottom + gap;

        setMenuPosition({
            top,
            left,
        });

        setMenuEmployee(employee.id);
    };

    const openAddDialog = () => {
        closeMenu();
        setEditingEmployee(null);
        setFormOpen(true);
    };

    const openEditDialog = (employee: Employee) => {
        closeMenu();
        setEditingEmployee(employee);
        setFormOpen(true);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;

        router.delete(`/employees/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const activeMenuEmployee = paginatedEmployees.find(
        (employee) => employee.id === menuEmployee,
    );

    return (
        <>
            <Header title="Employees" description="Manage your employees." />
            <AuthenticatedLayout>
                <div
                    className="min-h-svh bg-background font-sans"
                    onClick={closeMenu}
                >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                Team
                            </p>

                            <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
                                Employees
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setDepartmentOpen(true)}
                            >
                                Departments
                            </Button>

                            <Button onClick={openAddDialog}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add employee
                            </Button>
                        </div>
                    </div>

                    <EmployeeSearch value={search} onChange={setSearch} />

                    <section className="relative z-0 mt-4 overflow-visible rounded-lg border">
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 p-10 text-center">
                                <UserRoundX className="h-8 w-8 text-muted-foreground" />

                                <p className="text-sm font-medium text-foreground">
                                    {search
                                        ? "No employees match your search"
                                        : "No employees yet"}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                    {search
                                        ? "Try a different name."
                                        : "Add your first employee to get started."}
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
                                <div className="w-full overflow-visible">
                                    <EmployeeTable
                                        employees={paginatedEmployees}
                                        onMenuToggle={toggleMenu}
                                    />
                                </div>

                                <EmployeePagination
                                    page={page}
                                    pageCount={pageCount}
                                    firstRecord={firstRecord}
                                    lastRecord={lastRecord}
                                    total={filtered.length}
                                    onPrevious={() =>
                                        setPage((current) =>
                                            Math.max(1, current - 1),
                                        )
                                    }
                                    onNext={() =>
                                        setPage((current) =>
                                            Math.min(pageCount, current + 1),
                                        )
                                    }
                                />
                            </>
                        )}
                    </section>

                    {activeMenuEmployee &&
                        menuPosition &&
                        createPortal(
                            <EmployeeActionsMenu
                                employee={activeMenuEmployee}
                                position={menuPosition}
                                onClose={closeMenu}
                                onEdit={openEditDialog}
                                onDelete={(employee) => {
                                    setDeleteTarget(employee);
                                    closeMenu();
                                }}
                            />,
                            document.body,
                        )}

                    <EmployeeFormDialog
                        open={formOpen}
                        category={categories}
                        onOpenChange={setFormOpen}
                        employee={editingEmployee}
                    />

                    <DepartmentDialog
                        open={departmentOpen}
                        categories={categories}
                        onOpenChange={setDepartmentOpen}
                    />

                    {deleteTarget && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
                            <div className="w-full max-w-md rounded-[min(var(--radius-4xl),24px)] bg-popover p-6 text-popover-foreground shadow-xl ring-1 ring-foreground/5">
                                <h2 className="text-base font-medium">
                                    Delete {deleteTarget.full_name}?
                                </h2>

                                <p className="mt-2 text-sm text-muted-foreground">
                                    This removes their employee record. This
                                    can't be undone.
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
            </AuthenticatedLayout>
        </>
    );
}
