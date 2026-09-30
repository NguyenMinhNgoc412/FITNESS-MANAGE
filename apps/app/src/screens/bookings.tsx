import { useState } from 'react';
import { useAuthStore } from '../store/auth';
import { Badge, Button, Card, Field, Form, Label, LoadState, Page, Pager, dateTime, iso, mutation, useLoad } from '../ui';
import { Booking, Person } from '../models';
const inputDateTime = (value: string) => {
  const date = new Date(value);
  const two = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())} ${two(date.getHours())}:${two(date.getMinutes())}`;
};
export default function Bookings() {
  const owner = useAuthStore(s => s.session?.user.role === 'OWNER'), [page, setPage] = useState(1);
  const [memberPage, setMemberPage] = useState(1), [ptPage, setPtPage] = useState(1);
  const state = useLoad<Booking[]>('/bookings?page=' + page), members = useLoad<Person[]>(owner ? '/people?role=MEMBER&page=' + memberPage : null), pts = useLoad<Person[]>(owner ? '/people?role=PT&page=' + ptPage : null);
  const [editing, setEditing] = useState<Booking | null>(null), [cancelling, setCancelling] = useState('');
  const grouped = (state.data ?? []).reduce<Record<string, Booking[]>>((result, item) => { const key = new Date(item.startAt).toLocaleDateString('en-CA'); (result[key] ??= []).push(item); return result; }, {});
  const memberOptions = (members.data ?? []).map(p => ({ value: p.id, label: p.profile.fullName }));
  const ptOptions = (pts.data ?? []).filter(p => p.status === 'ACTIVE').map(p => ({ value: p.id, label: p.profile.fullName }));
  if (editing && !memberOptions.some(item => item.value === editing.memberId)) memberOptions.unshift({ value: editing.memberId, label: editing.memberName ?? 'Member hiện tại' });
  if (editing && !ptOptions.some(item => item.value === editing.ptId)) ptOptions.unshift({ value: editing.ptId, label: editing.ptName ?? 'PT hiện tại' });
  const fields: Field[] = [
    { name: 'memberId', label: 'Member', picker: true, options: memberOptions },
    { name: 'ptId', label: 'PT chính', picker: true, options: ptOptions },
    { name: 'startAt', label: 'Bắt đầu (YYYY-MM-DD HH:mm)' }, { name: 'endAt', label: 'Kết thúc (YYYY-MM-DD HH:mm)' },
  ];
  return <Page title="Lịch tập" subtitle={owner ? 'Mỗi lịch là một buổi cụ thể với PT chính. Hệ thống kiểm tra trùng giờ trước khi lưu.' : 'Lịch do chủ phòng tập quản lý. Liên hệ chủ phòng tập khi cần thay đổi.'}>
    {owner && <Card title="Danh sách để chọn"><Label>Trang Member</Label><Pager page={memberPage} setPage={setMemberPage} more={members.data?.length === 30} /><Label>Trang PT</Label><Pager page={ptPage} setPage={setPtPage} more={pts.data?.length === 30} /></Card>}
    {owner && <Card title={editing ? 'Chỉnh sửa lịch' : 'Tạo lịch tập'}><LoadState state={members} /><LoadState state={pts} /><Form key={editing?.id ?? 'new'} fields={editing ? [...fields.map(f => ({ ...f, defaultValue: f.name === 'memberId' ? editing.memberId : f.name === 'ptId' ? editing.ptId : f.name === 'startAt' ? inputDateTime(editing.startAt) : f.name === 'endAt' ? inputDateTime(editing.endAt) : undefined })), { name: 'reason', label: 'Lý do chỉnh sửa' }] : fields} label={editing ? 'Lưu thay đổi' : 'Tạo booking'} submit={(v, k) => mutation('/bookings' + (editing ? '/' + editing.id : ''), { memberId: v.memberId, ptId: v.ptId, startAt: iso(v.startAt), endAt: iso(v.endAt), ...(editing ? { reason: v.reason } : {}) }, k, editing ? 'patch' : 'post')} onSuccess={() => { setEditing(null); void state.reload(); }} />{editing && <Button secondary label="Đóng chỉnh sửa" onPress={() => setEditing(null)} />}</Card>}
    <LoadState state={state} empty={!state.data?.length} emptyText={owner ? 'Chưa có booking. Dùng form phía trên để tạo buổi tập.' : 'Bạn chưa có lịch tập.'} />{Object.entries(grouped).map(([day, items]) => <Card key={day} title={new Date(day + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}>{items.map(item => <Card key={item.id} title={dateTime(item.startAt)}>
      <Label>Đến {dateTime(item.endAt)}</Label><Badge value={item.status} />
      <Label>{item.memberName ?? 'Member'} · {item.ptName ?? 'PT'}</Label>
      {!!item.cancelReason && <Label muted>Lý do: {item.cancelReason}</Label>}
      {owner && item.status !== 'CANCELLED' && <><Button secondary label="Sửa lịch" onPress={() => { setEditing(item); setCancelling(''); }} /><Button danger label="Hủy lịch" onPress={() => setCancelling(item.id)} /></>}
      {owner && cancelling === item.id && <Form fields={[{ name: 'reason', label: 'Lý do hủy' }]} label="Xác nhận hủy lịch" submit={(v, k) => mutation('/bookings/' + item.id + '/cancel', v, k)} onSuccess={() => { setCancelling(''); void state.reload(); }} />}
    </Card>)}</Card>)}<Pager page={page} setPage={setPage} more={state.data?.length === 30} /><Button secondary label="Làm mới lịch" onPress={() => void state.reload()} />
  </Page>;
}
