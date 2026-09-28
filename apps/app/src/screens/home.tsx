import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Badge, Card, Form, Kpi, Label, LoadState, Page, dateTime, mutation, styles, useLoad } from '../ui';
import { useAuthStore } from '../store/auth';
import { Booking, Checkin, ExternalRequest, Membership, Pass, Person } from '../models';
import { PackageCard } from './packages';
export function OwnerHome() {
  const state = useLoad<{ checkins: number; trials: number; alerts: number; trialFinal: number; membershipExpiring: number; bookingsToday: number; ptsToday: number; bookings: Booking[] }>('/dashboard');
  return <Page title="Tổng quan vận hành" subtitle="Theo dõi hoạt động hôm nay và các việc cần xử lý."><LoadState state={state} />{state.data && <>
    <View style={styles.row}><Kpi label="Check-in hôm nay" value={state.data.checkins} /><Kpi label="Trial đang hoạt động" value={state.data.trials} /><Kpi label="Booking hôm nay" value={state.data.bookingsToday} /><Kpi label="PT có lịch" value={state.data.ptsToday} /></View>
    <Card title="Việc cần xử lý"><View style={styles.row}><Kpi label="Trial lượt cuối" value={state.data.trialFinal} /><Kpi label="Member sắp hết gói" value={state.data.membershipExpiring} /><Kpi label="Tổng cảnh báo mở" value={state.data.alerts} /></View><Link href="/owner/alerts">Mở hàng đợi Sales / Cảnh báo →</Link><Link href="/owner/checkins">Mở quầy check-in →</Link><Link href="/owner/customers">Tiếp nhận khách hàng →</Link></Card>
    <Card title="Lịch tập hôm nay">{state.data.bookings.length ? state.data.bookings.map(b => <Label key={b.id}>{dateTime(b.startAt)} — {dateTime(b.endAt)}</Label>) : <Label muted>Chưa có booking hôm nay.</Label>}<Link href="/owner/bookings">Xem lịch tập</Link></Card>
  </>}</Page>;
}
export function PtHome() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const bookings = useLoad<Booking[]>('/bookings?from=' + encodeURIComponent(start.toISOString()) + '&to=' + encodeURIComponent(new Date(start.getTime() + 86400000).toISOString())), logs = useLoad<Checkin[]>('/pt/me/attendance');
  const today = bookings.data?.filter(b => new Date(b.startAt).toDateString() === new Date().toDateString() && b.status !== 'CANCELLED') ?? [];
  return <Page title="Hôm nay" subtitle="Lịch của bạn và check-in PT độc lập."><Card title="PT check-in"><Form fields={[]} label="Xác nhận có mặt tại gym" submit={(_, k) => mutation('/pt/me/checkin', {}, k)} onSuccess={() => void logs.reload()} /></Card>
    <Card title="Lịch hôm nay"><LoadState state={bookings} empty={!today.length} emptyText="Hôm nay bạn chưa có lịch. Mở Lịch để xem các ngày khác." />{today.map(b => <Label key={b.id}>{dateTime(b.startAt)} — {dateTime(b.endAt)}</Label>)}<Link href="/pt/schedule">Xem toàn bộ lịch</Link></Card>
    <Card title="Lịch sử PT check-in"><LoadState state={logs} empty={!logs.data?.length} emptyText="Bạn chưa có lần check-in nào." />{logs.data?.map(log => <Label key={log.id}>{dateTime(log.checkedInAt)}</Label>)}</Card>
  </Page>;
}
export function PtMembers() {
  const state = useLoad<Person[]>('/pt/me/members');
  return <Page title="Member phụ trách" subtitle="Danh sách Member có assignment đang hoạt động với bạn."><LoadState state={state} empty={!state.data?.length} emptyText="Bạn chưa được Owner gán Member nào." />{state.data?.map(p => <Card title={p.profile.fullName} key={p.id}><Label muted>Liên hệ Owner khi cần thay đổi assignment.</Label></Card>)}</Page>;
}
export function MemberHome() {
  const memberId = useAuthStore(s => s.session!.user.id), packages = useLoad<Membership[]>('/members/' + memberId + '/memberships');
  const [from] = useState(() => new Date().toISOString());
  const bookings = useLoad<Booking[]>('/bookings?from=' + encodeURIComponent(from));
  const pt = useLoad<{ pt: { profile: { fullName: string } } } | null>('/members/me/pt'), passes = useLoad<Pass[]>('/members/me/external-pt-passes'), requests = useLoad<ExternalRequest[]>('/external-pt/requests');
  const next = bookings.data?.filter(b => b.status !== 'CANCELLED' && new Date(b.startAt) >= new Date()).sort((a, b) => a.startAt.localeCompare(b.startAt))[0];
  return <Page title="Chào bạn" subtitle="Gói tập, lịch hẹn và hoạt động của bạn tại phòng tập.">
    <Card title="Sẵn sàng cho buổi tập?"><Link href="/member/checkin">Mở mã QR check-in →</Link></Card>
    <LoadState state={packages} empty={!packages.data?.length} emptyText="Bạn chưa có gói tập đang được ghi nhận. Liên hệ Owner để kiểm tra." />{packages.data?.map(item => <PackageCard key={item.id} item={item} />)}
    <Card title="Buổi tập tiếp theo"><LoadState state={bookings} />{!bookings.loading && !bookings.error && (next ? <Label>{dateTime(next.startAt)} — {dateTime(next.endAt)}</Label> : <Label muted>Chưa có buổi tập sắp tới.</Label>)}<Link href="/member/schedule">Xem lịch tập</Link></Card>
    <Card title="PT chính"><LoadState state={pt} />{!pt.loading && !pt.error && <Label>{pt.data?.pt?.profile.fullName ?? 'Bạn chưa có PT nội bộ.'}</Label>}</Card>
    <Card title="External PT Pass"><LoadState state={passes} empty={!passes.data?.length} emptyText="Bạn chưa có External PT Pass." />{passes.data?.map(p => <Card key={p.id}><Badge value={p.status} /><Label>Còn {p.totalUses - p.usedUses} / {p.totalUses} lượt</Label></Card>)}
      <LoadState state={requests} />{requests.data?.map(r => <Card key={r.id} title="Yêu cầu dùng PT ngoài"><Label>{dateTime(r.createdAt)}</Label><Label muted>Chỉ xác nhận nếu bạn đang dùng PT ngoài và đồng ý trừ một lượt pass cùng quyền vào tập.</Label><Form fields={[]} label="Đồng ý dùng pass" submit={(_, k) => mutation('/external-pt/checkin/' + r.id + '/confirm', {}, k)} onSuccess={() => { void requests.reload(); void passes.reload(); void packages.reload(); }} /></Card>)}
    </Card><Card title="AI kiểm tra form"><Label muted>Video lưu trên thiết bị của bạn. Bắt đầu bằng bài squat.</Label><Link href="/member/ai">Kiểm tra form →</Link></Card>
  </Page>;
}
