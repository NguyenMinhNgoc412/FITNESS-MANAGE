export const colors = {
  background: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F4',
  text: '#17212B',
  textMuted: '#5D6975',
  primary: '#126B5B',
  primaryPressed: '#0D5045',
  onPrimary: '#FFFFFF',
  border: '#D8DEE4',
  danger: '#B42318',
  dangerSurface: '#FEECEB',
  success: '#147A52',
  successSurface: '#E7F6EF',
  warning: '#8A5A00',
  warningSurface: '#FFF4D6',
  focus: '#2D7FF9',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 38, fontWeight: '700' as const },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
  heading: { fontSize: 18, lineHeight: 26, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
} as const;
