import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from './theme';

type Tone = 'error' | 'success' | 'warning' | 'neutral';

export function Feedback({ message, tone = 'neutral' }: { message: string; tone?: Tone }) {
  if (!message) return null;
  return (
    <View accessibilityLiveRegion="polite" style={[styles.base, styles[`${tone}Box`]]}>
      <Text style={[styles.text, styles[`${tone}Text`]]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md, padding: spacing.md },
  text: { ...typography.caption, color: colors.text },
  neutralBox: { backgroundColor: colors.surfaceMuted },
  neutralText: { color: colors.text },
  errorBox: { backgroundColor: colors.dangerSurface },
  errorText: { color: colors.danger },
  successBox: { backgroundColor: colors.successSurface },
  successText: { color: colors.success },
  warningBox: { backgroundColor: colors.warningSurface },
  warningText: { color: colors.warning },
});
