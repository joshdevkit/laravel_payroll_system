import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Loader2, X } from 'lucide-react';
import { router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PayrollRegisterTable } from '@/components/payroll-run/PayrollRegisterTable';
import type { PayrollRun } from '@/components/payroll-run/types';

import {
    formatDate,
    statusClass,
} from '@/components/payroll-run/payrollRunUtils';

import {
    exportPayrollRunToExcel,
} from '@/hooks/exportPayrollRun';

import PayrollItemMobileCard
    from '@/components/payroll-run/PayrollItemMobileCard';

export default function Show({
    payrollRun,
}: {
    payrollRun: PayrollRun;
}) {
    // console.log('payrollRun:', payrollRun);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        const previous =
            document.body.style.overflow;

        document.body.style.overflow =
            'hidden';

        const escape = (
            event: KeyboardEvent,
        ) => {
            if (event.key === 'Escape') {
                window.history.back();
            }
        };

        document.addEventListener(
            'keydown',
            escape,
        );

        return () => {
            document.body.style.overflow =
                previous;

            document.removeEventListener(
                'keydown',
                escape,
            );
        };
    }, []);

    const confirmPayroll = () => {
        if (
            payrollRun.status !==
            'draft'
        ) {
            return;
        }

        setConfirming(true);

        router.patch(
            `/payroll/${payrollRun.id}/confirm`,
            {},
            {
                preserveScroll: true,

                onFinish: () =>
                    setConfirming(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
            <div className="flex min-h-0 flex-1 flex-col">
                {/* HEADER */}
                <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-4 sm:px-6 sm:py-5">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-semibold sm:text-lg">
                                Review Payroll
                            </h2>

                            <Badge
                                variant="outline"
                                className={
                                    statusClass[
                                    payrollRun.status
                                    ] ?? ''
                                }
                            >
                                {payrollRun.status}
                            </Badge>
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                            {formatDate(
                                payrollRun.cutoff_start,
                            )}
                            {' – '}
                            {formatDate(
                                payrollRun.cutoff_end,
                            )}
                            {' · Pay date '}
                            {formatDate(
                                payrollRun.pay_date,
                            )}
                        </p>

                        <p className="mt-1 text-[11px] text-muted-foreground">
                            Payroll uses each employee&apos;s
                            date-specific schedule. Overnight
                            attendance remains attached to the
                            date the shift started.
                        </p>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() =>
                            window.history.back()
                        }
                        aria-label="Close review"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* CONTENT */}
                {payrollRun.items.length === 0 ? (
                    <div className="p-10 text-center text-sm text-muted-foreground">
                        No payroll items were generated
                        for this run.
                    </div>
                ) : (
                    <>
                        {/* MOBILE */}
                        <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:hidden">
                            <div className="space-y-2">
                                {payrollRun.items.map((item) => (
                                    <PayrollItemMobileCard
                                        key={item.id}
                                        item={item}
                                        leavePayEnabled
                                    />
                                ))}
                            </div>
                        </div>

                        {/* DESKTOP */}
                        <div className="hidden min-h-0 flex-1 overflow-auto px-6 py-4 sm:block">
                            <PayrollRegisterTable
                                items={payrollRun.items}
                            />
                        </div>

                        <p className="shrink-0 px-4 pb-3 text-xs text-muted-foreground sm:px-6">
                            Clock-in/out timestamps may differ
                            from the scheduled time. Actual
                            timestamps are used for late,
                            undertime, overtime, and night
                            differential, while overnight
                            attendance stays on its shift-start
                            date.

                            <br />

                            <span className="font-semibold text-red-600 dark:text-red-400">
                                Tip: you can use (esc) key to close
                                this preview. — Click the name to
                                check attendance details.
                            </span>
                        </p>
                    </>
                )}
            </div>

            {/* FOOTER */}
            <div className="shrink-0 border-t bg-background px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">

                    {/* Export: Draft + Completed */}
                    {(payrollRun.status === 'draft' ||
                        payrollRun.status === 'completed') && (
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() =>
                                    exportPayrollRunToExcel(
                                        payrollRun,
                                        payrollRun.items,
                                    )
                                }
                                disabled={!payrollRun.items.length}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export to Excel
                            </Button>
                        )}

                    {/* Back: Draft + Completed */}
                    {(payrollRun.status === 'draft' ||
                        payrollRun.status === 'completed') && (
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => window.history.back()}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        )}

                    {/* Confirm: Draft only */}
                    {payrollRun.status === 'draft' ? (
                        <Button
                            className="w-full sm:w-auto"
                            onClick={confirmPayroll}
                            disabled={
                                confirming ||
                                payrollRun.items.length === 0
                            }
                        >
                            {confirming && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}

                            Confirm Payroll
                        </Button>
                    ) : (
                        /* Close: Non-draft/non-completed */
                        payrollRun.status !== 'completed' && (
                            <Button
                                className="w-full sm:w-auto"
                                onClick={() => window.history.back()}
                            >
                                Close
                            </Button>
                        )
                    )}
                </div>
            </div>

        </div>
    );
}
