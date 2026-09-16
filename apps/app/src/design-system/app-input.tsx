import { Text, TextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from './theme';

type Props = TextInputProps & { label: string; error?: string };

export function AppInput({ label, error, style, ...props }: Props) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  label: { ...typography.caption, color: colors.text, fontWeight: '600' },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: spacing.md, ...typography.body },
  inputError: { borderColor: colors.danger },
  error: { ...typography.caption, color: colors.danger },
});
