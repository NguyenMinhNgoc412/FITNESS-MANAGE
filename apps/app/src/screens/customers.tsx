import { PopupRow, RecordRow } from '../components/record-row';
import { DetailModal } from '../components/detail-modal';
import { useDetailLocked } from '../components/detail-state';
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Text, TextInput, View } from 'react-native';
import { z } from 'zod';
import { Badge, Button, Card, Choices, Label, LoadState, Page, Pager, styles } from '../ui';
import { Form } from '../components/form';
import { dateTime } from '../lib/date-time';
import { mutation } from '../lib/http';
import { useLoad } from '../hooks/use-load';
import { Booking, Checkin, Customer } from '../models';
import { MemberPackageSummary, MemberPackages, PackagePresetPicker, packageBody, packageFieldsFor } from './packages';
import { colors as c, spacing } from '../design-system/theme';
import { conversionBody } from '../features/conversion-input';
const auditLabels: Record<string, string> = {
  TRIAL_CREATE: 'Tạo khách Trial', TRIAL_PHONE_CHECKIN: 'Check-in Trial', TRIAL_CONVERT: 'Chuyển thành Member',
  PROFILE_CREATE: 'Tạo hồ sơ Member', PROFILE_UPDATE: 'Cập nhật hồ sơ', PT_ASSIGN: 'Gán PT', PT_CANCEL: 'Hủy PT',
  MEMBERSHIP_CREATE: 'Kích hoạt gói', MEMBERSHIP_RENEW: 'Gia hạn gói', MEMBERSHIP_CANCEL: 'Hủy gói',
  BOOKING_CREATE: 'Tạo lịch tập', BOOKING_EDIT: 'Sửa lịch tập', BOOKING_CANCEL: 'Hủy lịch tập',
  MEMBER_PHONE_CHECKIN: 'Check-in bằng SĐT', MEMBER_QR_CHECKIN: 'Check-in bằng QR',
  EXTERNAL_PASS_CREATE: 'Tạo PT Pass', EXTERNAL_PT_CONFIRM: 'Xác nhận PT ngoài', EXTERNAL_PT_FALLBACK: 'Owner xác nhận tại quầy', ALERT_UPDATE: 'Cập nhật cảnh báo',
};
export default function Customers() {
  const params = useLocalSearchParams<{ customerId?: string }>();
  const [query, setQuery] = useState(''), [term, setTerm] = useState(''), [page, setPage] = useState(1), [selected, setSelected] = useState(params.customerId ?? ''), [searchType, setSearchType] = useState('phone'), [receiving, setReceiving] = useState(false);
  useEffect(() => { if (params.customerId) setSelected(params.customerId); }, [params.customerId]);
  const list = useLoad<Customer[]>('/customers/search?page=' + page + (term ? '&' + searchType + '=' + encodeURIComponent(term) : ''));
  return <Page title="Khách hàng & Trial" subtitle="Tiếp nhận bằng tên và SĐT. Một số điện thoại chỉ được Trial một lần.">
    <View style={[styles.row, { justifyContent: 'space-between' }]}><Label muted>Tìm trước khi tạo để tránh trùng hồ sơ.</Label><Button label={receiving ? 'Đóng tiếp nhận' : '+ Tiếp nhận khách Trial'} secondary={receiving} onPress={() => setReceiving(value => !value)} /></View>
    {receiving && <Card title="Tiếp nhận khách tập thử"><Form fields={[{ name: 'fullName', label: 'Họ tên' }, { name: 'phone', label: 'SĐT', numeric: true }]} schema={z.object({ fullName: z.string().trim().min(1), phone: z.string().min(10) })} label="Tạo Trial 3 lượt" submit={(v, k) => mutation('/customers/trials', v, k)} onSuccess={() => { setReceiving(false); void list.reload(); }} /></Card>}
    <Card title="Tra cứu"><Choices value={searchType} onChange={v => { setSearchType(v); setTerm(''); }} options={[{ value: 'phone', label: 'SĐT' }, { value: 'name', label: 'Tên' }, { value: 'cccd', label: 'CCCD' }]} /><TextInput accessibilityLabel="Từ khóa tra cứu" placeholder="Nhập thông tin cần tìm" placeholderTextColor={c.textMuted} style={styles.input} value={query} onChangeText={setQuery} /><Button label="Tìm khách hàng" onPress={() => { setTerm(query); setPage(1); }} /></Card>
    <LoadState state={list} empty={!list.data?.length} emptyText="Không tìm thấy khách hàng. Kiểm tra từ khóa hoặc tiếp nhận khách Trial mới." />
    <View>{!list.loading && !list.error && list.data?.map(item => <RecordRow key={item.id} title={item.fullName} description={item.phone} trailing={<Badge value={item.status} />} onPress={() => setSelected(item.id)} />)}</View>
    <Pager page={page} setPage={setPage} more={list.data?.length === 30} />
    {selected && <DetailModal title="Hồ sơ khách hàng" onClose={() => setSelected('')}><CustomerDetail key={selected} id={selected} compact close={() => setSelected('')} changed={() => void list.reload()} /></DetailModal>}
  </Page>;
}
function OfficialMemberProfile({ member }: { member: Customer['member'] }) {
  const statuses: Record<string, string> = { ACTIVE: 'Đang hoạt động', INACTIVE: 'Ngừng hoạt động', LOCKED: 'Đã khóa' };
  return <View style={{ gap: spacing.sm }}><Text style={styles.heading}>Thông tin Member chính thức</Text>{member ? <>
    <Label>Họ tên chính thức: {member.profile?.fullName ?? 'Chưa cập nhật'}</Label>
    <Label>CCCD: {member.profile?.cccd ?? 'Chưa cập nhật'}</Label>
    <Label>Trạng thái tài khoản: {statuses[member.status] ?? 'Chưa xác định'}</Label>
  </> : <Label muted>Không tìm thấy thông tin Member liên kết.</Label>}</View>;
}
function CustomerDetail({ id, compact, close, changed }: { id: string; compact: boolean; close: () => void; changed: () => void }) {
  const state = useLoad<Customer>('/customers/' + id), locked = useDetailLocked();
  const [section, setSection] = useState('profile');
  const [historyPage, setHistoryPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1), [checkinPage, setCheckinPage] = useState(1);
  const [presetId, setPresetId] = useState('');
  const refresh = () => { void state.reload(); changed(); };
  const customer = state.data;
  const memberId = customer?.memberUserId;
  const assignments = useLoad<{ id: string; ptName: string; status: string; reason: string; startAt: string; endAt?: string }[]>(memberId ? '/members/' + memberId + '/pt-assignment/history' : null);
  const bookings = useLoad<Booking[]>(section === 'booking' && memberId ? '/bookings?memberId=' + memberId + '&page=' + bookingPage : null);
  const checkins = useLoad<Checkin[]>(section === 'checkin' ? '/customers/' + id + '/checkins?page=' + checkinPage : null);
  const history = useLoad<{ id: string; action: string; reason?: string; createdAt: string; actorName: string }[]>(section === 'history' ? '/customers/' + id + '/history?page=' + historyPage : null);
  return <View style={{ gap: spacing.md }}><Text style={styles.heading}>{customer?.fullName ?? 'Hồ sơ khách hàng'}</Text>{compact && <Button secondary label="← Danh sách khách hàng" disabled={locked} onPress={close} />}<LoadState state={state} />{customer && <><View style={styles.row}><Label>{customer.phone}</Label><Badge value={customer.status} /></View><Choices disabled={locked} value={section} onChange={setSection} options={[{ value: 'profile', label: 'Hồ sơ' }, { value: 'membership', label: 'Gói tập' }, { value: 'assignment', label: 'PT' }, { value: 'booking', label: 'Booking' }, { value: 'checkin', label: 'Check-in' }, { value: 'trial', label: 'Trial' }, { value: 'history', label: 'Nhật ký' }]} />
    {section === 'profile' && <Card title="Thông tin chính"><Label>Họ tên: {customer.fullName}</Label><Label>SĐT: {customer.phone}</Label><Label>Phân loại: {customer.status === 'TRIAL' ? 'Khách Trial' : 'Member'}</Label>{memberId ? <><OfficialMemberProfile member={customer.member} /><MemberPackageSummary key={memberId} memberId={memberId} /></> : null}{customer.status === 'TRIAL' && <Card title="Chuyển thành Member"><Form revision={presetId} preserveFields={['cccd', 'password']} beforeFields={pending => <PackagePresetPicker value={presetId} onChange={setPresetId} disabled={pending} />} fields={[{ name: 'cccd', label: 'CCCD', numeric: true }, { name: 'password', label: 'Mật khẩu cấp cho Member (ít nhất 10 ký tự)', secret: true }, ...packageFieldsFor(presetId)]} label="Tạo Member và kích hoạt gói" submit={(v, k) => mutation('/customers/' + id + '/convert-to-member', conversionBody(v, () => packageBody(v, presetId)), k)} onSuccess={refresh} /></Card>}</Card>}
    {section === 'membership' && (memberId ? <MemberPackages memberId={memberId} /> : <Label muted>Khách Trial chưa có gói Member.</Label>)}
    {section === 'assignment' && <><LoadState state={assignments} empty={!assignments.data?.length} emptyText="Member chưa có lịch sử PT assignment." /><View>{assignments.data?.map(item => <PopupRow key={item.id} title={item.ptName} description={dateTime(item.startAt)} trailing={<Badge value={item.status} />}><Badge value={item.status} /><Label muted>{dateTime(item.startAt)}{item.endAt ? ' → ' + dateTime(item.endAt) : ' → hiện tại'}</Label><Label>{item.reason}</Label></PopupRow>)}</View></>}
    {section === 'booking' && <View testID="customer-bookings"><LoadState state={bookings} empty={!bookings.data?.length} emptyText="Không có booking ở trang này. Xem trang trước hoặc kiểm tra mục Lịch tập." /><View>{!bookings.loading && !bookings.error && bookings.data?.map(item => <PopupRow key={item.id} title={dateTime(item.startAt)} description={item.ptName ?? 'PT nội bộ'} trailing={<Badge value={item.status} />}><Badge value={item.status} /><Label>{item.ptName ?? 'PT nội bộ'} · đến {dateTime(item.endAt)}</Label></PopupRow>)}</View>{memberId && <Pager page={bookingPage} setPage={setBookingPage} more={!bookings.loading && !bookings.error && bookings.data?.length === 30} />}</View>}
    {section === 'checkin' && <View testID="customer-checkins"><LoadState state={checkins} empty={!checkins.data?.length} emptyText="Không có lượt vào tập ở trang này. Xem trang trước hoặc đối chiếu tại quầy." /><View>{!checkins.loading && !checkins.error && checkins.data?.map(log => <PopupRow key={log.id} title={dateTime(log.checkedInAt)} trailing={<Badge value={log.context ?? 'TRIAL'} />}><Label>{dateTime(log.checkedInAt)}</Label><Badge value={log.context ?? 'TRIAL'} /></PopupRow>)}</View><Pager page={checkinPage} setPage={setCheckinPage} more={!checkins.loading && !checkins.error && checkins.data?.length === 30} /></View>}
    {section === 'trial' && (customer.trial ? <Card title="Trial 3 lượt"><Label>Đã dùng {customer.trial.usedSessions}/3 lượt</Label><Badge value={customer.trial.status} />{customer.status === 'TRIAL' && <Form fields={[]} label="Check-in Trial" submit={(_, k) => mutation('/customers/' + id + '/trial-checkin', {}, k)} onSuccess={refresh} />}</Card> : <Label muted>Hồ sơ không có Trial.</Label>)}
    {section === 'history' && <Card title="Nhật ký hồ sơ"><LoadState state={history} empty={!history.data?.length} emptyText="Hồ sơ chưa có thao tác được ghi nhận." /><View>{history.data?.map(item => <PopupRow key={item.id} title={auditLabels[item.action] ?? item.action} description={dateTime(item.createdAt)}><Label muted>{dateTime(item.createdAt)} · {item.actorName}</Label>{!!item.reason && <Label>Lý do: {item.reason}</Label>}</PopupRow>)}</View><Pager page={historyPage} setPage={setHistoryPage} more={history.data?.length === 30} /></Card>}
  </>}</View>;
}
