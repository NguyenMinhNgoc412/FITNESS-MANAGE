import { PopupRow } from '../components/record-row';
import { View } from 'react-native';
import { ActionLink, Badge, Button, Card, Kpi, Label, LoadState, Page, styles } from '../ui';
import { dateTime } from '../lib/date-time';
import { useLoad } from '../hooks/use-load';
import { Booking, Checkin, Person } from '../models';
import { CheckinQr } from './member-checkin';
export function OwnerHome() {
  const state = useLoad<{ checkins: number; trials: number; alerts: number; trialFinal: number; membershipExpiring: number; bookingsToday: number; ptsToday: number; bookings: Booking[] }>('/dashboard');
  return <Page title="Tổng quan vận hành" subtitle="Theo dõi hoạt động hôm nay và các việc cần xử lý."><LoadState state={state} />{state.data && <>
    <View style={styles.row}><Kpi label="Check-in hôm nay" value={state.data.checkins} /><Kpi label="Trial đang hoạt động" value={state.data.trials} /><Kpi label="Booking hôm nay" value={state.data.bookingsToday} /><Kpi label="PT có lịch" value={state.data.ptsToday} /></View>
    <Card title="Việc cần xử lý"><View style={styles.row}><Kpi label="Trial lượt cuối" value={state.data.trialFinal} /><Kpi label="Member sắp hết gói" value={state.data.membershipExpiring} /><Kpi label="Tổng cảnh báo mở" value={state.data.alerts} /></View><ActionLink href="/owner/alerts">Mở hàng đợi Sales / Cảnh báo →</ActionLink><ActionLink href="/owner/checkins">Mở quầy check-in →</ActionLink><ActionLink href="/owner/customers">Tiếp nhận khách hàng →</ActionLink></Card>
    <Card title="Lịch tập hôm nay">{state.data.bookings.length ? <View>{state.data.bookings.map(b => <PopupRow key={b.id} title={dateTime(b.startAt)} description={(b.memberName ?? 'Member') + ' · ' + (b.ptName ?? 'PT')}><Label>{dateTime(b.startAt)} — {dateTime(b.endAt)}</Label><Label>{b.memberName ?? 'Member'} · {b.ptName ?? 'PT'}</Label><Badge value={b.status} /></PopupRow>)}</View> : <Label muted>Chưa có booking hôm nay.</Label>}<ActionLink href="/owner/bookings">Xem lịch tập</ActionLink></Card>
  </>}</Page>;
}
export function PtHome() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const bookings = useLoad<Booking[]>('/bookings?from=' + encodeURIComponent(start.toISOString()) + '&to=' + encodeURIComponent(new Date(start.getTime() + 86400000).toISOString())), logs = useLoad<Checkin[]>('/pt/me/attendance');
  const today = bookings.data?.filter(b => new Date(b.startAt).toDateString() === new Date().toDateString() && b.status !== 'CANCELLED') ?? [];
  return <Page title="Hôm nay" subtitle="Lịch của bạn và check-in PT độc lập."><Label muted>Đưa QR cho Owner quét tại quầy để xác nhận có mặt tại gym.</Label><CheckinQr endpoint="/pt/me/qr" />
    <Card title="Lịch hôm nay"><LoadState state={bookings} empty={!today.length} emptyText="Hôm nay bạn chưa có lịch. Mở Lịch để xem các ngày khác." /><View>{today.map(b => <PopupRow key={b.id} title={dateTime(b.startAt)} description={(b.memberName ?? 'Member') + ' · ' + (b.ptName ?? 'PT')}><Label>{dateTime(b.startAt)} — {dateTime(b.endAt)}</Label><Label>{b.memberName ?? 'Member'} · {b.ptName ?? 'PT'}</Label><Badge value={b.status} /></PopupRow>)}</View><ActionLink href="/pt/schedule">Xem toàn bộ lịch</ActionLink></Card>
    <Card title="Lịch sử PT check-in"><Button secondary label="Làm mới lịch sử" pending={logs.loading} onPress={() => void logs.reload()} /><LoadState state={logs} empty={!logs.data?.length} emptyText="Bạn chưa có lần check-in nào." /><View>{logs.data?.map(log => <PopupRow key={log.id} title={dateTime(log.checkedInAt)}><Label>PT check-in: {dateTime(log.checkedInAt)}</Label><Label muted>Log PT độc lập với lượt vào tập của Member.</Label></PopupRow>)}</View></Card>
  </Page>;
}
export function PtMembers() {
  const state = useLoad<Person[]>('/pt/me/members');
  return <Page title="Member phụ trách" subtitle="Danh sách Member có assignment đang hoạt động với bạn."><LoadState state={state} empty={!state.data?.length} emptyText="Bạn chưa được Owner gán Member nào." /><View>{state.data?.map(p => <PopupRow title={p.profile.fullName} key={p.id}><Label muted>Liên hệ Owner khi cần thay đổi assignment.</Label></PopupRow>)}</View></Page>;
}
