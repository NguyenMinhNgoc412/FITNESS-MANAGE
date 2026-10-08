export const colors = {
  background: '#F7F9FC', surface: '#FFFFFF', surfaceMuted: '#EAF2FD', surfaceAccent: '#E8F7F2',
  text: '#1F2937', textMuted: '#667085', primary: '#3A7BD5', primaryPressed: '#2864B5', onPrimary: '#FFFFFF',
  border: '#E4E7EC', danger: '#D9534F', dangerSurface: '#FBEDEC', success: '#20A486', successSurface: '#E8F7F2',
  successText: '#14715E', scrim: 'rgba(31, 41, 55, 0.38)', transparent: 'rgba(0, 0, 0, 0)',
  warning: '#86600F', warningSurface: '#FFF6DF', focus: '#3A7BD5', violet: '#3A7BD5',
  violetSurface: '#EAF2FD', slateSurface: '#F7F9FC', slateText: '#667085',
} as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 16, pill: 24 } as const;
export const controlSize = { touch: 48, record: 56, menuWidth: 64 } as const;
export const typography = {
  pageTitle: { fontSize: 28, lineHeight: 38, fontWeight: '700' as const },
  display: { fontSize: 30, lineHeight: 38, fontWeight: '700' as const },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  caption: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  button: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  message: { fontSize: 15, lineHeight: 22 },
  badge: { fontSize: 13, lineHeight: 20 },
  brand: { fontSize: 16, lineHeight: 24, fontWeight: '700' as const },
  logo: { fontSize: 26, lineHeight: 32, fontWeight: '700' as const },
  small: { fontSize: 12, lineHeight: 18 },
  activeTab: { fontSize: 12, lineHeight: 18, fontWeight: '600' as const },
  icon: { fontSize: 22, lineHeight: 28 },
} as const;
