import { useState } from 'react';
import { z } from 'zod';
import { Card, Form, Label, Choices, LoadState, Page, RecordPicker, useLoad, mutation, Field, iso, Badge, dateTime, Pager } from '../ui';
import { Membership, Pass, Person } from '../models';
import { endAfterMonths, membershipPresets } from '../features/membership-presets';
const customPackageFields: Field[] = [
  { name: 'name', label: 'Tên gói' },
  { name: 'mode', label: 'Loại gói', defaultValue: 'SESSION_BASED', options: [{ value: 'SESSION_BASED', label: 'Theo số lượt' }, { value: 'TIME_BASED', label: 'Theo thời gian' }] },
  { name: 'startAt', label: 'Ngày bắt đầu (YYYY-MM-DD)', defaultValue: new Date().toLocaleDateString('en-CA') },
  { name: 'endAt', label: 'Ngày kết thúc (YYYY-MM-DD, chỉ gói thời gian)' },
  { name: 'totalSessions', label: 'Số lượt (chỉ gói số lượt)', numeric: true },
  { name: 'priceVnd', label: 'Giá gói (VNĐ, nếu có)', numeric: true },
];
const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
export function packageFieldsFor(presetId: string): Field[] {
  const preset = membershipPresets.find(item => item.id === presetId);
  return preset ? [
    { name: 'startAt', label: 'Ngày bắt đầu (YYYY-MM-DD)', defaultValue: new Date().toLocaleDateString('en-CA') },
    { name: 'priceVnd', label: 'Giá gói (VNĐ, có thể sửa)', numeric: true, defaultValue: String(preset.priceVnd) },
  ] : customPackageFields;
}
export function PackagePresetPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const options = (mode: 'SESSION_BASED' | 'TIME_BASED') => membershipPresets.filter(item => item.mode === mode).map(item => ({ value: item.id, label: item.name + ' · ' + money(item.priceVnd) }));
  return <Card title="Chọn gói hội viên mẫu"><Label>Theo số buổi</Label><Choices value={value} onChange={onChange} options={[{ value: '', label: 'Tự nhập' }, ...options('SESSION_BASED')]} /><Label>Theo thời gian</Label><Choices value={value} onChange={onChange} options={options('TIME_BASED')} /><Label muted>Giá gợi ý cho quyền vào tập; Owner có thể sửa trước khi lưu. Không bao gồm PT 1:1 và không ghi nhận thanh toán.</Label></Card>;
}
export function packageBody(v: Record<string, string>, presetId = '') {
  const preset = membershipPresets.find(item => item.id === presetId);
  const startAt = iso(v.startAt);
  const priceVnd = preset ? z.number().int().positive().parse(Number(v.priceVnd))
    : v.priceVnd?.trim() ? z.number().int().positive().parse(Number(v.priceVnd)) : undefined;
  if (preset) return { name: preset.name, mode: preset.mode, startAt, priceVnd,
    ...(preset.mode === 'TIME_BASED' ? { endAt: endAfterMonths(startAt, preset.months!) } : { totalSessions: preset.totalSessions! }) };
  const name = z.string().trim().min(1).parse(v.name);
  return { name, mode: v.mode, startAt, priceVnd, ...(v.mode === 'TIME_BASED' ? { endAt: iso(v.endAt) } : { totalSessions: z.number().int().positive().parse(Number(v.totalSessions)) }) };
}
export function PackageCard({ item }: { item: Membership }) {
  return <Card title={item.name}><Badge value={item.effectiveStatus} /><Label>{item.mode === 'TIME_BASED' ? 'Hết hạn: ' + dateTime(item.endAt!) : 'Còn ' + item.remainingSessions + ' / ' + item.totalSessions + ' lượt'}</Label>{item.priceVnd != null && <Label muted>Giá ghi nhận: {money(item.priceVnd)}</Label>}</Card>;
}
function PresetPackageForm({ label, submit, onSuccess }: { label: string; submit: (body: ReturnType<typeof packageBody>, key: string) => Promise<unknown>; onSuccess: () => void }) {
  const [presetId, setPresetId] = useState('');
  return <><PackagePresetPicker value={presetId} onChange={setPresetId} /><Form key={presetId || 'custom'} fields={packageFieldsFor(presetId)} label={label} submit={(values, key) => submit(packageBody(values, presetId), key)} onSuccess={onSuccess} /></>;
}
export default function Packages() {
  const [page, setPage] = useState(1), people = useLoad<Person[]>('/people?role=MEMBER&page=' + page), [memberId, setMember] = useState('');
  return <Page title="Gói tập" subtitle="Kích hoạt và gia hạn; lịch sử gói luôn được giữ."><Card title="6 gói hội viên mẫu"><Label muted>Giá gợi ý theo thị trường, chưa phải giao dịch hay giá PT 1:1. Chọn Member bên dưới để áp dụng.</Label>{membershipPresets.map(item => <Label key={item.id}>{item.name} · {money(item.priceVnd)}</Label>)}</Card><LoadState state={people} empty={!people.data?.length} emptyText="Chưa có Member để quản lý gói." />
    <RecordPicker label="Chọn Member" value={memberId} onChange={setMember} options={(people.data ?? []).map(p => ({ value: p.id, label: p.profile.fullName, meta: p.phone }))} /><Pager page={page} setPage={setPage} more={people.data?.length === 30} />
    {memberId ? <MemberPackages key={memberId} memberId={memberId} /> : null}
  </Page>;
}
export function MemberPackages({ memberId }: { memberId: string }) {
  const state = useLoad<Membership[]>('/members/' + memberId + '/memberships');
  const passes = useLoad<Pass[]>('/members/' + memberId + '/external-pt-passes');
  const [action, setAction] = useState<{ id: string; type: 'renew' | 'cancel' } | null>(null);
  return <><Card title="Thêm gói tập"><PresetPackageForm label="Kích hoạt gói" submit={(body, key) => mutation('/members/' + memberId + '/memberships', body, key)} onSuccess={() => void state.reload()} /></Card>
    <Card title="External PT Pass"><LoadState state={passes} />{passes.data?.map(p => <Label key={p.id}>Còn {p.totalUses - p.usedUses} / {p.totalUses} lượt · {p.status}</Label>)}
      <Form fields={[{ name: 'totalUses', label: 'Số lượt pass mới', numeric: true }]} label="Tạo External PT Pass" submit={(v, k) => mutation('/members/' + memberId + '/external-pt-passes', { totalUses: Number(v.totalUses) }, k)} onSuccess={() => void passes.reload()} />
    </Card>
    <LoadState state={state} empty={!state.data?.length} />{state.data?.map(item => <Card key={item.id}><PackageCard item={item} /><Choices value={action?.id === item.id ? action.type : ''} options={[{ value: 'renew', label: 'Gia hạn' }, { value: 'cancel', label: 'Hủy gói' }]} onChange={type => setAction({ id: item.id, type: type as 'renew' | 'cancel' })} /></Card>)}
    {action && <Card title={action.type === 'renew' ? 'Gia hạn bằng gói mới' : 'Xác nhận hủy gói'}>{action.type === 'renew'
      ? <PresetPackageForm key={action.id} label="Gia hạn gói" submit={(body, key) => mutation('/memberships/' + action.id + '/renew', body, key)} onSuccess={() => { setAction(null); void state.reload(); }} />
      : <Form fields={[{ name: 'reason', label: 'Lý do hủy' }]} submit={(values, key) => mutation('/memberships/' + action.id + '/cancel', { reason: values.reason }, key)} onSuccess={() => { setAction(null); void state.reload(); }} />}</Card>}
  </>;
}
