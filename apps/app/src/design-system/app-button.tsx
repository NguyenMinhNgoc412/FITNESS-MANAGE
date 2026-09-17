import { LinearGradient } from 'expo-linear-gradient';
import { ComponentType, ReactNode, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from './theme';
const Gradient = LinearGradient as unknown as ComponentType<{ colors: readonly [string, string]; start: { x: number; y: number }; end: { x: number; y: number }; style: ViewStyle; children: ReactNode }>;

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
  accessibilityHint?: string;
};

export function AppButton({ label, onPress, disabled, loading, variant = 'primary', style, accessibilityHint }: Props) {
  const unavailable = disabled || loading;
  const [focused, setFocused] = useState(false);
  const content = loading ? <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} /> : <Text style={[styles.label, variant !== 'primary' && styles.secondaryLabel, variant === 'danger' && styles.dangerLabel]}>{label}</Text>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [styles.base, variant !== 'primary' && styles[variant], focused && styles.focused, pressed && !unavailable && styles.pressed, unavailable && styles.disabled, style]}
    >
      {variant === 'primary' ? <Gradient colors={['#14B8A6', '#0D9488']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>{content}</Gradient> : content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent', overflow: 'hidden', shadowColor: colors.primary, shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 2 },
  gradient: { minHeight: 48, width: '100%', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: colors.surfaceAccent, borderColor: 'transparent', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  danger: { backgroundColor: colors.warningSurface, borderColor: 'transparent', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  pressed: { opacity: 0.82 },
  focused: { borderColor: colors.focus, shadowOpacity: 0.35, shadowRadius: 6 },
  disabled: { opacity: 0.5 },
  label: { ...typography.bodyStrong, color: colors.onPrimary },
  secondaryLabel: { color: colors.primary },
  dangerLabel: { color: colors.danger },
});
