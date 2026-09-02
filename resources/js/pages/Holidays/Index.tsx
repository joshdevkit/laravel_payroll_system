import { useEffect, useMemo, useState } from "react";
import {
    CalendarClock,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Plus,
    RefreshCw,
    Trash2,
} from "lucide-react";
import { router } from "@inertiajs/react";
import { Navbar } from "@/components/layout/Navbar";
import { FlashMessage } from "@/components/layout/FlashMessage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";

type HolidayType = "regular" | "special_non_working" | "local";

type Holiday = {
    id: string;
    date: string;
    name: string;
    type: HolidayType;
    notes: string | null;
};

type HolidayForm = Omit<Holiday, "id">;

const PAGE_SIZE = 15;
const emptyForm: HolidayForm = {
    date: "",
    name: "",
    type: "regular",
    notes: null,
};
const typeLabel: Record<HolidayType, string> = {
    regular: "Regular Holiday",
    special_non_working: "Special Non-Working Day",
    local: "Local Holiday",
};

export default function Holidays({
    holidays,
    currentYear,
}: {
    holidays: Holiday[];
    currentYear: number;
}) {
    const [page, setPage] = useState(1);
    const [syncYear, setSyncYear] = useState(currentYear);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editing, setEditing] = useState<Holiday | null>(null);
    const [deleting, setDeleting] = useState<Holiday | null>(null);
    const [form, setForm] = useState<HolidayForm>(emptyForm);
    const [busy, setBusy] = useState(false);

    const pageCount = Math.max(1, Math.ceil(holidays.length / PAGE_SIZE));
    const paginated = holidays.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const years = useMemo(
        () => Array.from({ length: 5 }, (_, index) => currentYear - 2 + index),
        [currentYear],
    );

    useEffect(() => {
        if (page > pageCount) setPage(pageCount);
    }, [page, pageCount]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setFormOpen(true);
    };

    const openEdit = (holiday: Holiday) => {
        setEditing(holiday);
        setForm({
            date: holiday.date,
            name: holiday.name,
            type: holiday.type,
            notes: holiday.notes,
        });
        setFormOpen(true);
    };

    const save = () => {
        if (!form.date || !form.name.trim()) return;
        setBusy(true);
        const payload = {
            ...form,
            name: form.name.trim(),
            notes: form.notes?.trim() || null,
        };
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setFormOpen(false);
                setPage(1);
            },
            onFinish: () => setBusy(false),
        };
        if (editing) router.put(`/holidays/${editing.id}`, payload, options);
        else router.post("/holidays", payload, options);
    };

    const remove = () => {
        if (!deleting) return;
        setBusy(true);
        router.delete(`/holidays/${deleting.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                setDeleting(null);
            },
            onFinish: () => setBusy(false),
        });
    };

    const sync = () => {
        setBusy(true);
        router.post(
            "/holidays/sync",
            { year: syncYear },
            {
                preserveScroll: true,
                onSuccess: () => setPage(1),
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <>
            <AuthenticatedLayout>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                            Calendar
                        </p>
                        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
                            Holidays
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Manage holidays used by attendance and payroll
                            calculations.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            aria-label="Holiday sync year"
                            value={syncYear}
                            onChange={(e) =>
                                setSyncYear(Number(e.target.value))
                            }
                            disabled={busy}
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                    {year === currentYear ? " (Current)" : ""}
                                </option>
                            ))}
                        </select>
                        <Button
                            variant="outline"
                            onClick={sync}
                            disabled={busy}
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 ${busy ? "animate-spin" : ""}`}
                            />
                            {busy ? "Working…" : `Sync ${syncYear}`}
                        </Button>
                        <Button onClick={openCreate} disabled={busy}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Holiday
                        </Button>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span>
                        {holidays.length} holiday
                        {holidays.length === 1 ? "" : "s"} loaded
                    </span>
                    {holidays.length > 0 && (
                        <span>
                            {Array.from(
                                new Set(
                                    holidays.map((holiday) =>
                                        holiday.date.slice(0, 4),
                                    ),
                                ),
                            )
                                .sort()
                                .join(", ")}
                        </span>
                    )}
                </div>

                <div className="mt-3 overflow-hidden rounded-lg border">
                    {holidays.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 p-12 text-center">
                            <CalendarClock className="h-9 w-9 text-muted-foreground" />
                            <p className="font-medium">No holidays found</p>
                            <p className="max-w-md text-sm text-muted-foreground">
                                Select a year and sync the Philippine holiday
                                calendar, or add a custom holiday.
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Holiday</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Notes</TableHead>
                                        <TableHead className="w-[120px] text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginated.map((holiday) => (
                                        <TableRow key={holiday.id}>
                                            <TableCell className="font-medium">
                                                {new Date(
                                                    `${holiday.date}T00:00:00`,
                                                ).toLocaleDateString("en-PH", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                {holiday.name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {typeLabel[holiday.type]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {holiday.notes || "—"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() =>
                                                            openEdit(holiday)
                                                        }
                                                        title="Edit holiday"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        <span className="sr-only">
                                                            Edit
                                                        </span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => {
                                                            setDeleting(
                                                                holiday,
                                                            );
                                                            setDeleteOpen(true);
                                                        }}
                                                        title="Delete holiday"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">
                                                            Delete
                                                        </span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
                                <p className="text-sm text-muted-foreground">
                                    Showing {(page - 1) * PAGE_SIZE + 1}–
                                    {Math.min(
                                        page * PAGE_SIZE,
                                        holidays.length,
                                    )}{" "}
                                    of {holidays.length} holidays
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setPage((p) => Math.max(1, p - 1))
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
                                            setPage((p) =>
                                                Math.min(pageCount, p + 1),
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

                <Dialog open={formOpen} onOpenChange={setFormOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editing ? "Edit Holiday" : "Add Holiday"}
                            </DialogTitle>
                            <DialogDescription>
                                Configure the holiday date, type, and notes.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="holiday-date">Date</Label>
                                <Input
                                    id="holiday-date"
                                    type="date"
                                    value={form.date}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            date: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="holiday-name">
                                    Holiday Name
                                </Label>
                                <Input
                                    id="holiday-name"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. National Heroes Day"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="holiday-type">Type</Label>
                                <select
                                    id="holiday-type"
                                    className="h-9 rounded-md border bg-background px-3 text-sm"
                                    value={form.type}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            type: e.target.value as HolidayType,
                                        })
                                    }
                                >
                                    <option value="regular">
                                        Regular Holiday
                                    </option>
                                    <option value="special_non_working">
                                        Special Non-Working Day
                                    </option>
                                    <option value="local">Local Holiday</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="holiday-notes">Notes</Label>
                                <Input
                                    id="holiday-notes"
                                    value={form.notes ?? ""}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            notes: e.target.value,
                                        })
                                    }
                                    placeholder="Optional notes"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setFormOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={save}
                                disabled={
                                    busy || !form.date || !form.name.trim()
                                }
                            >
                                {busy ? "Saving…" : "Save Holiday"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Holiday</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete {deleting?.name}
                                ? This cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setDeleteOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={remove}
                                disabled={busy}
                            >
                                {busy ? "Deleting…" : "Delete Holiday"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </AuthenticatedLayout>
        </>
    );
}
