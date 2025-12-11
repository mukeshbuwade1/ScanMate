import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DarkTheme, DefaultTheme, Theme as NavigationTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export type ThemeName = 'light' | 'dark';

type ThemeContextValue = {
  theme: ThemeName;
  colors: typeof Colors[ThemeName];
  navTheme: NavigationTheme;
  setTheme: (value: ThemeName) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const buildNavigationTheme = (theme: ThemeName): NavigationTheme => {
  const base = theme === 'dark' ? DarkTheme : DefaultTheme;
  const palette = Colors[theme];

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.tint,
      background: palette.background,
      text: palette.text,
      card: palette.background,
      border: palette.icon,
      notification: palette.tint,
    },
  };
};

export const AppThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const systemScheme = (useColorScheme() ?? 'light') as ThemeName;
  const [theme, setThemeState] = useState<ThemeName>(systemScheme);

  useEffect(() => {
    setThemeState(systemScheme);
  }, [systemScheme]);

  const setTheme = useCallback((value: ThemeName) => setThemeState(value), []);
  const toggleTheme = useCallback(() => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark')), []);

  const navTheme = useMemo(() => buildNavigationTheme(theme), [theme]);
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colors: Colors[theme],
      navTheme,
      setTheme,
      toggleTheme,
    }),
    [navTheme, setTheme, theme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <NavigationThemeProvider value={navTheme}>{children}</NavigationThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
};

