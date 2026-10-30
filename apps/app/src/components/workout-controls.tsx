import { createContext, ReactNode, useContext, useEffect, useId, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, TextInput, TextInputInstance, View, ViewInstance } from 'react-native';
import { usePreventRemove } from 'expo-router';
import { Control, FieldPath, FieldValues, useController, UseFormReturn } from 'react-hook-form';
import * as Crypto from 'expo-crypto';
import { Button, Feedback, Label, styles } from '../ui';
import { mutation } from '../lib/http';
import { errorMessage } from '../lib/http';
import { colors, spacing } from '../design-system/theme';
import DateTimeField from './date-time-field';
import { initialRange, validateRange } from '../features/workouts';
import { WorkoutLeaveContext } from './workout-leave-context';
import { useDetailPending } from './detail-state';
import { FormScroll as ActivityScroll } from './form-scroll-context';
export { FormScroll as ActivityScroll } from './form-scroll-context';

export const confirmAction = (message: string) => Platform.OS === 'web' ? Promise.resolve(window.confirm(message)) : new Promise<boolean>(resolve => Alert.alert('Xác nhận', message, [{ text: 'Giữ lại', style: 'cancel', onPress: () => resolve(false) }, { text: 'Đồng ý', style: 'destructive', onPress: () => resolve(true) }], { cancelable: true, onDismiss: () => resolve(false) }));
export const ActivityBusy = createContext<(value: boolean) => void>(() => {});
export function showFieldErrors<T extends FieldValues>(form: UseFormReturn<T>, issues: { path: FieldPath<T>; message: string }[]) {
  form.clearErrors();
  issues.forEach((issue, index) => form.setError(issue.path, { type: index === 0 ? 'focus' : 'validation', message: issue.message }));
}
export function useUnsaved(dirty: boolean, busy = false) {
  const [leaving, setLeaving] = useState(false);
  const shellGuard = useContext(WorkoutLeaveContext);
  useEffect(() => {
    if (!shellGuard) return;
    const check = () => busy ? Promise.resolve(false) : dirty ? confirmAction('Có nội dung chưa lưu. Rời trang và bỏ nội dung này?') : Promise.resolve(true);
    shellGuard.current = check;
    return () => { if (shellGuard.current === check) shellGuard.current = null; };
  }, [dirty, busy, shellGuard]);
  usePreventRemove(!leaving && (dirty || busy), ({ repeat }) => {
    if (busy) return;
    void confirmAction('Có nội dung chưa lưu. Rời trang và bỏ nội dung này?').then(ok => { if (ok) { setLeaving(true); repeat(); } });
  });
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (event: BeforeUnloadEvent) => { if (dirty || busy) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => { window.removeEventListener('beforeunload', handler); };
  }, [dirty, busy]);
}
export function useCommand() {
  const [pending, setPending] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  useDetailPending(pending);
  const setBusy = useContext(ActivityBusy);
  useEffect(() => { setBusy(pending); return () => setBusy(false); }, [pending, setBusy]);
  const lock = useRef(false), mounted = useRef(true), last = useRef<{ fingerprint: string; key: string } | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const run = async <T,>(url: string, body: unknown, method: 'post' | 'patch', success: (value: T) => void) => {
    if (lock.current) return;
    lock.current = true; setPending(true); setError(''); setMessage('');
    const fingerprint = JSON.stringify({ url, body, method });
    if (last.current?.fingerprint !== fingerprint) last.current = { fingerprint, key: Crypto.randomUUID() };
    try { const result = await mutation(url, body, last.current!.key, method); last.current = null; if (mounted.current) { setMessage('Đã lưu thành công.'); success(result.data as T); } }
    catch (e) { if (mounted.current) setError(errorMessage(e)); }
    finally { lock.current = false; if (mounted.current) setPending(false); }
  };
  return { run, pending, error, message, setError };
}
export function CommandState({ command }: { command: ReturnType<typeof useCommand> }) { return <><Feedback message={command.error} /><Feedback message={command.message} tone="success" /></>; }
export function Input<T extends FieldValues>({ control, name, label, caption, disabled = false, numeric = false, date = false }: { control: Control<T>; name: FieldPath<T>; label: string; caption?: string; disabled?: boolean; numeric?: boolean; date?: boolean }) {
  const { field, fieldState } = useController({ control, name });
  const wrapper = useRef<ViewInstance>(null), input = useRef<TextInputInstance>(null), scroll = useContext(ActivityScroll), errorId = useId();
  useEffect(() => {
    if (fieldState.error?.type !== 'focus') return;
    const frame = requestAnimationFrame(() => {
      if (Platform.OS === 'web') {
        const node = wrapper.current as unknown as HTMLElement | null;
        node?.scrollIntoView({ block: 'center' });
        node?.querySelector('input')?.focus({ preventScroll: true });
      } else {
        input.current?.focus();
        const container = scroll?.current;
        const target = container?.getInnerViewRef();
        if (container && target != null) wrapper.current?.measureLayout(target, (_x, y) => container.scrollTo({ y: Math.max(0, y - spacing.lg), animated: false }), () => {});
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [fieldState.error, scroll]);
  return <View ref={wrapper} style={{ gap: spacing.sm }}><Label>{caption ?? label}</Label>{date ? <DateTimeField mode="date" label={label} value={String(field.value ?? '')} onChange={value => field.onChange(value)} onBlur={field.onBlur} disabled={disabled} /> : <TextInput ref={node => { input.current = node; field.ref(node); }} accessibilityLabel={label} aria-invalid={fieldState.invalid} aria-describedby={fieldState.error ? errorId : undefined} style={[styles.input, fieldState.invalid && { borderColor: colors.dangerText }]} editable={!disabled} value={String(field.value ?? '')} onChangeText={field.onChange} onBlur={field.onBlur} keyboardType={numeric ? 'decimal-pad' : 'default'} />}{fieldState.error?.message && <View nativeID={errorId}><Feedback message={fieldState.error.message} /></View>}</View>;
}
export function ActivityFilters({ summary, children, onExpandedChange }: { summary: string; children: ReactNode; onExpandedChange?: (expanded: boolean) => void }) {
  const [expanded, setExpanded] = useState(false);
  return <View style={{ gap: spacing.md }}><Label muted>{summary}</Label><Button secondary expanded={expanded} label={expanded ? 'Thu gọn bộ lọc' : 'Mở bộ lọc'} onPress={() => { const next = !expanded; setExpanded(next); onExpandedChange?.(next); }} /><View style={[{ gap: spacing.md }, !expanded && { display: 'none' }]} accessibilityElementsHidden={!expanded} importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}>{children}</View></View>;
}
export function RangeFilter({ onChange }: { onChange: (from: string, to: string) => void }) {
  const [value, setValue] = useState(initialRange), [error, setError] = useState('');
  return <View style={{ gap: spacing.md }}>
    <View style={{ gap: spacing.sm }}><Label>Từ ngày</Label><DateTimeField mode="date" label="Từ ngày" value={value.from} onChange={from => setValue(v => ({ ...v, from }))} onBlur={() => {}} disabled={false} /></View>
    <View style={{ gap: spacing.sm }}><Label>Đến ngày</Label><DateTimeField mode="date" label="Đến ngày" value={value.to} onChange={to => setValue(v => ({ ...v, to }))} onBlur={() => {}} disabled={false} /></View>
    <Feedback message={error} />
    <Button secondary label="Áp dụng khoảng ngày" onPress={() => { try { validateRange(value.from, value.to); setError(''); onChange(value.from, value.to); } catch (e) { setError((e as Error).message); } }} />
  </View>;
}
export function ValueChart({ title, unit, points }: { title: string; unit: string; points: { date: string; value: number }[] }) {
  const [table, setTable] = useState(false);
  const max = Math.max(1, ...points.map(p => p.value));
  return <View style={{ gap: spacing.md }}><Label>{title} ({unit})</Label>{!points.length ? <Label muted>Chưa có dữ liệu.</Label> : <><ScrollView horizontal accessibilityLabel={'Biểu đồ ' + title}><View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.sm }}>{points.map(p => <View key={p.date} style={{ width: 90, alignItems: 'center', gap: spacing.xs }}><Label>{p.value}</Label><View style={{ height: 140, justifyContent: 'flex-end' }}><View style={{ height: p.value === 0 ? 0 : Math.max(2, p.value / max * 140), width: 28, borderTopLeftRadius: spacing.sm, borderTopRightRadius: spacing.sm, backgroundColor: colors.primaryStrong }} /></View><Label muted>{p.date}</Label></View>)}</View></ScrollView><Label muted>Trục giá trị bắt đầu từ 0.</Label><Button secondary expanded={table} label={(table ? 'Ẩn bảng số liệu: ' : 'Xem bảng số liệu: ') + title} onPress={() => setTable(v => !v)} />{table && <View style={{ gap: spacing.sm }}>{points.map(p => <Label key={p.date}>{p.date}: {p.value} {unit}</Label>)}</View>}</>}</View>;
}
