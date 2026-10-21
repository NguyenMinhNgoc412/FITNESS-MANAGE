import { useState } from 'react';
import { Modal, Platform, Pressable, Text, UIManager, View } from 'react-native';
import type DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors as c, controlSize, radius, spacing, typography } from '../design-system/theme';

type Props = { label: string; value: string; onChange: (value: string) => void; onBlur: () => void; disabled: boolean; mode?: 'date' | 'datetime' };
const localValue = (date: Date, dateOnly = false) => {
  const two = (n: number) => String(n).padStart(2, '0');
  const result = `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())} ${two(date.getHours())}:${two(date.getMinutes())}`;
  return dateOnly ? result.slice(0, 10) : result;
};
export default function DateTimeField({ label, value, onChange, onBlur, disabled, mode = 'datetime' }: Props) {
  const [Picker, setPicker] = useState<typeof DateTimePicker | null>(null), [open, setOpen] = useState(false);
  const [step, setStep] = useState<'date' | 'time'>('date'), [draft, setDraft] = useState(new Date()), [error, setError] = useState('');
  const close = () => { setOpen(false); onBlur(); };
  const select = () => {
    if (disabled) return;
    try {
      // Load on demand so older development builds show an error instead of crashing the screen.
      if (Platform.OS === 'ios' && !UIManager.hasViewManagerConfig('RNDateTimePicker')) throw new Error('Missing native picker');
      const component = require('@react-native-community/datetimepicker').default as typeof DateTimePicker;
      setPicker(() => component);
      const parsed = value ? new Date(value.length === 10 ? value + 'T00:00:00' : value.replace(' ', 'T')) : new Date();
      setDraft(Number.isNaN(parsed.getTime()) ? new Date() : parsed); setStep('date'); setError(''); setOpen(true);
    } catch { setError('Bộ chọn ngày giờ chưa có trong bản cài này. Cài lại Development Build mới.'); }
  };
  const change = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type !== 'set' || !date) { close(); return; }
    setDraft(date);
    if (Platform.OS === 'android') {
      if (step === 'date' && mode !== 'date') setStep('time');
      else { onChange(localValue(date, mode === 'date')); close(); }
    }
  };
  const control = { minHeight: controlSize.touch, padding: spacing.md, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, backgroundColor: c.surface };
  return <View style={{ gap: spacing.sm }}>
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={select} style={[control, disabled && { opacity: 0.55 }]}><Text style={{ ...typography.body, color: value ? c.text : c.textMuted }}>{value ? new Date(value.length === 10 ? value + 'T00:00:00' : value.replace(' ', 'T')).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', ...(mode === 'date' ? {} : { hour: '2-digit', minute: '2-digit' }) }) : mode === 'date' ? 'Chọn ngày' : 'Chọn ngày và giờ'}</Text></Pressable>
    {error ? <Text accessibilityLiveRegion="polite" style={{ ...typography.body, color: c.dangerText }}>{error}</Text> : null}
    {open && !disabled && Picker ? Platform.OS === 'android' ? <Picker key={step} value={draft} mode={step} is24Hour display="default" onChange={change} /> : <Modal transparent visible onRequestClose={close} animationType="none"><View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: c.scrim }}><View style={{ ...control, gap: spacing.md }}><Text style={{ ...typography.bodyStrong, color: c.text }}>{label}</Text><Picker value={draft} mode={mode} display="spinner" onChange={change} /><Pressable accessibilityRole="button" accessibilityLabel="Xác nhận ngày giờ" onPress={() => { onChange(localValue(draft, mode === 'date')); close(); }} style={control}><Text style={{ ...typography.bodyStrong, color: c.primaryText }}>Xác nhận</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Hủy chọn ngày giờ" onPress={close} style={control}><Text style={{ ...typography.body, color: c.text }}>Hủy</Text></Pressable></View></View></Modal> : null}
  </View>;
}
