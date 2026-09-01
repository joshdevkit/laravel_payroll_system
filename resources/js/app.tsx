import { createInertiaApp } from '@inertiajs/react'

const appName = import.meta.env.VITE_APP_NAME || 'Payroll System'

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    withApp(app) {
        return (
            <>
                {app}
                {/* <LoadingOverlay /> */}
            </>
        )
    },
    progress: { color: '#4B5563', showSpinner: true },
})