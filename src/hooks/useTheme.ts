import React from 'react';
import { useAppStore } from '../store/appStore';

export function useTheme() {
  const { theme, setTheme } = useAppStore();

  React.useEffect(() => {
    const root = document.documentElement;
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', dark);
  }, [theme]);

  const cycleTheme = React.useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, cycleTheme };
}