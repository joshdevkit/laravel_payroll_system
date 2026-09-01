import { createContext, useContext, type ReactNode } from 'react';

const LayoutShellContext = createContext(false);

export function LayoutShellProvider({ children }: { children: ReactNode }) {
    return (
        <LayoutShellContext.Provider value={true}>
            {children}
        </LayoutShellContext.Provider>
    );
}

export function useLayoutShell() {
    return useContext(LayoutShellContext);
}
