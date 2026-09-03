import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2 } from "lucide-react";
import type { Category, PayrollRun } from "./types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

export function CreatePayrollRunDialog({
    open,
    onOpenChange,
    categories,
    selectedCategory,
    onCategoryChange,
    cutoffStart,
    cutoffEnd,
    payDate,
    onCutoffStartChange,
    onCutoffEndChange,
    onPayDateChange,
    onCreate,
    saving,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: Category[];
    selectedCategory: Category | null;
    onCategoryChange: (category: Category | null) => void;
    cutoffStart: string;
    cutoffEnd: string;
    payDate: string;
    onCutoffStartChange: (v: string) => void;
    onCutoffEndChange: (v: string) => void;
    onPayDateChange: (v: string) => void;
    onCreate: () => void;
    saving: boolean;
}) {
    const invalid =
        !cutoffStart || !cutoffEnd || !payDate || cutoffEnd < cutoffStart;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New payroll register</DialogTitle>
                    <DialogDescription>
                        Set the cutoff period and pay date. The run starts as a
                        draft.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <label className="grid gap-2 text-sm font-medium">
                        Department
                        <Select
                            value={selectedCategory?.id.toString() ?? ""}
                            onValueChange={(value) => {
                                const category = categories.find(
                                    (category) =>
                                        category.id.toString() === value,
                                );

                                onCategoryChange(category ?? null);
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a department">
                                    {selectedCategory?.name}
                                </SelectValue>
                            </SelectTrigger>

                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem
                                        key={category.id}
                                        value={category.id.toString()}
                                    >
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                        Cutoff start
                        <Input
                            type="date"
                            value={cutoffStart}
                            onChange={(e) =>
                                onCutoffStartChange(e.target.value)
                            }
                        />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                        Cutoff end
                        <Input
                            type="date"
                            value={cutoffEnd}
                            min={cutoffStart || undefined}
                            onChange={(e) => onCutoffEndChange(e.target.value)}
                        />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                        Pay date
                        <Input
                            type="date"
                            value={payDate}
                            onChange={(e) => onPayDateChange(e.target.value)}
                        />
                    </label>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button onClick={onCreate} disabled={saving || invalid}>
                        {saving && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create run
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function DeletePayrollRunDialog({
    open,
    onOpenChange,
    target,
    deleting,
    onDelete,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    target: PayrollRun | null;
    deleting: boolean;
    onDelete: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={(v) => !deleting && onOpenChange(v)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete payroll run?</DialogTitle>
                    <DialogDescription>
                        {target
                            ? `Are you sure you want to delete the payroll run for ${target.cutoff_start} – ${target.cutoff_end}? This will permanently remove the run and its payroll items.`
                            : "This action cannot be undone."}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={deleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onDelete}
                        disabled={!target || deleting}
                    >
                        {deleting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete payroll run
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
