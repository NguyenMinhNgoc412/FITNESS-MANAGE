import { View } from 'react-native';
import { RecordRow } from '../components/record-row';
import { DetailModal } from '../components/detail-modal';
import { ActivityCard as Card } from '../components/activity-visuals';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Badge, Button, Choices, Feedback, Label, LoadState, Pager } from '../ui';
import { useLoad } from '../hooks/use-load';
import { Collection, initialRange, Measurement, numericInput, todayVn, validDate, validatePastDate } from '../features/workouts';
import { ActivityFilters, CommandState, confirmAction, Input, RangeFilter, showFieldErrors, useCommand, useUnsaved } from '../components/workout-controls';
import { RevisionHistory } from '../components/workout-revision-history';
import { useDirtyEffect } from '../hooks/use-dirty-effect';

export function BodyMeasurements({ setDirty }: { setDirty: (v: boolean) => void }) {
  const [range, setRange] = useState(initialRange), [page, setPage] = useState(1), [status, setStatus] = useState('ACTIVE'), [selected, setSelected] = useState<string | null>(null), [notice, setNotice] = useState('');
  const state = useLoad<Collection<Measurement>>('/members/me/body-measurements?' + new URLSearchParams({ ...range, page: String(page), status }));
  const [formDirty, setFormDirty] = useState(false);
  const markDirty = useCallback((value: boolean) => { setFormDirty(value); setDirty(value); }, [setDirty]);
  const close = () => { setSelected(null); markDirty(false); void state.reload(); };
  const detail = selected !== null ? <DetailModal title={selected === 'new' ? 'Số đo mới' : 'Chi tiết số đo'} onClose={() => { void (async () => { if (!formDirty || await confirmAction('Bỏ phần số đo chưa lưu?')) close(); })(); }}><MeasurementDetail key={selected} id={selected} setDirty={markDirty} close={close} saved={() => { setNotice('Đã lưu số đo.'); close(); }} openExisting={setSelected} /></DetailModal> : null;
  return <><Card kind="measurements" title="Cân nặng và chiều cao"><Label muted>Số đo tự nhập, không dùng để kết luận sức khỏe. Có thể chỉ ghi một chỉ số trong ngày.</Label><Feedback message={notice} tone="success" /><Button label="Ghi số đo" onPress={() => setSelected('new')} /><ActivityFilters summary={(range.from === initialRange().from && range.to === initialRange().to ? '30 ngày gần nhất' : range.from + ' → ' + range.to) + ' · ' + (status === 'ACTIVE' ? 'Đang dùng' : status === 'ARCHIVED' ? 'Lưu trữ' : 'Tất cả')}><RangeFilter onChange={(from, to) => { setRange({ from, to }); setPage(1); }} /><Choices value={status} onChange={s => { setStatus(s); setPage(1); }} options={[{ value: 'ACTIVE', label: 'Đang dùng' }, { value: 'ARCHIVED', label: 'Lưu trữ' }, { value: 'ALL', label: 'Tất cả' }]} /></ActivityFilters><LoadState state={state} empty={state.data?.total === 0} emptyText="Chưa có số đo trong khoảng ngày này." /></Card><View>{!state.loading && state.data?.items.map(m => <RecordRow key={m.id} title={m.measurementDate} description={'Cân nặng: ' + (m.weightKg === null ? 'Chưa đo' : m.weightKg + ' kg') + ' · Chiều cao: ' + (m.heightCm === null ? 'Chưa đo' : m.heightCm + ' cm')} label={'Mở số đo ' + m.measurementDate} trailing={<Badge value={m.status} />} onPress={() => setSelected(m.id)} />)}</View><Pager page={page} setPage={setPage} more={page * 20 < (state.data?.total ?? 0)} />{detail}</>;
}
function MeasurementDetail({ id, setDirty, close, saved, openExisting }: { id: string; setDirty: (v: boolean) => void; close: () => void; saved: () => void; openExisting: (id: string) => void }) {
  const state = useLoad<Measurement>(id === 'new' ? null : '/members/me/body-measurements/' + id);
  if (id === 'new') return <MeasurementEditor setDirty={setDirty} close={close} saved={saved} openExisting={openExisting} />;
  return <><LoadState state={state} />{!state.data && <Button secondary label="Về danh sách số đo" onPress={close} />}{!state.loading && state.data && <MeasurementEditor key={state.data.id + ':' + state.data.version} item={state.data} setDirty={setDirty} close={close} saved={saved} openExisting={openExisting} reload={() => void state.reload()} />}</>;
}
function MeasurementEditor({ item, setDirty, close, saved, openExisting, reload }: { item?: Measurement; setDirty: (v: boolean) => void; close: () => void; saved: () => void; openExisting: (id: string) => void; reload?: () => void }) {
  const form = useForm({ defaultValues: { date: item?.measurementDate ?? todayVn(), weight: item?.weightKg == null ? '' : String(item.weightKg), height: item?.heightCm == null ? '' : String(item.heightCm) } }), command = useCommand(), [history, setHistory] = useState(false);
  const dirty = form.formState.isDirty; useUnsaved(dirty, command.pending); useDirtyEffect(dirty, setDirty);
  const date = form.watch('date');
  const existing = useLoad<Collection<Measurement>>(!item && validDate(date) ? '/members/me/body-measurements?from=' + date + '&to=' + date + '&status=ACTIVE' : null);
  const locked = command.pending || item?.status === 'ARCHIVED';
  const discard = async (next: () => void) => { if (!dirty || await confirmAction('Bỏ phần số đo chưa lưu?')) { setDirty(false); next(); } };
  const save = form.handleSubmit(v => {
    form.clearErrors();
    const issues: { path: 'date' | 'weight' | 'height'; message: string }[] = [];
    try { validatePastDate(v.date); } catch { issues.push({ path: 'date', message: 'Chọn ngày đo hợp lệ, không ở tương lai.' }); }
    let weightKg: number | null = null, heightCm: number | null = null;
    try { weightKg = numericInput(v.weight, 500, 2, true, 'Cân nặng (kg)'); } catch (e) { issues.push({ path: 'weight', message: (e as Error).message }); }
    try { heightCm = numericInput(v.height, 300, 1, true, 'Chiều cao (cm)'); } catch (e) { issues.push({ path: 'height', message: (e as Error).message }); }
    if (!issues.length && weightKg === null && heightCm === null) issues.push({ path: 'weight', message: 'Nhập cân nặng hoặc chiều cao; không cần nhập cả hai.' });
    if (issues.length) { showFieldErrors(form, issues); command.setError(''); return; }
    try {
      validatePastDate(v.date);
      const body = item ? { expectedVersion: item.version, weightKg, heightCm } : { measurementDate: v.date, weightKg, heightCm };
      void command.run('/members/me/body-measurements' + (item ? '/' + item.id : ''), body, item ? 'patch' : 'post', () => { form.reset(v); setDirty(false); saved(); });
    } catch (e) { command.setError((e as Error).message); }
  });
  return <Card title={item ? 'Chi tiết số đo' : 'Số đo mới'}>{item ? <Badge value={item.status} /> : <Label muted>Chưa lưu</Label>}<Input control={form.control} name="date" label="Ngày đo" date disabled={locked || !!item} /><Input control={form.control} name="weight" label="Cân nặng cơ thể (kg, tối đa 2 số thập phân)" numeric disabled={locked} /><Input control={form.control} name="height" label="Chiều cao (cm, tối đa 1 số thập phân)" numeric disabled={locked} /><Label muted>Bỏ trống là chưa đo, không phải 0. Xóa giá trị nghĩa là chưa ghi số đo đó; dữ liệu trước vẫn có trong lịch sử. Ngày đo không sửa được.</Label>
    {!item && <><LoadState state={existing} />{!!existing.data?.items.length && <><Label>Ngày này đã có số đo. Mở bản đang có để bổ sung.</Label><Button secondary label="Mở số đo đang có" disabled={command.pending} onPress={() => void discard(() => openExisting(existing.data!.items[0].id))} /></>}</>}
    <CommandState command={command} />{item?.status !== 'ARCHIVED' && <Button label="Lưu số đo" pending={command.pending} disabled={!item && (!!existing.data?.items.length || existing.loading || !!existing.error)} onPress={() => { form.clearErrors(); void save(); }} />}
    {item && item.status !== 'ARCHIVED' && <Button danger label="Lưu trữ số đo" pending={command.pending} disabled={dirty} onPress={() => { void (async () => { if (await confirmAction('Lưu trữ số đo? Bản này sẽ không còn tham gia biểu đồ.')) void command.run('/members/me/body-measurements/' + item.id + '/archive', { expectedVersion: item.version }, 'post', saved); })(); }} />}
    {reload && <Button secondary label="Tải số đo mới để đối chiếu" disabled={command.pending} onPress={() => void discard(reload)} />}
    <Button secondary label="Đóng số đo" disabled={command.pending} onPress={() => void discard(close)} />{item && <><Button secondary label={history ? 'Ẩn lịch sử số đo' : 'Xem lịch sử số đo'} onPress={() => setHistory(v => !v)} />{history && <RevisionHistory base={'/members/me/body-measurements/' + item.id} />}</>}
  </Card>;
}
