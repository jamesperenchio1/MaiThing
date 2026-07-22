import { useThemeStore } from '@/src/stores/theme';

export function useThemeColor() {
  const isDark = useThemeStore((s) => s.isDark);

  return {
    foreground: isDark ? '#F9FAFB' : '#111827',
    muted: isDark ? '#9CA3AF' : '#6B7280',
    background: isDark ? '#0B1220' : '#FFFFFF',
    card: isDark ? '#111827' : '#FFFFFF',
    border: isDark ? '#1F2937' : '#E5E7EB',
    primary: isDark ? '#34D399' : '#10B981',
    danger: isDark ? '#F87171' : '#EF4444',
    warning: isDark ? '#FBBF24' : '#F59E0B',
    info: isDark ? '#60A5FA' : '#3B82F6',
    white: '#FFFFFF',
  };
}
