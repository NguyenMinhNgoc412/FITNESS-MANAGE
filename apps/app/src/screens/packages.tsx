import { useState } from 'react';
import { z } from 'zod';
import { Card, Form, Label, Choices, LoadState, Page, RecordPicker, useLoad, mutation, Field, iso, Badge, dateTime, Pager } from '../ui';
import { Membership, Pass, Person } from '../models';
export const packageFields: Field[] = [
  { name: 'name', label: 'Tên gói' },
  { name: 'mode', label: 'Loại gói', defaultValue: 'SESSION_BASED', options: [{ value: 'SESSION_BASED', label: 'Theo số lượt' }, { value: 'TIME_BASED', label: 'Theo thời gian' }] },
  { name: 'startAt', label: 'Ngày bắt đầu (YYYY-MM-DD)', defaultValue: new Date().toLocaleDateString('en-CA') },
  { name: 'endAt', label: 'Ngày kết thúc (YYYY-MM-DD, chỉ gói thời gian)' },
  { name: 'totalSessions', label: 'Số lượt (chỉ gói số lượt)', numeric: true },
];
export function packageBody(v: Record<string, string>) {
  const name = z.string().trim().min(1).parse(v.name);
  return { name, mode: v.mode, startAt: iso(v.startAt), ...(v.mode === 'TIME_BASED' ? { endAt: iso(v.endAt) } : { totalSessions: z.number().int().positive().parse(Number(v.totalSessions)) }) };
}
export function PackageCard({ item }: { item: Membership }) {
  return <Card title={item.name}><Badge value={item.effectiveStatus} /><Label>{item.mode === 'TIME_BASED' ? 'Hết hạn: ' + dateTime(item.endAt!) : 'Còn ' + item.remainingSessions + ' / ' + item.totalSessions + ' lượt'}</Label></Card>;
}
export default function Packages() {
  const [page, setPage] = useState(1), people = useLoad<Person[]>('/people?role=MEMBER&page=' + page), [memberId, setMember] = useState('');
  return <Page title="Gói tập" subtitle="Kích hoạt và gia hạn; lịch sử gói luôn được giữ."><LoadState state={people} empty={!people.data?.length} emptyText="Chưa có Member để quản lý gói." />
    <RecordPicker label="Chọn Member" value={memberId} onChange={setMember} options={(people.data ?? []).map(p => ({ value: p.id, label: p.profile.fullName, meta: p.phone }))} /><Pager page={page} setPage={setPage} more={people.data?.length === 30} />
    {memberId && <MemberPackages key={memberId} memberId={memberId} />}
  </Page>;
}
export function MemberPackages({ memberId }: { memberId: string }) {
  const state = useLoad<Membership[]>('/members/' + memberId + '/memberships');
  const passes = useLoad<Pass[]>('/members/' + memberId + '/external-pt-passes');
  const [action, setAction] = useState<{ id: string; type: 'renew' | 'cancel' } | null>(null);
  return <><Card title="Thêm gói tập"><Form fields={packageFields} label="Kích hoạt gói" submit={(v, k) => mutation('/members/' + memberId + '/memberships', packageBody(v), k)} onSuccess={() => void state.reload()} /></Card>
    <Card title="External PT Pass"><LoadState state={passes} />{passes.data?.map(p => <Label key={p.id}>Còn {p.totalUses - p.usedUses} / {p.totalUses} lượt · {p.status}</Label>)}
      <Form fields={[{ name: 'totalUses', label: 'Số lượt pass mới', numeric: true }]} label="Tạo External PT Pass" submit={(v, k) => mutation('/members/' + memberId + '/external-pt-passes', { totalUses: Number(v.totalUses) }, k)} onSuccess={() => void passes.reload()} />
    </Card>
    <LoadState state={state} empty={!state.data?.length} />{state.data?.map(item => <Card key={item.id}><PackageCard item={item} /><Choices value={action?.id === item.id ? action.type : ''} options={[{ value: 'renew', label: 'Gia hạn' }, { value: 'cancel', label: 'Hủy gói' }]} onChange={type => setAction({ id: item.id, type: type as 'renew' | 'cancel' })} /></Card>)}
    {action && <Card title={action.type === 'renew' ? 'Gia hạn bằng gói mới' : 'Xác nhận hủy gói'}><Form key={action.id + action.type} fields={action.type === 'renew' ? packageFields : [{ name: 'reason', label: 'Lý do hủy' }]} submit={(v, k) => mutation('/memberships/' + action.id + '/' + action.type, action.type === 'renew' ? packageBody(v) : { reason: v.reason }, k)} onSuccess={() => { setAction(null); void state.reload(); }} /></Card>}
  </>;
}
