import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'react-toastify';

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

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    if (inLayoutShell) {
        return null;
    }

    return null;
}