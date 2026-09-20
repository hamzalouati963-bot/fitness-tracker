import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { settingsRepo } from '../database/repositories';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  colors: typeof LIGHT_COLORS;
}

const LIGHT_COLORS = {
  background: '#F9FAFB',
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  primary: '#2563EB',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  icon: '#1F2937',
};

const DARK_COLORS = {
  background: '#111827',
  card: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  border: '#374151',
  primary: '#3B82F6',
  success: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
  icon: '#F9FAFB',
};

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  resolved: 'light',
  setMode: () => {},
  colors: LIGHT_COLORS,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const appearance = await settingsRepo.getAppearance();
        if (appearance.theme) setModeState(appearance.theme);
      } catch (_e) { /* use default */ }
      setLoaded(true);
    })();
  }, []);

  const resolved: ResolvedTheme = mode === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : mode === 'dark' ? 'dark' : 'light';

  const colors = resolved === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    settingsRepo.updateAppearance({ theme: newMode }).catch(() => {});
  }, []);

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
