import { FormEvent, useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type Branch = {
    id: string;
    name: string;
};

type BranchDialogProps = {
    open: boolean;
    branches: Branch[];
    onOpenChange: (open: boolean) => void;
};

export function BranchDialog({
    open,
    branches,
    onOpenChange,
}: BranchDialogProps) {
    const [name, setName] = useState("");
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

    const [errors, setErrors] = useState<{
        name?: string;
    }>({});

    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!open) {
            setName("");
            setEditingBranch(null);
            setErrors({});
        }
    }, [open]);

    const startCreate = () => {
        setEditingBranch(null);
        setName("");
        setErrors({});
    };

    const startEdit = (branch: Branch) => {
        setEditingBranch(branch);
        setName(branch.name);
        setErrors({});
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();

        setErrors({});
        setProcessing(true);

        const options = {
            preserveScroll: true,

            onSuccess: () => {
                setName("");
                setEditingBranch(null);
                setErrors({});
            },

            onError: (formErrors: Record<string, string>) => {
                setErrors({
                    name: formErrors.name,
                });
            },

            onFinish: () => {
                setProcessing(false);
            },
        };

        if (editingBranch) {
            router.put(
                `/branches/${editingBranch.id}`,
                {
                    name,
                },
                options,
            );
        } else {
            router.post(
                "/branches",
                {
                    name,
                },
                options,
            );
        }
    };

    const handleDelete = (branch: Branch) => {
        if (
            !window.confirm(
                `Delete "${branch.name}"? This cannot be undone.`,
            )
        ) {
            return;
        }

        router.delete(`/branches/${branch.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Branches</DialogTitle>

                    <DialogDescription>
                        Manage the branches available in your payroll system.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4 rounded-lg border p-4"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium">
                                    {editingBranch
                                        ? "Edit branch"
                                        : "Add branch"}
                                </h3>

                                <p className="text-xs text-muted-foreground">
                                    Enter the branch name.
                                </p>
                            </div>

                            {editingBranch && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={startCreate}
                                >
                                    Cancel edit
                                </Button>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="branch-name">
                                Branch name
                            </Label>

                            <Input
                                id="branch-name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Enter branch name"
                                disabled={processing}
                                autoFocus
                            />

                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={
                                processing ||
                                name.trim().length === 0
                            }
                            className="w-full"
                        >
                            {editingBranch ? (
                                <>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Update branch
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add branch
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">
                                Existing branches
                            </h3>

                            <span className="text-xs text-muted-foreground">
                                {branches.length}{" "}
                                {branches.length === 1
                                    ? "branch"
                                    : "branches"}
                            </span>
                        </div>

                        {branches.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-6 text-center">
                                <p className="text-sm text-muted-foreground">
                                    No branches yet.
                                </p>
                            </div>
                        ) : (
                            <div className="max-h-64 overflow-y-auto rounded-lg border">
                                {branches.map((branch) => (
                                    <div
                                        key={branch.id}
                                        className="flex items-center justify-between gap-3 border-b p-3 last:border-b-0"
                                    >
                                        <p className="min-w-0 truncate text-sm font-medium">
                                            {branch.name}
                                        </p>

                                        <div className="flex shrink-0 items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    startEdit(branch)
                                                }
                                                title="Edit branch"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() =>
                                                    handleDelete(branch)
                                                }
                                                title="Delete branch"
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

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}