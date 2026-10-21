import { useState } from 'react';
import { z } from 'zod';
import { Card, Label, Choices, LoadState, Page, RecordPicker, Badge, Pager } from '../ui';
import { Form, Field } from '../components/form';
import { useLoad } from '../hooks/use-load';
import { mutation } from '../lib/http';
import { iso, dateTime } from '../lib/date-time';
import { Membership, Pass, Person } from '../models';
import { endAfterMonths, membershipPresets } from '../features/membership-presets';
import { localDateValue } from '../features/conversion-input';
import { PackageStatistics } from './statistics';
const customPackageFields: Field[] = [
  { name: 'name', label: 'Tên gói' },
  { name: 'mode', label: 'Loại gói', defaultValue: 'SESSION_BASED', options: [{ value: 'SESSION_BASED', label: 'Theo số lượt' }, { value: 'TIME_BASED', label: 'Theo thời gian' }] },
  { name: 'startAt', date: true, label: 'Ngày bắt đầu', defaultValue: localDateValue() },
  { name: 'endAt', date: true, label: 'Ngày kết thúc (gói thời gian)' },
  { name: 'totalSessions', label: 'Số lượt (chỉ gói số lượt)', numeric: true },
  { name: 'priceVnd', label: 'Giá gói (VNĐ, nếu có)', numeric: true },
];
const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
export function packageFieldsFor(presetId: string): Field[] {
  const preset = membershipPresets.find(item => item.id === presetId);
  return preset ? [
    { name: 'startAt', date: true, label: 'Ngày bắt đầu', defaultValue: localDateValue() },
    { name: 'priceVnd', label: 'Giá gói (VNĐ, có thể sửa)', numeric: true, defaultValue: String(preset.priceVnd) },
  ] : customPackageFields;
}
export function PackagePresetPicker({ value, onChange, disabled = false }: { value: string; onChange: (id: string) => void; disabled?: boolean }) {
  const options = (mode: 'SESSION_BASED' | 'TIME_BASED') => membershipPresets.filter(item => item.mode === mode).map(item => ({ value: item.id, label: item.name + ' · ' + money(item.priceVnd) }));
  return <Card title="Chọn gói hội viên mẫu"><Label>Theo số buổi</Label><Choices disabled={disabled} value={value} onChange={onChange} options={[{ value: '', label: 'Tự nhập' }, ...options('SESSION_BASED')]} /><Label>Theo thời gian</Label><Choices disabled={disabled} value={value} onChange={onChange} options={options('TIME_BASED')} /><Label muted>Giá gợi ý cho quyền vào tập; Owner có thể sửa trước khi lưu. Không bao gồm PT 1:1 và không ghi nhận thanh toán.</Label></Card>;
}
export function packageBody(v: Record<string, string>, presetId = '') {
  const preset = membershipPresets.find(item => item.id === presetId);
  const startAt = iso(v.startAt);
  const price = z.number({ invalid_type_error: 'Giá gói phải là số nguyên VNĐ, không dùng dấu phân cách.' }).int('Giá gói phải là số nguyên VNĐ.').positive('Giá gói phải lớn hơn 0.').max(1000000000, 'Giá gói không được quá 1 tỷ VNĐ.');
  const priceVnd = preset ? price.parse(Number(v.priceVnd))
    : v.priceVnd?.trim() ? price.parse(Number(v.priceVnd)) : undefined;
  if (preset) return { name: preset.name, mode: preset.mode, startAt, priceVnd,
    ...(preset.mode === 'TIME_BASED' ? { endAt: endAfterMonths(startAt, preset.months!) } : { totalSessions: preset.totalSessions! }) };
  const name = z.string().trim().min(1, 'Nhập tên gói tập.').max(200, 'Tên gói không được quá 200 ký tự.').parse(v.name);
  const mode = z.enum(['TIME_BASED', 'SESSION_BASED'], { errorMap: () => ({ message: 'Chọn loại gói tập.' }) }).parse(v.mode);
  if (mode === 'TIME_BASED') {
    const endAt = iso(v.endAt);
    if (Date.parse(endAt) <= Date.parse(startAt)) throw new z.ZodError([{ code: 'custom', path: ['endAt'], message: 'Ngày kết thúc phải sau ngày bắt đầu.' }]);
    return { name, mode, startAt, priceVnd, endAt };
  }
  return { name, mode, startAt, priceVnd, totalSessions: z.number({ invalid_type_error: 'Số lượt phải là số nguyên dương.' }).int('Số lượt phải là số nguyên.').positive('Số lượt phải lớn hơn 0.').max(10000, 'Số lượt không được quá 10.000.').parse(Number(v.totalSessions)) };
}
export function PackageCard({ item }: { item: Membership }) {
  return <Card title={item.name}><Badge value={item.effectiveStatus} /><Label>{item.mode === 'TIME_BASED' ? 'Hết hạn: ' + dateTime(item.endAt!) : 'Còn ' + item.remainingSessions + ' / ' + item.totalSessions + ' lượt'}</Label>{item.priceVnd != null && <Label muted>Giá ghi nhận: {money(item.priceVnd)}</Label>}</Card>;
}
export function MemberPackageSummary({ memberId }: { memberId: string }) {
  const state = useLoad<Membership[]>('/members/' + memberId + '/memberships');
  const items = [...(state.data ?? [])].sort((a, b) => Number(b.effectiveStatus === 'ACTIVE') - Number(a.effectiveStatus === 'ACTIVE'));
  return <Card title="Gói tập của Member"><LoadState state={state} empty={!items.length} emptyText="Member chưa có gói tập." />
    {!state.loading && !state.error && items.length > 0 && !items.some(item => item.effectiveStatus === 'ACTIVE') ? <Label muted>Hiện chưa có gói đang hoạt động. Các gói đã cấp được giữ bên dưới.</Label> : null}
    {!state.loading && !state.error && items.map(item => <PackageCard key={item.id} item={item} />)}
  </Card>;
}
function PresetPackageForm({ label, submit, onSuccess }: { label: string; submit: (body: ReturnType<typeof packageBody>, key: string) => Promise<unknown>; onSuccess: () => void }) {
  const [presetId, setPresetId] = useState('');
  return <Form revision={presetId} beforeFields={pending => <PackagePresetPicker value={presetId} onChange={setPresetId} disabled={pending} />} fields={packageFieldsFor(presetId)} label={label} submit={(values, key) => submit(packageBody(values, presetId), key)} onSuccess={onSuccess} />;
}
export default function Packages() {
  const [page, setPage] = useState(1), people = useLoad<Person[]>('/people?role=MEMBER&page=' + page), [memberId, setMember] = useState('');
  return <Page title="Gói tập" subtitle="Kích hoạt và gia hạn; lịch sử gói luôn được giữ."><LoadState state={people} empty={!people.data?.length} emptyText="Chưa có Member để quản lý gói." />
    <PackageStatistics />
    <RecordPicker label="Chọn Member" value={memberId} onChange={setMember} options={(people.data ?? []).map(p => ({ value: p.id, label: p.profile.fullName, meta: p.phone }))} /><Pager page={page} setPage={setPage} more={people.data?.length === 30} />
    {memberId ? <MemberPackages key={memberId} memberId={memberId} /> : null}
  </Page>;
}
export function MemberPackages({ memberId }: { memberId: string }) {
  const state = useLoad<Membership[]>('/members/' + memberId + '/memberships');
  const passes = useLoad<Pass[]>('/members/' + memberId + '/external-pt-passes');
  const [action, setAction] = useState<{ id: string; type: 'renew' | 'cancel' } | null>(null);
  return <>
    <LoadState state={state} empty={!state.data?.length} />{state.data?.map(item => <Card key={item.id}><PackageCard item={item} /><Choices value={action?.id === item.id ? action.type : ''} options={[{ value: 'renew', label: 'Gia hạn' }, { value: 'cancel', label: 'Hủy gói' }]} onChange={type => setAction({ id: item.id, type: type as 'renew' | 'cancel' })} /></Card>)}
    <Card title="Thêm gói tập"><PresetPackageForm label="Kích hoạt gói" submit={(body, key) => mutation('/members/' + memberId + '/memberships', body, key)} onSuccess={() => void state.reload()} /></Card>
    <Card title="External PT Pass"><LoadState state={passes} />{passes.data?.map(p => <Label key={p.id}>Còn {p.totalUses - p.usedUses} / {p.totalUses} lượt · {p.status}</Label>)}
      <Form fields={[{ name: 'totalUses', label: 'Số lượt pass mới', numeric: true }]} label="Tạo External PT Pass" submit={(v, k) => mutation('/members/' + memberId + '/external-pt-passes', { totalUses: Number(v.totalUses) }, k)} onSuccess={() => void passes.reload()} />
    </Card>

    {action && <Card title={action.type === 'renew' ? 'Gia hạn bằng gói mới' : 'Xác nhận hủy gói'}>{action.type === 'renew'
      ? <PresetPackageForm key={action.id} label="Gia hạn gói" submit={(body, key) => mutation('/memberships/' + action.id + '/renew', body, key)} onSuccess={() => { setAction(null); void state.reload(); }} />
      : <Form danger label="Xác nhận hủy gói" fields={[{ name: 'reason', label: 'Lý do hủy' }]} submit={(values, key) => mutation('/memberships/' + action.id + '/cancel', { reason: values.reason }, key)} onSuccess={() => { setAction(null); void state.reload(); }} />}</Card>}
  </>;
}
