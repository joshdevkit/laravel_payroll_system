import { createInertiaApp } from "@inertiajs/react";
import { ToastContainer } from "react-toastify";

const appName = import.meta.env.VITE_APP_NAME;

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    withApp(app) {
        return (
            <>
                {app}
                {/* <LoadingOverlay /> */}
                <ToastContainer
                    position="top-center"
                    autoClose={2000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick={false}
                    rtl={false}
                    pauseOnFocusLoss
                    draggable={false}
                    pauseOnHover={false}
                    theme="light"
                />
            </>
        );
    },
    progress: { color: "#4B5563", showSpinner: false },
});
