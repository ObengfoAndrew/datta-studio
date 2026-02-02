// src/components/shared/theme.ts

export interface Theme {
  bg: string;
  cardBg: string;
  text: string;
  textSecondary: string;
  border: string;
  borderLight: string;
  searchBg: string;
  sidebarBg: string;
  activityBg: string;
  hover?: string;
}

export const themes = {
  light: {
    bg: '#f8fafc',
    cardBg: 'white',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e5e7eb',
    borderLight: '#f1f5f9',
    searchBg: '#f8fafc',
    sidebarBg: 'white',
    activityBg: '#f8fafc',
    hover: '#e0e7ff'
  },
  dark: {
    bg: '#0f172a',
    cardBg: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
    borderLight: '#475569',
    searchBg: '#334155',
    sidebarBg: '#1e293b',
    activityBg: '#334155',
    hover: '#312e81'
  }
} as const;

export type ThemeMode = 'light' | 'dark';

export const getTheme = (isDarkMode: boolean): Theme => {
  return isDarkMode ? themes.dark : themes.light;
};