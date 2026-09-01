import { createInertiaApp } from '@inertiajs/react';

import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

const appName = import.meta.env.VITE_APP_NAME || 'Payroll System';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),

    // All application pages use the authenticated shell.
    // The login page remains public and renders without the shell.
    layout: (name) => (name === 'Login' ? null : AuthenticatedLayout),

    withApp(app) {
        return app;
    },

    progress: {
        color: '#4B5563',
        showSpinner: true,
    },
});
