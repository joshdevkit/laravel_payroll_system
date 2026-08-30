import { useEffect, useState } from 'react';
import { CheckCircle2, X, XCircle } from 'lucide-react';

interface FlashProps {
    success?: string | null;
    error?: string | null;
}

interface FlashMessageProps {
    flash?: FlashProps;
}

export function FlashMessage({ flash }: FlashMessageProps) {
    const [visible, setVisible] = useState(false);

    const message = flash?.success || flash?.error || null;
    const isError = Boolean(flash?.error && !flash?.success);

    useEffect(() => {
        if (!message) {
            setVisible(false);
            return;
        }

        setVisible(true);

        const timeout = window.setTimeout(() => setVisible(false), 3000);

        return () => window.clearTimeout(timeout);
    }, [message]);

    if (!message || !visible) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-[100] flex justify-center px-4">
            <div
                role={isError ? 'alert' : 'status'}
                className={
                    isError
                        ? 'pointer-events-auto flex w-full max-w-xl items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive shadow-sm'
                        : 'pointer-events-auto flex w-full max-w-xl items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 shadow-sm dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400'
                }
            >
                {isError ? (
                    <XCircle className="h-4 w-4 shrink-0" />
                ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                )}

                <span className="flex-1">{message}</span>

                <button
                    type="button"
                    onClick={() => setVisible(false)}
                    className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
                    aria-label="Dismiss notification"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
