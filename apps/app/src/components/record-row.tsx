import { ReactNode, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors, controlSize, spacing, typography } from '../design-system/theme';
import { DetailModal } from './detail-modal';

export function RecordRow({ title, description, label, trailing, onPress, testID }: { title: string; description?: string; label?: string; trailing?: ReactNode; onPress: () => void; testID?: string }) {
  const [focused, setFocused] = useState(false), [hovered, setHovered] = useState(false);
  return <Pressable testID={testID} accessibilityRole="button" accessibilityHint="Mở chi tiết trong cửa sổ" aria-haspopup="dialog" accessibilityLabel={label ?? 'Xem chi tiết ' + title} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={({ pressed }) => ({ minHeight: controlSize.record, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, borderWidth: 1, borderColor: focused ? colors.focus : colors.transparent, borderBottomColor: focused ? colors.focus : colors.border, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: pressed || hovered ? colors.surfaceMuted : colors.transparent })}>
    <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}><Text numberOfLines={2} style={{ ...typography.bodyStrong, color: colors.text }}>{title}</Text>{description ? <Text style={{ ...typography.caption, color: colors.textMuted }}>{description}</Text> : null}</View>
    {trailing}<Text importantForAccessibility="no" style={{ ...typography.body, color: colors.textMuted }}>›</Text>
  </Pressable>;
}
export function PopupRow({ title, description, label, trailing, children, busy = false, testID }: { title: string; description?: string; label?: string; trailing?: ReactNode; children: ReactNode; busy?: boolean; testID?: string }) {
  const [open, setOpen] = useState(false);
  return <><RecordRow title={title} description={description} label={label} trailing={trailing} testID={testID} onPress={() => setOpen(true)} />{open && <DetailModal title={title} busy={busy} onClose={() => setOpen(false)}>{title.length > 48 && <Text selectable style={{ ...typography.bodyStrong, color: colors.text }}>{title}</Text>}{children}</DetailModal>}</>;
}
