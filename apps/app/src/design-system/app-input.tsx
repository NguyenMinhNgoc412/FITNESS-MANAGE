import { useState } from 'react';
import { Text, TextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from './theme';

type Props = TextInputProps & { label: string; error?: string };

export function AppInput({ label, error, style, onFocus, onBlur, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error}
        placeholderTextColor={colors.textMuted}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
        style={[styles.input, focused && styles.inputFocused, error && styles.inputError, style]}
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
  inputFocused: { borderColor: colors.focus, shadowColor: colors.focus, shadowOpacity: 0.2, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  inputError: { borderColor: colors.danger },
  error: { ...typography.caption, color: colors.danger },
});
