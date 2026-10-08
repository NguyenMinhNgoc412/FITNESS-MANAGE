import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import * as Crypto from 'expo-crypto';
import { Link } from 'expo-router';
import { api } from './api';
import { colors as c, controlSize, radius, spacing, typography } from './design-system/theme';
import DateTimeField from './components/date-time-field';

export const styles = StyleSheet.create({
  page: { padding: spacing.xl, gap: spacing.xl, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  title: { ...typography.pageTitle, color: c.text }, heading: { ...typography.heading, color: c.text },
  text: { ...typography.body, color: c.text }, muted: { ...typography.caption, color: c.textMuted },
  card: { backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, padding: spacing.xl, gap: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md },
  input: { minHeight: controlSize.touch, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: spacing.md, color: c.text, backgroundColor: c.surface, ...typography.body },
  error: { padding: spacing.md, backgroundColor: c.dangerSurface, borderRadius: radius.sm, color: c.danger, ...typography.message },
  success: { padding: spacing.md, backgroundColor: c.successSurface, borderRadius: radius.sm, color: c.successText, ...typography.message },
  kpi: { ...typography.display, color: c.text },
  listRow: { minHeight: controlSize.record, padding: spacing.md, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, backgroundColor: c.surface, justifyContent: 'center', gap: spacing.xs },
});
export function Button({ label, onPress, pending = false, disabled = false, secondary = false, danger = false }: { label: string; onPress: () => void; pending?: boolean; disabled?: boolean; secondary?: boolean; danger?: boolean }) {
  const [focused, setFocused] = useState(false), [hovered, setHovered] = useState(false);
  return <Pressable accessibilityLabel={label} accessibilityRole="button" accessibilityState={{ disabled: pending || disabled, busy: pending }} aria-busy={pending} aria-disabled={pending || disabled} disabled={pending || disabled} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} onPress={onPress} style={({ pressed }) => ({ minHeight: controlSize.touch, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 2, borderColor: focused ? c.focus : c.transparent, backgroundColor: danger ? c.dangerSurface : secondary ? (hovered || pressed ? c.surfaceAccent : c.surfaceMuted) : (hovered || pressed ? c.primaryPressed : c.primary), opacity: pending || disabled ? 0.55 : 1 })}>
    {pending ? <ActivityIndicator color={danger ? c.danger : secondary ? c.primary : c.onPrimary} /> : <Text style={{ color: danger ? c.danger : secondary ? c.primary : c.onPrimary, ...typography.button }}>{label}</Text>}
  </Pressable>;
}
export function ActionLink({ href, children }: { href: Parameters<typeof Link>[0]['href']; children: string }) {
  const [focused, setFocused] = useState(false), [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  // Link's asChild slot merges style objects; a Pressable style callback loses its styles.
  return <Link href={href} asChild><Pressable accessibilityRole="link" accessibilityLabel={children} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} style={{ minHeight: controlSize.touch, padding: spacing.sm, justifyContent: 'center', borderRadius: radius.sm, borderWidth: 2, borderColor: focused ? c.focus : c.transparent, backgroundColor: hovered || pressed ? c.surfaceMuted : c.transparent }}><Text style={{ ...typography.bodyStrong, color: c.primary }}>{children}</Text></Pressable></Link>;
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
  return <Text style={{ color: danger ? c.danger : warning ? c.warning : success ? c.successText : c.primary, backgroundColor: danger ? c.dangerSurface : warning ? c.warningSurface : success ? c.successSurface : c.surfaceMuted, padding: spacing.sm, borderRadius: radius.sm, alignSelf: 'flex-start', ...typography.badge }}>{labels[value] ?? value}</Text>;
}
export function errorMessage(error: unknown) {
  const candidate = error as { response?: { status?: number; data?: { message?: unknown } } };
  if (candidate.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  const message = candidate.response?.data?.message;
  return typeof message === 'string' ? message : 'Không thể kết nối. Vui lòng thử lại.';
}
export function useLoad<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(false);
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const current = ++generation.current;
    if (!url) { setData(null); setError(''); setLoading(false); return; }
    setLoading(true); setError('');
    try { const result = await api.get<T>(url); if (current === generation.current) setData(result.data); }
    catch (e) { if (current === generation.current) { setData(null); setError(errorMessage(e)); } }
    finally { if (current === generation.current) setLoading(false); }
  }, [url]);
  useEffect(() => { setData(null); void reload(); return () => { generation.current++; }; }, [reload]);
  return { data, loading, error, reload };
}
export function LoadState({ state, empty, emptyText = 'Chưa có dữ liệu phù hợp.' }: { state: { loading: boolean; error: string; reload: () => Promise<void> }; empty?: boolean; emptyText?: string }) {
  if (state.loading) return <ActivityIndicator accessibilityLabel="Đang tải" color={c.primary} />;
  if (state.error) return <Card><Text accessibilityLiveRegion="polite" style={styles.error}>{state.error}</Text><Button secondary label="Thử lại" onPress={() => void state.reload()} /></Card>;
  if (empty) return <View style={{ paddingVertical: spacing.sm }}><Label muted>{emptyText}</Label></View>;
  return null;
}
export type Field = { name: string; label: string; secret?: boolean; numeric?: boolean; picker?: boolean; dateTime?: boolean; date?: boolean; options?: { value: string; label: string }[]; defaultValue?: string };
export function Form({ fields, schema, submit, label = 'Lưu', onSuccess, revision, preserveFields = [], beforeFields }: { fields: Field[]; schema?: z.ZodTypeAny; submit: (values: Record<string, string>, key: string) => Promise<unknown>; label?: string; onSuccess?: () => void; revision?: string; preserveFields?: readonly string[]; beforeFields?: (pending: boolean) => ReactNode }) {
  const { control, handleSubmit, reset, getValues, formState: { isSubmitting } } = useForm<Record<string, string>>({ defaultValues: Object.fromEntries(fields.map(f => [f.name, f.defaultValue ?? ''])) });
  const [error, setError] = useState(''), [success, setSuccess] = useState(false);
  const pending = useRef(false), command = useRef<{ input: string; key: string } | null>(null);
  const previousRevision = useRef(revision);
  useEffect(() => {
    if (previousRevision.current === revision) return;
    previousRevision.current = revision;
    const values = getValues();
    reset(Object.fromEntries(fields.map(field => [field.name, preserveFields.includes(field.name) ? values[field.name] ?? '' : field.defaultValue ?? ''])));
    command.current = null; setError(''); setSuccess(false);
  }, [revision, fields, preserveFields, getValues, reset]);
  const run = async (values: Record<string, string>) => {
    if (pending.current) return;
    const checked = schema?.safeParse(values);
    if (checked && !checked.success) { setError('Kiểm tra các trường bắt buộc và định dạng dữ liệu.'); return; }
    pending.current = true; setError(''); setSuccess(false);
    const input = JSON.stringify(values);
    if (command.current?.input !== input) command.current = { input, key: Crypto.randomUUID() };
    try {
      await submit(values, command.current!.key);
      command.current = null; setSuccess(true); onSuccess?.();
    } catch (e) { setError(e instanceof z.ZodError ? 'Dữ liệu không hợp lệ.' : errorMessage(e)); }
    finally { pending.current = false; }
  };
  return <View style={{ gap: spacing.md }}>
    {beforeFields?.(isSubmitting)}
    {fields.map(field => <Controller key={field.name} name={field.name} control={control} render={({ field: { value, onChange, onBlur } }) => <View style={{ gap: spacing.sm }}>
      {!(field.options && (field.picker || field.options.length > 5)) && <Text style={styles.text}>{field.label}</Text>}
      {field.dateTime || field.date ? <DateTimeField mode={field.date ? 'date' : 'datetime'} label={field.label} value={value} onChange={onChange} onBlur={onBlur} disabled={isSubmitting} /> : field.options ? (field.picker || field.options.length > 5 ? <RecordPicker disabled={isSubmitting} value={value} options={field.options} onChange={onChange} label={field.label} /> : <Choices disabled={isSubmitting} value={value} options={field.options} onChange={onChange} />) : <TextInput accessibilityLabel={field.label} editable={!isSubmitting} style={styles.input} value={value} onChangeText={onChange} onBlur={onBlur} autoCapitalize="none" secureTextEntry={field.secret} keyboardType={field.numeric ? 'number-pad' : 'default'} />}
    </View>} />)}
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    {success ? <Text accessibilityLiveRegion="polite" style={styles.success}>Đã thực hiện thành công.</Text> : null}
    <Button label={label} pending={isSubmitting} onPress={() => void handleSubmit(run)()} />
  </View>;
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
export const dateTime = (value: string) => new Date(value).toLocaleString('vi-VN');
export function iso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/.exec(value.trim());
  if (!match) throw new z.ZodError([]);
  const d = new Date(+match[1], +match[2] - 1, +match[3], +(match[4] ?? 0), +(match[5] ?? 0));
  if (d.getFullYear() !== +match[1] || d.getMonth() !== +match[2] - 1 || d.getDate() !== +match[3] || d.getHours() !== +(match[4] ?? 0) || d.getMinutes() !== +(match[5] ?? 0)) throw new z.ZodError([]);
  return d.toISOString();
}
export const mutation = (url: string, body: unknown, key: string, method: 'post' | 'patch' | 'delete' = 'post') => api.request({ method, url, data: body, headers: { 'Idempotency-Key': key } });
