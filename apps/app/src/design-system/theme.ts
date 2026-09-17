export const colors = {
  background: '#FAFBFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F2F3FF',
  surfaceAccent: '#EAFDFA',
  text: '#131B2E',
  textMuted: '#475569',
  primary: '#0D9488',
  primaryPressed: '#0F766E',
  onPrimary: '#FFFFFF',
  border: '#E2E8F0',
  danger: '#BA1A1A',
  dangerSurface: '#FFDAD6',
  success: '#0F766E',
  successSurface: '#CCFBF1',
  warning: '#C2410C',
  warningSurface: '#FFEDD5',
  focus: '#14B8A6',
  violet: '#6D5BD0',
  violetSurface: '#EEEAFE',
  slateSurface: '#F1F5F9',
  slateText: '#475569',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  display: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 32, lineHeight: 40, letterSpacing: -0.64 },
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 24, lineHeight: 32, letterSpacing: -0.3 },
  heading: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 18, lineHeight: 26, letterSpacing: -0.1 },
  body: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 16, letterSpacing: 0.35 },
} as const;
