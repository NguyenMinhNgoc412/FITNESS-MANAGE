import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { styles } from '../ui';
import { colors as c, controlSize, radius, spacing, typography } from '../design-system/theme';

export type ActivityKind = 'journal' | 'progress' | 'measurements' | 'library';
const accents = {
  journal: { ink: c.primaryText, soft: c.surfaceMuted },
  progress: { ink: c.successText, soft: c.successSurface },
  measurements: { ink: c.primaryText, soft: c.surfaceMuted },
  library: { ink: c.warning, soft: c.warningSurface },
};
export function ActivityIcon({ kind }: { kind: ActivityKind }) {
  const color = accents[kind].ink;
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
    {kind === 'progress' ? <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 20 }}>{[8, 13, 19].map(h => <View key={h} style={{ height: h, width: 4, borderRadius: 2, backgroundColor: color }} />)}</View>
      : kind === 'library' ? <View style={{ width: 22, height: 3, backgroundColor: color }}><View style={{ position: 'absolute', left: 2, top: -6, width: 4, height: 15, borderRadius: 2, backgroundColor: color }} /><View style={{ position: 'absolute', right: 2, top: -6, width: 4, height: 15, borderRadius: 2, backgroundColor: color }} /></View>
        : <View style={{ width: kind === 'journal' ? 18 : 12, height: 22, borderWidth: 2, borderColor: color, borderRadius: 3, paddingTop: 3, paddingLeft: 3, gap: 3 }}>{[0, 1, 2].map(i => <View key={i} style={{ width: kind === 'journal' ? 8 : i === 1 ? 4 : 2, height: 2, backgroundColor: color }} />)}</View>}
  </View>;
}
export function ActivityHeader() {
  return <View style={s.hero}>
    <View style={styles.row}><View style={s.heroMark}><ActivityIcon kind="journal" /></View><Text style={{ ...typography.label, color: c.primaryText }}>Không gian của bạn</Text></View>
    <Text accessibilityRole="header" style={styles.title}>Hoạt động tập luyện</Text>
    <Text style={styles.muted}>Ghi lại hôm nay. Nhìn thấy từng bước tiến.</Text>
  </View>;
}
const tabs: { kind: ActivityKind; label: string }[] = [{ kind: 'journal', label: 'Nhật ký' }, { kind: 'progress', label: 'Tiến bộ' }, { kind: 'measurements', label: 'Số đo cơ thể' }, { kind: 'library', label: 'Bài tập mẫu' }];
export function ActivityNavigation({ value, disabled, onChange }: { value: string; disabled: boolean; onChange: (kind: ActivityKind) => void }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{tabs.map(tab => <ActivityTab key={tab.kind} {...tab} selected={value === tab.kind} disabled={disabled} onPress={() => onChange(tab.kind)} />)}</View>;
}
function ActivityTab({ kind, label, selected, disabled, onPress }: { kind: ActivityKind; label: string; selected: boolean; disabled: boolean; onPress: () => void }) {
  const { width } = useWindowDimensions();
  const [focused, setFocused] = useState(false), [hovered, setHovered] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected, disabled }} aria-pressed={selected} disabled={disabled} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={({ pressed }) => ({ flexBasis: width >= 600 ? '22%' : '46%', flexGrow: 1, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 2, borderColor: focused ? c.focus : selected ? c.primaryStrong : c.border, backgroundColor: selected || hovered || pressed ? c.surfaceMuted : c.surface, opacity: disabled ? 0.55 : 1 })}>
    <ActivityIcon kind={kind} /><Text style={{ ...typography.button, flex: 1, color: selected ? c.primaryText : c.text }}>{selected ? '✓ ' : ''}{label}</Text>
  </Pressable>;
}
export function ActivityCard({ title, kind, children }: { title?: string; kind?: ActivityKind; children: ReactNode }) {
  const { width } = useWindowDimensions();
  return <View style={[styles.card, { padding: width < 600 ? spacing.lg : spacing.xl }]}>
    {title && <View style={styles.row}>{kind && <View style={[s.iconChip, { backgroundColor: accents[kind].soft }]}><ActivityIcon kind={kind} /></View>}<Text accessibilityRole="header" style={[styles.heading, { flex: 1 }]}>{title}</Text></View>}{children}
  </View>;
}
export function ActivityMetric({ label, value, hint, kind = 'progress' }: { label: string; value: string | number; hint?: string; kind?: ActivityKind }) {
  return <View style={[styles.card, { flexGrow: 1, flexBasis: 150, minWidth: 0, padding: spacing.lg, borderTopWidth: 3, borderTopColor: accents[kind].ink }]}>
    <View style={styles.row}><ActivityIcon kind={kind} /><Text style={[styles.muted, { flex: 1 }]}>{label}</Text></View><Text style={styles.kpi}>{value}</Text>{hint && <Text style={styles.muted}>{hint}</Text>}
  </View>;
}
const s = StyleSheet.create({
  hero: { padding: spacing.lg, gap: spacing.sm, backgroundColor: c.surfaceMuted, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border },
  heroMark: { width: spacing.xxl, height: spacing.xxl, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: c.surface },
  iconChip: { width: controlSize.touch, height: controlSize.touch, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
