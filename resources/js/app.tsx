import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import LoadingOverlay from './components/LoadingOverlay'

const appName = import.meta.env.VITE_APP_NAME || 'Payroll System'

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,

    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.tsx')
        const importPage = pages[`./Pages/${name}.tsx`]

        if (!importPage) {
            throw new Error(
                `Page component "./Pages/${name}.tsx" could not be found.`,
            )
        }

        return importPage() as Promise<any>
    },

    setup({ el, App, props }) {
        createRoot(el).render(
        <>
        <App {...props} />
        <LoadingOverlay />
        </>
    )
    },

    progress: false,
})