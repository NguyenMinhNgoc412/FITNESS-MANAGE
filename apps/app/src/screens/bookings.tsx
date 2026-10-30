import { PopupRow } from '../components/record-row';
import { DetailModal } from '../components/detail-modal';
import { useRef, useState } from 'react';
import { ScrollViewInstance, Text, View } from 'react-native';
import { spacing } from '../design-system/theme';
import { useAuthStore } from '../store/auth';
import { Badge, Button, Card, Label, LoadState, Page, Pager, styles } from '../ui';
import { Field, Form } from '../components/form';
import { dateTime, iso } from '../lib/date-time';
import { mutation } from '../lib/http';
import { useLoad } from '../hooks/use-load';
import { Booking, Person } from '../models';
const inputDateTime = (value: string) => {
  const date = new Date(value);
  const two = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())} ${two(date.getHours())}:${two(date.getMinutes())}`;
};
export default function Bookings() {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const owner = useAuthStore(s => s.session?.user.role === 'OWNER'), [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false), [busy, setBusy] = useState(false);
  const [memberPage, setMemberPage] = useState(1), [ptPage, setPtPage] = useState(1);
  const state = useLoad<Booking[]>('/bookings?page=' + page), members = useLoad<Person[]>(owner && formOpen ? '/people?role=MEMBER&page=' + memberPage : null), pts = useLoad<Person[]>(owner && formOpen ? '/people?role=PT&page=' + ptPage : null);
  const [editing, setEditing] = useState<Booking | null>(null), [cancelling, setCancelling] = useState('');
  const grouped = (state.data ?? []).reduce<Record<string, Booking[]>>((result, item) => { const key = new Date(item.startAt).toLocaleDateString('en-CA'); (result[key] ??= []).push(item); return result; }, {});
  const memberOptions = (members.data ?? []).map(p => ({ value: p.id, label: p.profile.fullName }));
  const ptOptions = (pts.data ?? []).filter(p => p.status === 'ACTIVE').map(p => ({ value: p.id, label: p.profile.fullName }));
  if (editing && !memberOptions.some(item => item.value === editing.memberId)) memberOptions.unshift({ value: editing.memberId, label: editing.memberName ?? 'Member hiện tại' });
  if (editing && !ptOptions.some(item => item.value === editing.ptId)) ptOptions.unshift({ value: editing.ptId, label: editing.ptName ?? 'PT hiện tại' });
  const fields: Field[] = [
    { name: 'memberId', label: 'Member', picker: true, options: memberOptions },
    { name: 'ptId', label: 'PT chính', picker: true, options: ptOptions },
    { name: 'startAt', label: 'Ngày giờ bắt đầu', dateTime: true }, { name: 'endAt', label: 'Ngày giờ kết thúc', dateTime: true },
  ];
  return <Page scrollRef={scrollRef} title="Lịch tập" subtitle={owner ? 'Mỗi lịch là một buổi cụ thể với PT chính. Hệ thống kiểm tra trùng giờ trước khi lưu.' : 'Lịch do chủ phòng tập quản lý. Liên hệ chủ phòng tập khi cần thay đổi.'}>
    {owner && <Button label="Tạo lịch tập" expanded={formOpen} disabled={busy} onPress={() => { setEditing(null); setCancelling(''); setFormOpen(!formOpen); }} />}
    {owner && formOpen && <DetailModal title={editing ? 'Chỉnh sửa lịch' : 'Tạo lịch tập'} busy={busy} onClose={() => { setEditing(null); setFormOpen(false); }}><Card title="Danh sách để chọn"><Label>Trang Member</Label><Pager page={memberPage} setPage={n => { if (!busy) setMemberPage(n); }} more={members.data?.length === 30} /><Label>Trang PT</Label><Pager page={ptPage} setPage={n => { if (!busy) setPtPage(n); }} more={pts.data?.length === 30} /></Card><Card title={editing ? 'Chỉnh sửa lịch' : 'Tạo lịch tập'}><LoadState state={members} /><LoadState state={pts} /><Form key={editing?.id ?? 'new'} fields={editing ? [...fields.map(f => ({ ...f, defaultValue: f.name === 'memberId' ? editing.memberId : f.name === 'ptId' ? editing.ptId : f.name === 'startAt' ? inputDateTime(editing.startAt) : f.name === 'endAt' ? inputDateTime(editing.endAt) : undefined })), { name: 'reason', label: 'Lý do chỉnh sửa' }] : fields} label={editing ? 'Lưu thay đổi' : 'Tạo booking'} submit={async (v, k) => { setBusy(true); try { return await mutation('/bookings' + (editing ? '/' + editing.id : ''), { memberId: v.memberId, ptId: v.ptId, startAt: iso(v.startAt), endAt: iso(v.endAt), ...(editing ? { reason: v.reason } : {}) }, k, editing ? 'patch' : 'post'); } finally { setBusy(false); } }} onSuccess={() => { setEditing(null); setFormOpen(false); void state.reload(); }} /><Button secondary label="Đóng biểu mẫu" disabled={busy} onPress={() => { setEditing(null); setFormOpen(false); }} /></Card></DetailModal>}
    <LoadState state={state} empty={!state.data?.length} emptyText={owner ? 'Chưa có lịch. Chọn Tạo lịch tập để thêm buổi mới.' : 'Bạn chưa có lịch tập.'} />
    {Object.entries(grouped).map(([day, items]) => <View key={day} style={{ gap: spacing.sm }}>
      <Text style={styles.heading}>{new Date(day + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })} · {items.length} buổi</Text>
      <View>{items.map(item => <PopupRow key={item.id} testID="booking-row" title={dateTime(item.startAt)} description={(item.memberName ?? 'Member') + ' · ' + (item.ptName ?? 'PT')} trailing={<Badge value={item.status} />} busy={busy}>
        <Label>{dateTime(item.startAt)} – {dateTime(item.endAt)}</Label><Label>{item.memberName ?? 'Member'} · {item.ptName ?? 'PT'}</Label><Badge value={item.status} />
        {!!item.cancelReason && <Label muted>Lý do: {item.cancelReason}</Label>}
        {owner && item.status !== 'CANCELLED' && <View style={styles.row}><Button secondary label="Sửa lịch" disabled={busy} onPress={() => { setEditing(item); setFormOpen(true); setCancelling(''); }} /><Button danger label="Hủy lịch" disabled={busy} onPress={() => setCancelling(item.id)} /></View>}
        {owner && cancelling === item.id && <View style={{ gap: spacing.sm }}><Form danger fields={[{ name: 'reason', label: 'Lý do hủy' }]} label="Xác nhận hủy lịch" submit={async (v, k) => { setBusy(true); try { return await mutation('/bookings/' + item.id + '/cancel', v, k); } finally { setBusy(false); } }} onSuccess={() => { setCancelling(''); void state.reload(); }} /><Button secondary label="Giữ lịch" disabled={busy} onPress={() => setCancelling('')} /></View>}
      </PopupRow>)}</View>
    </View>)}
    <Pager page={page} setPage={n => { if (!busy) setPage(n); }} more={state.data?.length === 30} />
    <Button secondary label="Làm mới lịch" disabled={busy} onPress={() => void state.reload()} />
  </Page>;
}
