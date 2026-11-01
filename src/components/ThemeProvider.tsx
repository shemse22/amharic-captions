'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isMobile: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isMobile: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Clean up any legacy global theme key
    try {
      localStorage.removeItem('bgern_theme');
    } catch (e) {}

    // Clean up any legacy Service Worker from old Vite PWA safely on client
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().catch(() => {});
        }
      }).catch(() => {});
    }

    const checkDeviceAndSyncTheme = () => {
      if (typeof window === 'undefined') return;
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (!mobile) {
        // Desktop / Laptop is STRICTLY Light mode only
        setThemeState('light');
        document.documentElement.classList.remove('dark');
      } else {
        // Mobile / Phone supports dark mode
        const stored = localStorage.getItem('bgern_mobile_theme') as Theme | null;
        const mobileTheme: Theme = stored === 'dark' ? 'dark' : 'light';
        setThemeState(mobileTheme);
        if (mobileTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    checkDeviceAndSyncTheme();

    window.addEventListener('resize', checkDeviceAndSyncTheme);
    window.addEventListener('orientationchange', checkDeviceAndSyncTheme);

    return () => {
      window.removeEventListener('resize', checkDeviceAndSyncTheme);
      window.removeEventListener('orientationchange', checkDeviceAndSyncTheme);
    };
  }, []);

  const setTheme = (newTheme: Theme) => {
    if (typeof window === 'undefined') return;
    const mobile = window.innerWidth < 768;

    if (!mobile) {
      // Desktop stays light
      setThemeState('light');
      document.documentElement.classList.remove('dark');
      return;
    }

    setThemeState(newTheme);
    try {
      localStorage.setItem('bgern_mobile_theme', newTheme);
    } catch (e) {}

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, isMobile, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
