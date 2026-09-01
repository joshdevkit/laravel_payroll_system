import { createInertiaApp } from '@inertiajs/react';

import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

const appName = import.meta.env.VITE_APP_NAME || 'Payroll System';

const pages = import.meta.glob('./pages/**/*.tsx', {
    eager: true,
}) as Record<
    string,
    {
        default: {
            layout?: (page: React.ReactNode) => React.ReactNode;
        };
    }
>;

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),

    resolve: async (name) => {
        const page = pages[`./pages/${name}.tsx`];

        if (!page) {
            throw new Error(`Inertia page not found: ${name}`);
        }

        // Login is the public/authentication page and must not use the
        // authenticated application shell.
        if (name !== 'Login') {
            page.default.layout = (pageContent) => (
                <AuthenticatedLayout>
                    {pageContent}
                </AuthenticatedLayout>
            );
        }

        return page;
    },

    withApp(app) {
        return app;
    },

    progress: {
        color: '#4B5563',
        showSpinner: true,
    },
});
