import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from './theme';

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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], pressed && !unavailable && styles.pressed, unavailable && styles.disabled, style]}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} /> : <Text style={[styles.label, variant !== 'primary' && styles.secondaryLabel, variant === 'danger' && styles.dangerLabel]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border },
  danger: { backgroundColor: colors.surface, borderColor: colors.danger },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.5 },
  label: { ...typography.bodyStrong, color: colors.onPrimary },
  secondaryLabel: { color: colors.primary },
  dangerLabel: { color: colors.danger },
});
