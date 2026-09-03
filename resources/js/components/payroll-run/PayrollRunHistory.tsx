import { Eye, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { PayrollRun } from "./types";

const formatDate = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

const statusClass: Record<string, string> = {
    draft: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
    completed:
        "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400",
};

export function PayrollRunHistory({
    runs,
    loading,
    error,
    processingId,
    deletingId,
    onReview,
    onDelete,
}: {
    runs: PayrollRun[];
    loading?: boolean;
    error?: string | null;
    processingId?: string | null;
    deletingId?: string | null;
    onReview: (run: PayrollRun) => void;
    onDelete: (run: PayrollRun) => void;
}) {
    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="font-display text-base">
                    Payroll history
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="p-10 text-center text-sm text-muted-foreground">
                        Loading payroll runs…
                    </div>
                ) : error ? (
                    <div className="p-10 text-center text-sm text-destructive">
                        Couldn't load payroll runs: {error}
                    </div>
                ) : runs.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium">
                            No payroll runs yet
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Create a cutoff period to start processing payroll.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Cutoff</TableHead>
                                    <TableHead>Pay date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Action
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {runs.map((run) => (
                                    <TableRow key={run.id}>
                                        <TableCell className="font-medium">
                                            {run.category?.name || 'N/A'}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {formatDate(run.cutoff_start)} –{" "}
                                            {formatDate(run.cutoff_end)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(run.pay_date)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    statusClass[run.status] ??
                                                    ""
                                                }
                                            >
                                                {run.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        onReview(run)
                                                    }
                                                    disabled={
                                                        processingId ===
                                                            run.id ||
                                                        deletingId === run.id
                                                    }
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    {run.status === "draft"
                                                        ? "Review payroll"
                                                        : "View"}
                                                </Button>
                                                {run.status === "draft" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() =>
                                                            onDelete(run)
                                                        }
                                                        disabled={
                                                            processingId ===
                                                                run.id ||
                                                            deletingId ===
                                                                run.id
                                                        }
                                                        aria-label="Delete payroll run"
                                                    >
                                                        {deletingId ===
                                                        run.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
