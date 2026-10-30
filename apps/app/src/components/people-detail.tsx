import { View } from 'react-native';
import { PopupRow } from './record-row';
import { useState } from 'react';
import { Person } from '../models';
import { Badge, Button, Card, Choices, Label, LoadState, Pager } from '../ui';
import { Form } from './form';
import { mutation } from '../lib/http';
import { useLoad } from '../hooks/use-load';
import { MemberPackageSummary } from '../screens/packages';

type Assignment = { id: string; ptId: string; ptName?: string; status: string; reason: string };
export function PeopleDetail({ person, busy, run, onUpdated }: { person: Person; busy: boolean; run: (action: () => Promise<unknown>) => Promise<unknown>; onUpdated: () => void }) {
  const member = person.role === 'MEMBER';
  const [section, setSection] = useState('info'), [ptPage, setPtPage] = useState(1), [cancel, setCancel] = useState(false);
  const history = useLoad<Assignment[]>(member ? '/members/' + person.id + '/pt-assignment/history' : null);
  const pts = useLoad<Person[]>(section === 'pt' ? '/people?role=PT&page=' + ptPage : null);
  const active = history.data?.find(item => item.status === 'ACTIVE');
  return <>
    <Choices disabled={busy} value={section} onChange={setSection} options={[{ value: 'info', label: 'Thông tin' }, { value: 'edit', label: 'Sửa hồ sơ' }, ...(member ? [{ value: 'pt', label: 'PT phụ trách' }] : [])]} />
    {section === 'info' && <>
      <Card title="Hồ sơ"><Label>{person.profile.fullName}</Label><Label>SĐT: {person.phone}</Label><Label>CCCD: {person.profile.cccd || 'Chưa cập nhật'}</Label><Badge value={person.status} /><Label muted>{member ? 'Hội viên chính thức' : 'Huấn luyện viên nội bộ'}</Label></Card>
      {member && <><Card title="PT chính"><LoadState state={history} empty={!active} emptyText="Member chưa có PT chính đang hoạt động." />{!history.loading && !history.error && active && <Label>{active.ptName ?? 'PT nội bộ'}</Label>}</Card><MemberPackageSummary memberId={person.id} /></>}
    </>}
    {section === 'edit' && <Card title="Cập nhật hồ sơ"><Form disabled={busy} fields={[
      { name: 'fullName', label: 'Họ tên mới (để trống nếu giữ nguyên)' },
      { name: 'cccd', label: 'CCCD mới (để trống nếu giữ nguyên)', numeric: true },
      { name: 'status', label: 'Trạng thái', defaultValue: person.status, options: [{ value: 'ACTIVE', label: 'Hoạt động' }, { value: 'INACTIVE', label: 'Ngừng hoạt động' }, { value: 'LOCKED', label: 'Khóa' }] },
      { name: 'reason', label: 'Lý do thay đổi' },
    ]} label="Lưu hồ sơ" submit={(v, k) => run(() => mutation('/people/' + person.id, Object.fromEntries(Object.entries(v).filter(([, value]) => value !== '')), k, 'patch'))} onSuccess={onUpdated} /></Card>}
    {section === 'pt' && <>
      <Card title="Gán / đổi PT chính"><LoadState state={pts} /><Form disabled={busy || pts.loading || !!pts.error} beforeFields={pending => <Pager disabled={pending} page={ptPage} setPage={n => { if (!pending) setPtPage(n); }} more={pts.data?.length === 30} />} fields={[{ name: 'ptId', label: 'PT nội bộ', picker: true, options: (pts.data ?? []).filter(p => p.status === 'ACTIVE').map(p => ({ value: p.id, label: p.profile.fullName })) }, { name: 'reason', label: 'Lý do' }]} label="Lưu PT phụ trách" submit={(v, k) => run(() => mutation('/members/' + person.id + '/pt-assignment', v, k))} onSuccess={() => { setCancel(false); void history.reload(); }} /></Card>
      <Button danger label="Hủy PT phụ trách" disabled={busy || history.loading || !!history.error || !active} expanded={cancel} onPress={() => setCancel(!cancel)} />
      {cancel && <Card title="Hủy assignment"><Form danger disabled={busy} fields={[{ name: 'reason', label: 'Lý do hủy' }]} label="Xác nhận hủy PT" submit={(v, k) => run(() => mutation('/members/' + person.id + '/pt-assignment', v, k, 'delete'))} onSuccess={() => { setCancel(false); void history.reload(); }} /></Card>}
      <Card title="Lịch sử assignment"><LoadState state={history} empty={!history.data?.length} /><View>{!history.loading && !history.error && history.data?.map(item => <PopupRow key={item.id} title={item.ptName ?? 'PT nội bộ'} trailing={<Badge value={item.status} />}><Badge value={item.status} /><Label>{item.ptName ?? 'PT nội bộ'}</Label><Label muted>{item.reason}</Label></PopupRow>)}</View></Card>
    </>}
  </>;
}
