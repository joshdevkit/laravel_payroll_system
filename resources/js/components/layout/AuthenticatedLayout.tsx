import type { ReactNode } from 'react';

import { FlashMessage } from '@/components/layout/FlashMessage';
import { Navbar } from '@/components/layout/Navbar';
import { LayoutShellProvider } from '@/components/layout/LayoutShellContext';

interface AuthenticatedLayoutProps {
    children: ReactNode;
}

export default function AuthenticatedLayout({
    children,
}: AuthenticatedLayoutProps) {
    return (
        <div className="min-h-svh bg-background font-sans">
            <Navbar />

            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
                <LayoutShellProvider>
                    {children}
                    <FlashMessage />
                </LayoutShellProvider>
            </main>
        </div>
    );
}