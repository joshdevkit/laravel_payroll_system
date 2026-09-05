import { createInertiaApp } from "@inertiajs/react";

const appName = import.meta.env.VITE_APP_NAME;

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    withApp(app) {
        return (
            <>
                {app}
            </>
        );
    },
    progress: { color: "#4B5563", showSpinner: false },
});
