"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const THEMES = [
    { value: 'dark', label: 'Dark' },
    { value: 'theme-light', label: 'Light' },
    { value: 'theme-cyberpunk', label: 'Cyberpunk' },
    { value: 'theme-ocean', label: 'Ocean' },
    { value: 'theme-forest', label: 'Forest' },
    { value: 'theme-sunset', label: 'Sunset' },
    { value: 'theme-amber', label: 'Amber Terminal' },
    { value: 'theme-contrast', label: 'High Contrast' },
];

const THEME_CLASSES = THEMES.map(t => t.value);

export function ThemeProvider({ children }) {
    const { user } = useAuth();
    const [theme, setTheme] = useState('dark');
    const [settings, setSettings] = useState(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://morsecode-production-8a2d.up.railway.app/api";

    const applyThemeToHtml = (selectedTheme) => {
        // Remove old theme classes
        document.documentElement.classList.remove(...THEME_CLASSES);

        // Add new theme class
        if (selectedTheme === 'dark') {
            // For default Next.js Tailwind dark mode
            document.documentElement.classList.add('dark');
        } else if (selectedTheme) {
            document.documentElement.classList.add(selectedTheme);
        }
    };

    // Apply cached theme immediately on mount, and sync with backend in background
    useEffect(() => {
        const cachedTheme = localStorage.getItem('cachedTheme');
        if (cachedTheme) {
            setTheme(cachedTheme);
            applyThemeToHtml(cachedTheme);
        }

        // Only fetch from backend if we have a user and no cached theme, or to sync in background
        if (user) {
            const fetchSettings = async () => {
                try {
                    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                    if (!token) return;

                    const response = await fetch(`${API_URL}/settings`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setSettings(data);
                        
                        // Only update theme if backend has different theme than cached
                        if (data.theme && data.theme !== cachedTheme) {
                            setTheme(data.theme);
                            applyThemeToHtml(data.theme);
                            localStorage.setItem('cachedTheme', data.theme);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching theme settings:', error);
                }
            };

            fetchSettings();
        } else if (!cachedTheme) {
            // Only reset to default if no cached theme and no user
            setTheme('dark');
            applyThemeToHtml('dark');
        }
    }, [user]);

    const updateTheme = async (newTheme) => {
        // Optimistic UI update with caching
        setTheme(newTheme);
        applyThemeToHtml(newTheme);
        localStorage.setItem('cachedTheme', newTheme);

        if (!user) return; // Only save to backend if logged in

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ theme: newTheme })
            });

            if (response.ok) {
                const updatedSettings = await response.json();
                setSettings(updatedSettings);
            } else {
                console.error('Failed to update theme to backend');
            }
        } catch (error) {
            console.error('Error updating theme:', error);
        }
    };

    const value = {
        theme,
        settings,
        updateTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
