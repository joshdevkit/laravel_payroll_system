import { toast as toastManager } from "@/components/ui/toast";

interface ToastOptions {
    title?: string;
    description?: string;
    type?: "success" | "error" | "info" | "warning" | "loading";
}

export function useToast() {
    const toast = (options: ToastOptions) => {
        toastManager.add({
            title: options.title,
            description: options.description,
            type: options.type,
        });
    };

    return {
        toast: {
            add: toast,

            success: (
                description: string,
                title = "Success",
            ) => {
                toast({
                    title,
                    description,
                    type: "success",
                });
            },

            error: (
                description: string,
                title = "Error",
            ) => {
                toast({
                    title,
                    description,
                    type: "error",
                });
            },

            info: (
                description: string,
                title = "Information",
            ) => {
                toast({
                    title,
                    description,
                    type: "info",
                });
            },

            warning: (
                description: string,
                title = "Warning",
            ) => {
                toast({
                    title,
                    description,
                    type: "warning",
                });
            },

            loading: (
                description: string,
                title = "Loading",
            ) => {
                toast({
                    title,
                    description,
                    type: "loading",
                });
            },
        },
    };
}