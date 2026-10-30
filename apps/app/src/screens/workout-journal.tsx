import { RecordRow } from '../components/record-row';
import { DetailModal } from '../components/detail-modal';
import { ActivityCard as Card } from '../components/activity-visuals';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFieldArray, useForm, UseFormReturn } from 'react-hook-form';
import * as Crypto from 'expo-crypto';
import { Badge, Button, Choices, Feedback, Label, LoadState, Pager, styles } from '../ui';
import { useLoad } from '../hooks/use-load';
import { CatalogDetail, Collection, initialRange, todayVn, Workout, WorkoutForm, workoutFieldIssues, workoutPayload } from '../features/workouts';
import { ActivityFilters, CommandState, confirmAction, Input, RangeFilter, showFieldErrors, useCommand, useUnsaved } from '../components/workout-controls';
import { ExerciseLibrary } from './exercise-library';
import { RevisionHistory } from '../components/workout-revision-history';
import { useDirtyEffect } from '../hooks/use-dirty-effect';
import { colors, spacing } from '../design-system/theme';

const journalStatusLabels: Record<string, string> = { '': 'Nháp và hoàn tất', DRAFT: 'Nháp', COMPLETED: 'Hoàn tất', ARCHIVED: 'Lưu trữ', ALL: 'Tất cả' };

export function WorkoutJournal({ setDirty, initialCatalog }: { setDirty: (v: boolean) => void; initialCatalog?: CatalogDetail | null }) {
  const [range, setRange] = useState(initialRange), [status, setStatus] = useState(''), [page, setPage] = useState(1), [selected, setSelected] = useState<string | null>(initialCatalog ? 'new' : null), [notice, setNotice] = useState(''), [seed, setSeed] = useState(initialCatalog);
  const state = useLoad<Collection<Workout>>('/members/me/workouts?' + new URLSearchParams({ ...range, page: String(page), ...(status ? { status } : {}) }));
  const [formDirty, setFormDirty] = useState(false);
  const markDirty = useCallback((value: boolean) => { setFormDirty(value); setDirty(value); }, [setDirty]);
  const close = () => { setSelected(null); setSeed(null); markDirty(false); void state.reload(); };
  const detail = selected !== null ? <DetailModal title={selected === 'new' ? 'Buổi tập mới' : 'Chi tiết buổi tập'} onClose={() => { void (async () => { if (!formDirty || await confirmAction('Bỏ nội dung chưa lưu và về danh sách?')) close(); })(); }}><WorkoutDetail key={selected} id={selected} initialCatalog={seed} setDirty={markDirty} close={close} notice={setNotice} /></DetailModal> : null;
  return <><Card kind="journal" title="Nhật ký của bạn"><Label muted>Ghi lại bài tập và cảm nhận sau mỗi buổi. Nhật ký không thay đổi lượt gói.</Label><Feedback message={notice} tone="success" /><Button label="Tạo buổi tập" onPress={() => { setSelected('new'); setNotice(''); }} /><ActivityFilters summary={(range.from === initialRange().from && range.to === initialRange().to ? '30 ngày gần nhất' : range.from + ' → ' + range.to) + ' · ' + journalStatusLabels[status]}><RangeFilter onChange={(from, to) => { setRange({ from, to }); setPage(1); }} /><Choices value={status} options={[{ value: '', label: 'Nháp và hoàn tất' }, { value: 'DRAFT', label: 'Nháp' }, { value: 'COMPLETED', label: 'Hoàn tất' }, { value: 'ARCHIVED', label: 'Lưu trữ' }, { value: 'ALL', label: 'Tất cả' }]} onChange={v => { setStatus(v); setPage(1); }} /></ActivityFilters><LoadState state={state} empty={state.data?.total === 0} emptyText="Chưa có nhật ký trong khoảng này. Tạo buổi tập hoặc chọn khoảng ngày khác." /></Card>
    <View>{!state.loading && state.data?.items.map(w => <RecordRow key={w.id} title={w.title || 'Buổi tập'} description={w.workoutDate + ' · ' + w.exercises.length + ' bài tập'} label={'Mở buổi ' + w.workoutDate} trailing={<Badge value={w.status} />} onPress={() => setSelected(w.id)} />)}</View><Pager page={page} setPage={setPage} more={page * 20 < (state.data?.total ?? 0)} />{detail}</>;
}
function WorkoutDetail({ id, setDirty, close, notice, initialCatalog }: { id: string; setDirty: (v: boolean) => void; close: () => void; notice: (v: string) => void; initialCatalog?: CatalogDetail | null }) {
  const [savedId, setSavedId] = useState(id);
  const state = useLoad<Workout>(savedId === 'new' ? null : '/members/me/workouts/' + savedId);
  const [savedItem, setSavedItem] = useState<Workout | null>(null), [message, setMessage] = useState('');
  const saved = (workout: Workout) => {
    const text = workout.status === 'DRAFT' ? 'Đã lưu nháp. Bạn có thể tiếp tục nhập hoặc hoàn tất buổi tập.' : 'Đã lưu. Buổi tập đã hoàn tất.';
    if (workout.status === 'ARCHIVED') { notice('Đã lưu trữ buổi tập.'); close(); return; }
    setSavedItem(workout); setMessage(text);
  };
  const reload = async () => { if (savedId === 'new' && savedItem) { setSavedId(savedItem.id); setSavedItem(null); setMessage(''); } else { setSavedItem(null); setMessage(''); await state.reload(); } };
  const item = savedItem ?? state.data;
  const editorProps = { setDirty, close, saved };
  return <><LoadState state={state} />{savedId !== 'new' && !item && <Button secondary label="Về danh sách nhật ký" onPress={close} />}{!state.loading && (item ? <WorkoutEditor key={item.id + ':' + item.version} {...editorProps} item={item} savedMessage={message} reload={() => void reload()} /> : savedId === 'new' ? <WorkoutEditor {...editorProps} initialCatalog={initialCatalog} /> : null)}</>;
}
function WorkoutEditor({ item, saved, close, setDirty, reload, initialCatalog, savedMessage = '' }: { item?: Workout; saved: (w: Workout) => void; close: () => void; setDirty: (v: boolean) => void; reload?: () => void; initialCatalog?: CatalogDetail | null; savedMessage?: string }) {
  const form = useForm<WorkoutForm>({ defaultValues: { date: item?.workoutDate ?? todayVn(), title: item?.title ?? '', note: item?.note ?? '', exercises: item?.exercises.map(e => ({ ...e, sets: e.sets.map(s => ({ id: s.id, reps: s.reps === null ? '' : String(s.reps), weight: s.weightKg === null ? '' : String(s.weightKg) })) })) ?? [] } });
  const fields = useFieldArray({ control: form.control, name: 'exercises', keyName: 'fieldKey' }), command = useCommand(), [library, setLibrary] = useState(false), [history, setHistory] = useState(false);
  useEffect(() => { if (initialCatalog) form.setValue('exercises', [{ id: Crypto.randomUUID(), source: 'CATALOG', displayName: initialCatalog.nameVi, catalogExerciseId: initialCatalog.id, contentVersion: initialCatalog.contentVersion, sets: [] }], { shouldDirty: true }); }, [initialCatalog, form]);
  const dirty = form.formState.isDirty;
  useUnsaved(dirty, command.pending);
  // Tell the activity tabs to confirm before unmounting the form.
  useDirtyEffect(dirty, setDirty);
  const locked = command.pending || item?.status === 'ARCHIVED';
  const leave = async () => { if (!dirty || await confirmAction('Bỏ nội dung chưa lưu và về danh sách?')) { setDirty(false); close(); } };
  const save = form.handleSubmit(v => {
    form.clearErrors();
    const issues = workoutFieldIssues(v, item?.status === 'COMPLETED');
    if (issues.length) { showFieldErrors(form, issues); command.setError(''); return; }
    try { const input = workoutPayload(v, item?.status === 'COMPLETED'); void command.run<Workout>(item ? '/members/me/workouts/' + item.id : '/members/me/workouts', item ? { expectedVersion: item.version, input } : input, item ? 'patch' : 'post', w => { form.reset(v); setDirty(false); saved(w); }); }
    catch (e) { command.setError(e instanceof Error && e.name !== 'ZodError' ? e.message : 'Kiểm tra tên bài (1–100 ký tự), tên buổi, ghi chú và các hiệp.'); }
  });
  const transition = async (action: 'complete' | 'archive') => {
    if (!item || dirty) { command.setError('Lưu nội dung thay đổi trước khi hoàn tất hoặc lưu trữ.'); return; }
    if (action === 'archive' && !await confirmAction('Lưu trữ buổi này? Buổi sẽ không còn tham gia biểu đồ.')) return;
    if (action === 'complete') {
      const issues = workoutFieldIssues(form.getValues(), true);
      if (issues.length) { showFieldErrors(form, issues); command.setError(''); return; }
    }
    void command.run<Workout>('/members/me/workouts/' + item.id + '/' + action, { expectedVersion: item.version }, 'post', saved);
  };
  return <Card title={item ? 'Chi tiết buổi tập' : 'Buổi tập mới'}>{item ? <Badge value={item.status} /> : <Label muted>Nháp mới, chưa lưu</Label>}{dirty && <Label muted>Có thay đổi chưa lưu.</Label>}<Input control={form.control} name="date" label="Ngày tập" date disabled={locked} /><Input control={form.control} name="title" label="Tên buổi (tối đa 100 ký tự)" disabled={locked} /><Input control={form.control} name="note" label="Ghi chú (tối đa 1.000 ký tự)" disabled={locked} />
    <Label muted>Mức tạ là tổng tải ngoài (cả hai tay nếu dùng tạ đôi). Bỏ trống nếu chưa ghi; 0 là không dùng tạ ngoài.</Label>
    <Feedback message={form.formState.errors.exercises?.message ?? ''} />
    {fields.fields.map((field, index) => <Card key={field.fieldKey} title={'Bài ' + (index + 1)}>{field.source === 'CATALOG' ? <Label>{field.displayName} · bài mẫu</Label> : <Input control={form.control} name={`exercises.${index}.displayName`} label={'Tên bài ' + (index + 1)} disabled={locked} />}<Feedback message={form.formState.errors.exercises?.[index]?.sets?.message ?? ''} /><SetFields form={form} index={index} disabled={locked} /><Button danger label={'Bỏ bài ' + (index + 1) + ' khỏi form'} disabled={locked} onPress={() => fields.remove(index)} /></Card>)}
    {!locked && <View style={styles.row}><Button secondary label="Thêm bài tự nhập" disabled={fields.fields.length >= 30} onPress={() => fields.append({ id: Crypto.randomUUID(), source: 'CUSTOM', displayName: '', sets: [] })} />{item?.status !== 'COMPLETED' && <Button secondary label={library ? 'Đóng thư viện' : 'Chọn từ bài mẫu'} disabled={fields.fields.length >= 30} onPress={() => setLibrary(v => !v)} />}</View>}
    {library && !locked && <ExerciseLibrary onSelect={c => { if (fields.fields.length >= 30) return; fields.append({ id: Crypto.randomUUID(), source: 'CATALOG', displayName: c.nameVi, catalogExerciseId: c.id, contentVersion: c.contentVersion, sets: [] }); setLibrary(false); }} />}
    <Feedback message={dirty ? '' : savedMessage} tone="success" /><CommandState command={command} />{item?.status !== 'ARCHIVED' && <><Button secondary={item?.status === 'DRAFT' && !dirty} label={item ? 'Lưu thay đổi' : 'Lưu nháp'} disabled={!!item && !dirty} pending={command.pending} onPress={() => { form.clearErrors(); void save(); }} />{item?.status === 'DRAFT' && <Button label="Hoàn tất buổi tập" disabled={dirty} pending={command.pending} onPress={() => void transition('complete')} />}{item && <Button danger label="Lưu trữ buổi tập" disabled={dirty} pending={command.pending} onPress={() => void transition('archive')} />}</>}
    {reload && <Button secondary label="Tải bản mới để đối chiếu" disabled={command.pending} onPress={() => { void (async () => { if (!dirty || await confirmAction('Tải bản mới sẽ bỏ phần chưa lưu. Tiếp tục?')) { setDirty(false); reload(); } })(); }} />}
    <Button secondary label="Đóng buổi tập" disabled={command.pending} onPress={() => void leave()} />{item && <><Button secondary label={history ? 'Ẩn lịch sử sửa' : 'Xem lịch sử sửa'} disabled={command.pending} onPress={() => setHistory(v => !v)} />{history && <RevisionHistory base={'/members/me/workouts/' + item.id} />}</>}
  </Card>;
}
function SetFields({ form, index, disabled }: { form: UseFormReturn<WorkoutForm>; index: number; disabled: boolean }) {
  const sets = useFieldArray({ control: form.control, name: `exercises.${index}.sets`, keyName: 'fieldKey' });
  return <>{sets.fields.map((s, n) => <View key={s.fieldKey} style={{ gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderColor: colors.border }}><Label>Hiệp {n + 1}</Label><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}><View style={{ flexGrow: 1, flexBasis: 120, minWidth: 0 }}><Input control={form.control} name={`exercises.${index}.sets.${n}.reps`} label={'Số lần hiệp ' + (n + 1)} caption="Số lần" numeric disabled={disabled} /></View><View style={{ flexGrow: 1, flexBasis: 120, minWidth: 0 }}><Input control={form.control} name={`exercises.${index}.sets.${n}.weight`} label={'Mức tạ (kg) hiệp ' + (n + 1)} caption="Mức tạ (kg)" numeric disabled={disabled} /></View></View><Button secondary label={'Bỏ hiệp ' + (n + 1)} disabled={disabled} onPress={() => sets.remove(n)} /></View>)}<Button secondary label="Thêm hiệp" disabled={disabled || sets.fields.length >= 30} onPress={() => sets.append({ id: Crypto.randomUUID(), reps: '', weight: '' })} /></>;
}
