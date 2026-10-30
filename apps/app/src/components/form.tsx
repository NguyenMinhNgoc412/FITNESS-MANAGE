import { ReactNode, useEffect, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import * as Crypto from 'expo-crypto';
import { Button, Choices, RecordPicker, styles } from '../ui';
import { spacing } from '../design-system/theme';
import { errorMessage } from '../lib/http';
import DateTimeField from './date-time-field';
import { useDetailLocked, useDetailPending } from './detail-state';

export type Field = { name: string; label: string; secret?: boolean; numeric?: boolean; picker?: boolean; dateTime?: boolean; date?: boolean; options?: { value: string; label: string }[]; defaultValue?: string };
export function Form({ fields, schema, submit, label = 'Lưu', onSuccess, revision, preserveFields = [], beforeFields, danger = false, disabled = false }: { fields: Field[]; schema?: z.ZodTypeAny; submit: (values: Record<string, string>, key: string) => Promise<unknown>; label?: string; onSuccess?: () => void; revision?: string; preserveFields?: readonly string[]; beforeFields?: (pending: boolean) => ReactNode; danger?: boolean; disabled?: boolean }) {
  const { control, handleSubmit, reset, getValues, formState: { isSubmitting } } = useForm<Record<string, string>>({ defaultValues: Object.fromEntries(fields.map(f => [f.name, f.defaultValue ?? ''])) });
  const [error, setError] = useState(''), [success, setSuccess] = useState(false);
  const detailLocked = useDetailLocked();
  useDetailPending(isSubmitting);
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
    if (pending.current || disabled || detailLocked) return;
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
  const locked = isSubmitting || disabled || detailLocked;
  return <View style={{ gap: spacing.md }}>
    {beforeFields?.(locked)}
    {fields.map(field => <Controller key={field.name} name={field.name} control={control} render={({ field: { value, onChange, onBlur } }) => <View style={{ gap: spacing.sm }}>
      {!(field.options && (field.picker || field.options.length > 5)) && <Text style={styles.text}>{field.label}</Text>}
      {field.dateTime || field.date ? <DateTimeField mode={field.date ? 'date' : 'datetime'} label={field.label} value={value} onChange={onChange} onBlur={onBlur} disabled={locked} /> : field.options ? (field.picker || field.options.length > 5 ? <RecordPicker disabled={locked} value={value} options={field.options} onChange={onChange} label={field.label} /> : <Choices disabled={locked} value={value} options={field.options} onChange={onChange} />) : <TextInput accessibilityLabel={field.label} editable={!locked} style={styles.input} value={value} onChangeText={onChange} onBlur={onBlur} autoCapitalize="none" secureTextEntry={field.secret} keyboardType={field.numeric ? 'number-pad' : 'default'} />}
    </View>} />)}
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    {success ? <Text accessibilityLiveRegion="polite" style={styles.success}>Đã thực hiện thành công.</Text> : null}
    <Button label={label} danger={danger} disabled={disabled || detailLocked} pending={isSubmitting} onPress={() => void handleSubmit(run)()} />
  </View>;
}
