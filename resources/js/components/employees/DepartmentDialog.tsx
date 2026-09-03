import { FormEvent, useState } from "react";
import { router } from "@inertiajs/react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Category } from "../payroll-run/types";


type DepartmentDialogProps = {
    open: boolean;
    categories: Category[];
    onOpenChange: (open: boolean) => void;
};

export function DepartmentDialog({
    open,
    categories,
    onOpenChange,
}: DepartmentDialogProps) {
    const [name, setName] = useState("");
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null,
    );
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

    if (!open) {
        return null;
    }

    const resetForm = () => {
        setName("");
        setEditingCategory(null);
    };

    const startEdit = (category: Category) => {
        setEditingCategory(category);
        setName(category.name);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (!name.trim()) {
            return;
        }

        if (editingCategory) {
            router.put(
                `/categories/${editingCategory.id}`,
                {
                    name: name.trim(),
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        resetForm();
                    },
                },
            );

            return;
        }

        router.post(
            "/categories",
            {
                name: name.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    resetForm();
                },
            },
        );
    };

    const deleteCategory = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(`/categories/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-[min(var(--radius-4xl),24px)] bg-popover text-popover-foreground shadow-xl ring-1 ring-foreground/5">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                        <h2 className="text-base font-semibold">
                            Departments
                        </h2>

                        <p className="mt-1 text-xs text-muted-foreground">
                            Manage employee departments.
                        </p>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            resetForm();
                            onOpenChange(false);
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Add/Edit */}
                <form
                    onSubmit={submit}
                    className="flex gap-2 border-b p-4"
                >
                    <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Department name"
                    />

                    <Button type="submit">
                        {editingCategory ? (
                            "Update"
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                Add
                            </>
                        )}
                    </Button>

                    {editingCategory && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetForm}
                        >
                            Cancel
                        </Button>
                    )}
                </form>

                {/* List */}
                <div className="max-h-[400px] overflow-y-auto p-4">
                    {categories.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            No departments yet.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                                >
                                    <span className="text-sm font-medium">
                                        {category.name}
                                    </span>

                                    <div className="flex gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                startEdit(category)
                                            }
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() =>
                                                setDeleteTarget(category)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 p-4">
                    <div className="w-full max-w-md rounded-xl bg-popover p-6 shadow-xl">
                        <h3 className="text-base font-semibold">
                            Delete {deleteTarget.name}?
                        </h3>

                        <p className="mt-2 text-sm text-muted-foreground">
                            This department will be permanently removed.
                        </p>

                        <div className="mt-6 flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteTarget(null)}
                            >
                                Cancel
                            </Button>

                            <Button
                                variant="destructive"
                                onClick={deleteCategory}
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