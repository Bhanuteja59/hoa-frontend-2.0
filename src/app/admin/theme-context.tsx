"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "dark" | "light";

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
    theme: "dark",
    toggle: () => { },
});

export function AdminThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark");

    useEffect(() => {
        const stored = localStorage.getItem("admin-theme") as Theme | null;
        if (stored) setTheme(stored);
    }, []);

    const toggle = () => {
        setTheme(t => {
            const next = t === "dark" ? "light" : "dark";
            localStorage.setItem("admin-theme", next);
            return next;
        });
    };

    return (
        <ThemeCtx.Provider value={{ theme, toggle }}>
            <div data-admin-theme={theme}>{children}</div>
        </ThemeCtx.Provider>
    );
}

export const useAdminTheme = () => useContext(ThemeCtx);
