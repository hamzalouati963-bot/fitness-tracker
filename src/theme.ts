/** Design tokens partages — base pour harmoniser les ecrans. */
export const colors = {
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  bg: '#F9FAFB',
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  fill: '#E5E7EB',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const typography = {
  title: { fontSize: 24, fontWeight: '700' as const },
  screenTitle: { fontSize: 18, fontWeight: '600' as const },
  section: { fontSize: 12, fontWeight: '600' as const, textTransform: 'uppercase' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
} as const;