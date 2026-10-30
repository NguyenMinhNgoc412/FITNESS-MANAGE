import { createElement, useId } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { colors, controlSize, radius, spacing, typography } from '../design-system/theme';
import { Label, styles } from '../ui';

export function FilterSelect({ label, value, options, onChange, open, onOpenChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; open: boolean; onOpenChange: (open: boolean) => void }) {
  const id = useId();
  const selected = options.find(option => option.value === value)?.label ?? '';
  return <View style={{ gap: spacing.sm }}><Label>{label}</Label>{Platform.OS === 'web' ? createElement('select', {
    'aria-label': label, value, onChange: (event: React.ChangeEvent<HTMLSelectElement>) => onChange(event.target.value),
    style: { width: '100%', minWidth: 0, minHeight: controlSize.touch, padding: spacing.md, borderRadius: radius.md, border: `1px solid ${colors.border}`, color: colors.text, backgroundColor: colors.surface, fontFamily: 'system-ui, sans-serif', fontSize: typography.body.fontSize, cursor: 'pointer' },
  }, options.map(option => createElement('option', { key: option.value, value: option.value }, option.label))) : <>
    <Pressable accessibilityRole="combobox" accessibilityLabel={label} accessibilityValue={{ text: selected }} accessibilityState={{ expanded: open }} aria-controls={open ? id : undefined} onPress={() => onOpenChange(!open)} style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }]}>
      <Text style={[styles.text, { flex: 1 }]}>{selected}</Text><Text style={styles.muted}>{open ? '▴' : '▾'}</Text>
    </Pressable>
    {open && <ScrollView nativeID={id} nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 240, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface }}>
      {options.map(option => <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ checked: value === option.value }} onPress={() => { onChange(option.value); onOpenChange(false); }} style={[styles.listRow, value === option.value && { backgroundColor: colors.surfaceMuted }]}><Text style={styles.text}>{value === option.value ? '✓ ' : ''}{option.label}</Text></Pressable>)}
    </ScrollView>}
  </>}</View>;
}
