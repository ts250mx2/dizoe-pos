'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'dark',
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('dizoe-theme') as Theme | null;
    const initial = saved || 'dark';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);

    // Apply custom colors from config
    applyCustomColors();
  }, []);

  const applyCustomColors = async () => {
    try {
      const res = await fetch('/api/config/ticket');
      if (!res.ok) return;
      const cfg = await res.json();
      if (cfg.PrimaryColor) document.documentElement.style.setProperty('--gold', cfg.PrimaryColor);
      if (cfg.PrimaryHover) document.documentElement.style.setProperty('--gold-deep', cfg.PrimaryHover);
      if (cfg.AccentColor)  document.documentElement.style.setProperty('--gold-light', cfg.AccentColor);
      if (cfg.PrimaryColor) document.documentElement.style.setProperty('--primary', cfg.PrimaryColor);
      if (cfg.PrimaryHover) document.documentElement.style.setProperty('--primary-hover', cfg.PrimaryHover);
    } catch { /* ignore */ }
  };

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dizoe-theme', next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
