import { useEffect, useState, type ReactNode } from "react";
import {
    CheckCircle2Icon,
    CircleAlertIcon,
} from "lucide-react";
import { router, usePage } from "@inertiajs/react";

import { Navbar } from "@/components/layout/Navbar";
import { LayoutShellProvider } from "@/components/layout/LayoutShellContext";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";

interface Flash {
    success?: string | null;
    error?: string | null;
}

interface PageProps {
    flash?: Flash;
    [key: string]: unknown;
}

interface AuthenticatedLayoutProps {
    children: ReactNode;
}

export default function AuthenticatedLayout({
    children,
}: AuthenticatedLayoutProps) {
    const page = usePage<PageProps>();

    const [flash, setFlash] = useState<Flash | null>(null);

    useEffect(() => {
        const removeListener = router.on("success", (event) => {
            const newFlash = event.detail.page.props.flash as
                | Flash
                | undefined;

            if (!newFlash?.success && !newFlash?.error) {
                return;
            }

            setFlash(newFlash);

            window.setTimeout(() => {
                setFlash(null);
            }, 2000);
        });

        return () => {
            removeListener();
        };
    }, []);

    return (
        <div className="min-h-svh bg-background font-sans">
            <Navbar />

            {flash?.success && (
                <Alert
                    className="
                        fixed left-1/2 top-6 z-[100]
                        w-[calc(100%-2rem)] max-w-md
                        -translate-x-1/2
                        border-green-600
                        bg-green-600
                        text-white
                        shadow-lg
                        dark:border-green-600
                        dark:bg-green-600
                        dark:text-white
                    "
                >
                    <CheckCircle2Icon className="text-white" />

                    <AlertTitle className="text-white">
                        Success
                    </AlertTitle>

                    <AlertDescription className="text-white/90">
                        {flash.success}
                    </AlertDescription>
                </Alert>
            )}

            {flash?.error && (
                <Alert
                    className="
                        fixed left-1/2 top-6 z-[100]
                        w-[calc(100%-2rem)] max-w-md
                        -translate-x-1/2
                        border-red-600
                        bg-red-600
                        text-white
                        shadow-lg
                        dark:border-red-600
                        dark:bg-red-600
                        dark:text-white
                    "
                >
                    <CircleAlertIcon className="text-white" />

                    <AlertTitle className="text-white">
                        Error
                    </AlertTitle>

                    <AlertDescription className="text-white/90">
                        {flash.error}
                    </AlertDescription>
                </Alert>
            )}

            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
                <LayoutShellProvider>
                    {children}
                </LayoutShellProvider>
            </main>
        </div>
    );
}