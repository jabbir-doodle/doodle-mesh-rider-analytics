"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of our context
interface ThemeContextType {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

// Initialize context with default values
export const ThemeContext = createContext<ThemeContextType>({
    isDarkMode: false,
    toggleTheme: () => { }
});

// Define props interface for ThemeProvider
interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
    const [mounted, setMounted] = useState<boolean>(false);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            setIsDarkMode(false);
            document.body.classList.add('light-mode');
        }
    }, []);

    const toggleTheme = (): void => {
        if (isDarkMode) {
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
        setIsDarkMode(!isDarkMode);
    };

    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

// Simplify useTheme hook
export function useTheme(): ThemeContextType {
    return useContext(ThemeContext);
}