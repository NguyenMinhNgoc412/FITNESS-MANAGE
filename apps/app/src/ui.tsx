import { ReactNode, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Link } from 'expo-router';
import { colors as c, controlSize, radius, spacing, typography } from './design-system/theme';

export const styles = StyleSheet.create({
  page: { padding: spacing.xl, gap: spacing.xl, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  title: { ...typography.pageTitle, color: c.text }, heading: { ...typography.heading, color: c.text },
  text: { ...typography.body, color: c.text }, muted: { ...typography.caption, color: c.textMuted },
  card: { backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, padding: spacing.xl, gap: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md },
  input: { minHeight: controlSize.touch, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: spacing.md, color: c.text, backgroundColor: c.surface, ...typography.body },
  error: { padding: spacing.md, backgroundColor: c.dangerSurface, borderRadius: radius.sm, color: c.dangerText, ...typography.message },
  success: { padding: spacing.md, backgroundColor: c.successSurface, borderRadius: radius.sm, color: c.successText, ...typography.message },
  kpi: { ...typography.display, color: c.text },
  listRow: { minHeight: controlSize.record, padding: spacing.md, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, backgroundColor: c.surface, justifyContent: 'center', gap: spacing.xs },
});
export function Button({ label, onPress, pending = false, disabled = false, secondary = false, danger = false }: { label: string; onPress: () => void; pending?: boolean; disabled?: boolean; secondary?: boolean; danger?: boolean }) {
  const [focused, setFocused] = useState(false), [hovered, setHovered] = useState(false);
  return <Pressable accessibilityLabel={label} accessibilityRole="button" accessibilityState={{ disabled: pending || disabled, busy: pending }} aria-busy={pending} aria-disabled={pending || disabled} disabled={pending || disabled} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} onPress={onPress} style={({ pressed }) => ({ minHeight: controlSize.touch, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 2, borderColor: focused ? c.focus : c.transparent, backgroundColor: danger ? c.dangerSurface : secondary ? (hovered || pressed ? c.surfaceAccent : c.surfaceMuted) : (hovered || pressed ? c.primaryPressed : c.primaryStrong), opacity: pending || disabled ? 0.55 : 1 })}>
    {pending ? <ActivityIndicator color={danger ? c.dangerText : secondary ? c.primaryText : c.onPrimary} /> : <Text style={{ color: danger ? c.dangerText : secondary ? c.primaryText : c.onPrimary, ...typography.button }}>{label}</Text>}
  </Pressable>;
}
export function ActionLink({ href, children }: { href: Parameters<typeof Link>[0]['href']; children: string }) {
  const [focused, setFocused] = useState(false), [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  // Link's asChild slot merges style objects; a Pressable style callback loses its styles.
  return <Link href={href} asChild><Pressable accessibilityRole="link" accessibilityLabel={children} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} style={{ minHeight: controlSize.touch, padding: spacing.sm, justifyContent: 'center', borderRadius: radius.sm, borderWidth: 2, borderColor: focused ? c.focus : c.transparent, backgroundColor: hovered || pressed ? c.surfaceMuted : c.transparent }}><Text style={{ ...typography.bodyStrong, color: c.primaryText }}>{children}</Text></Pressable></Link>;
}
export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return <View style={styles.card}>{title ? <Text style={styles.heading}>{title}</Text> : null}{children}</View>;
}
export function Page({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { width } = useWindowDimensions();
  return <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1, backgroundColor: c.background }} contentContainerStyle={[styles.page, width < 600 && { padding: spacing.lg, gap: spacing.lg }]}><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}{children}</ScrollView>;
}
export function Label({ children, muted = false }: { children: ReactNode; muted?: boolean }) { return <Text style={muted ? styles.muted : styles.text}>{children}</Text>; }
export function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <View style={[styles.card, { minWidth: 150, flexGrow: 1, flexBasis: 150 }]}><Text style={styles.muted}>{label}</Text><Text style={styles.kpi}>{value}</Text>{hint ? <Text style={styles.muted}>{hint}</Text> : null}</View>;
}
export function Badge({ value }: { value: string }) {
  const labels: Record<string, string> = { ACTIVE: 'Đang hoạt động', PENDING: 'Chờ xử lý', EXPIRED: 'Hết hạn', EXHAUSTED: 'Hết lượt', CANCELLED: 'Đã hủy', SCHEDULED: 'Đã lên lịch', TRIAL: 'Tập thử', MEMBER: 'Hội viên', QR: 'Đã quét QR', PHONE: 'Tra cứu SĐT', SELF_TRAINING: 'Tự tập', WITH_INTERNAL_PT: 'PT nội bộ', WITH_EXTERNAL_PT: 'PT ngoài', OPEN: 'Cần chăm sóc', CONTACTED: 'Đã liên hệ', CONVERTED_RENEWED: 'Đã chuyển đổi / gia hạn', CLOSED_NOT_CONTINUING: 'Không tiếp tục', TRIAL_FINAL: 'Trial lượt cuối', MEMBERSHIP_EXPIRING_TIME: 'Gói sắp hết hạn', MEMBERSHIP_EXPIRING_SESSION: 'Gói sắp hết lượt' };
  const success = ['ACTIVE', 'CONVERTED_RENEWED', 'MEMBER', 'QR'].includes(value), warning = ['PENDING', 'OPEN', 'TRIAL', 'TRIAL_FINAL', 'MEMBERSHIP_EXPIRING_TIME', 'MEMBERSHIP_EXPIRING_SESSION'].includes(value), danger = ['EXPIRED', 'EXHAUSTED', 'CANCELLED', 'CLOSED_NOT_CONTINUING'].includes(value);
  return <Text style={{ color: danger ? c.dangerText : warning ? c.warning : success ? c.successText : c.primaryText, backgroundColor: danger ? c.dangerSurface : warning ? c.warningSurface : success ? c.successSurface : c.surfaceMuted, padding: spacing.sm, borderRadius: radius.sm, alignSelf: 'flex-start', ...typography.badge }}>{labels[value] ?? value}</Text>;
}
export function LoadState({ state, empty, emptyText = 'Chưa có dữ liệu phù hợp.' }: { state: { loading: boolean; error: string; reload: () => Promise<void> }; empty?: boolean; emptyText?: string }) {
  if (state.loading) return <ActivityIndicator accessibilityLabel="Đang tải" color={c.primary} />;
  if (state.error) return <Card><Text accessibilityLiveRegion="polite" style={styles.error}>{state.error}</Text><Button secondary label="Thử lại" onPress={() => void state.reload()} /></Card>;
  if (empty) return <View style={{ paddingVertical: spacing.sm }}><Label muted>{emptyText}</Label></View>;
  return null;
}
export function Choices({ value, options, onChange, disabled = false }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; disabled?: boolean }) {
  const items = options.map(option => <Pressable key={option.value} disabled={disabled} accessibilityRole="radio" accessibilityState={{ checked: value === option.value, disabled }} aria-checked={value === option.value} onPress={() => onChange(option.value)} style={{ padding: spacing.md, minHeight: controlSize.touch, borderRadius: radius.sm, borderWidth: 1, borderColor: value === option.value ? c.primary : c.border, backgroundColor: value === option.value ? c.surfaceMuted : c.surface, opacity: disabled ? 0.55 : 1 }}><Text style={{ ...typography.body, color: c.text }}>{value === option.value ? '● ' : '○ '}{option.label}</Text></Pressable>);
  if (options.length > 5) return <ScrollView horizontal showsHorizontalScrollIndicator accessibilityLabel="Các mục hồ sơ, vuốt ngang để xem thêm" contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xs }}>{items}</ScrollView>;
  return <View style={styles.row}>{items}</View>;
}
export function RecordPicker({ value, options, onChange, label = 'Chọn hồ sơ', disabled = false }: { value: string; options: { value: string; label: string; meta?: string }[]; onChange: (v: string) => void; label?: string; disabled?: boolean }) {
  const [filter, setFilter] = useState('');
  const shown = options.filter(option => (option.label + ' ' + (option.meta ?? '')).toLocaleLowerCase('vi').includes(filter.trim().toLocaleLowerCase('vi')));
  return <View style={{ gap: spacing.sm }}><Text style={styles.text}>{label}</Text><TextInput editable={!disabled} accessibilityLabel={'Tìm trong ' + label.toLocaleLowerCase('vi')} placeholder="Nhập tên hoặc số điện thoại" placeholderTextColor={c.textMuted} style={styles.input} value={filter} onChangeText={setFilter} />
    <View style={{ gap: spacing.sm }}>{shown.map(option => <Pressable key={option.value} disabled={disabled} accessibilityRole="radio" accessibilityState={{ checked: value === option.value, disabled }} aria-checked={value === option.value} onPress={() => onChange(option.value)} style={[styles.listRow, disabled && { opacity: 0.55 }, value === option.value && { borderColor: c.primary, backgroundColor: c.surfaceMuted }]}><Text style={{ ...typography.bodyStrong, color: c.text }}>{value === option.value ? '✓ ' : '○ '}{option.label}</Text>{option.meta ? <Text style={styles.muted}>{option.meta}</Text> : null}</Pressable>)}</View>
    {!shown.length && <Label muted>Không có kết quả trong trang hiện tại.</Label>}
  </View>;
}
export function Pager({ page, setPage, more }: { page: number; setPage: (n: number) => void; more: boolean }) {
  return <View style={styles.row}><Button secondary label="Trang trước" disabled={page === 1} onPress={() => setPage(page - 1)} /><Label>Trang {page}</Label><Button secondary label="Trang sau" disabled={!more} onPress={() => setPage(page + 1)} /></View>;
}
