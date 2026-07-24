import { useThemeStore } from '@/src/stores/theme';

export function useThemeColor() {
  const isDark = useThemeStore((s) => s.isDark);

  return {
    foreground: isDark ? '#F9FAFB' : '#1F2937',
    muted: isDark ? '#9CA3AF' : '#7C6F64',
    background: isDark ? '#0F1419' : '#FFFBF7',
    card: isDark ? '#1A1F24' : '#FFFFFF',
    border: isDark ? '#2A2F35' : '#F0EAE3',
    primary: isDark ? '#4ADE80' : '#16A34A',
    danger: isDark ? '#F87171' : '#EF4444',
    warning: isDark ? '#FBBF24' : '#F59E0B',
    info: isDark ? '#60A5FA' : '#3B82F6',
    white: '#FFFFFF',
  };
}
