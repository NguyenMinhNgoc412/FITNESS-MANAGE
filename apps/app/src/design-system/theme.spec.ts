import { colors } from './theme';

function luminance(hex: string) {
  const rgb = [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

describe('Readable semantic text and action colors', () => {
  it.each([
    ['primary button', colors.onPrimary, colors.primaryStrong],
    ['pressed primary button', colors.onPrimary, colors.primaryPressed],
    ['link', colors.primaryText, colors.surface],
    ['selected navigation / secondary button', colors.primaryText, colors.surfaceMuted],
    ['hovered secondary button', colors.primaryText, colors.surfaceAccent],
    ['error / destructive button', colors.dangerText, colors.dangerSurface],
    ['success badge', colors.successText, colors.successSurface],
    ['warning badge', colors.warning, colors.warningSurface],
    ['muted text', colors.textMuted, colors.background],
  ])('%s keeps at least 4.5:1 contrast for small text', (_name, foreground, background) => {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    expect((values[0] + 0.05) / (values[1] + 0.05)).toBeGreaterThanOrEqual(4.5);
  });
});
