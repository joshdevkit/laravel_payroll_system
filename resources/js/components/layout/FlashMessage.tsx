import { useEffect, useState } from 'react';
import { CheckCircle2, X, XCircle } from 'lucide-react';
import { usePage } from '@inertiajs/react';

import { useLayoutShell } from '@/components/layout/LayoutShellContext';

interface FlashProps {
    success?: string | null;
    error?: string | null;
}

interface PageProps {
    [key: string]: unknown;
    flash?: FlashProps;
}

export function FlashMessage() {
    const inLayoutShell = useLayoutShell();
    const { flash } = usePage<PageProps>().props;
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const nextMessage = flash?.error || flash?.success || null;

        if (!nextMessage) {
            return;
        }

        setMessage(nextMessage);
        setIsError(Boolean(flash?.error));
        setVisible(true);

        const timeout = window.setTimeout(() => {
            setVisible(false);
        }, 3000);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [flash?.success, flash?.error]);

    if (inLayoutShell || !message || !visible) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed right-4 top-20 z-[100] w-full max-w-sm sm:right-6 sm:top-6">
            <div
                role={isError ? 'alert' : 'status'}
                className={
                    isError
                        ? 'pointer-events-auto flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive shadow-lg'
                        : 'pointer-events-auto flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 shadow-lg dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400'
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
