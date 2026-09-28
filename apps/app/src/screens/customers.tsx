import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { TextInput, useWindowDimensions, View } from 'react-native';
import { z } from 'zod';
import { Badge, Button, Card, Choices, Form, Label, LoadState, Page, Pager, RecordPicker, dateTime, mutation, styles, useLoad } from '../ui';
import { Booking, Customer } from '../models';
import { MemberPackages, packageBody, packageFields } from './packages';
import { colors as c } from '../design-system/theme';
export default function Customers() {
  const params = useLocalSearchParams<{ customerId?: string }>();
  const [query, setQuery] = useState(''), [term, setTerm] = useState(''), [page, setPage] = useState(1), [selected, setSelected] = useState(params.customerId ?? ''), [searchType, setSearchType] = useState('phone'), [receiving, setReceiving] = useState(false);
  const { width } = useWindowDimensions();
  const list = useLoad<Customer[]>('/customers/search?page=' + page + (term ? '&' + searchType + '=' + encodeURIComponent(term) : ''));
  return <Page title="Khách hàng & Trial" subtitle="Tiếp nhận bằng tên và SĐT. Một số điện thoại chỉ được Trial một lần.">
    <View style={[styles.row, { justifyContent: 'space-between' }]}><Label muted>Tìm trước khi tạo để tránh trùng hồ sơ.</Label><Button label={receiving ? 'Đóng tiếp nhận' : '+ Tiếp nhận khách Trial'} secondary={receiving} onPress={() => setReceiving(value => !value)} /></View>
    {receiving && <Card title="Tiếp nhận khách tập thử"><Form fields={[{ name: 'fullName', label: 'Họ tên' }, { name: 'phone', label: 'SĐT', numeric: true }]} schema={z.object({ fullName: z.string().trim().min(1), phone: z.string().min(10) })} label="Tạo Trial 3 lượt" submit={(v, k) => mutation('/customers/trials', v, k)} onSuccess={() => { setReceiving(false); void list.reload(); }} /></Card>}
    <Card title="Tra cứu"><Choices value={searchType} onChange={v => { setSearchType(v); setTerm(''); }} options={[{ value: 'phone', label: 'SĐT' }, { value: 'name', label: 'Tên' }, { value: 'cccd', label: 'CCCD' }]} /><TextInput accessibilityLabel="Từ khóa tra cứu" placeholder="Nhập thông tin cần tìm" placeholderTextColor={c.textMuted} style={styles.input} value={query} onChangeText={setQuery} /><Button label="Tìm khách hàng" onPress={() => { setTerm(query); setPage(1); }} /></Card>
    <View style={{ flexDirection: width >= 900 ? 'row' : 'column', alignItems: 'flex-start', gap: 16 }}>{(width >= 900 || !selected) && <View style={{ flex: 1, width: '100%', gap: 12 }}><LoadState state={list} empty={!list.data?.length} emptyText="Không tìm thấy khách hàng. Kiểm tra từ khóa hoặc tiếp nhận khách Trial mới." /><RecordPicker label="Danh sách khách hàng" value={selected} onChange={setSelected} options={(list.data ?? []).map(item => ({ value: item.id, label: item.fullName, meta: item.phone + ' · ' + (item.status === 'TRIAL' ? 'Trial' : 'Member') }))} /><Pager page={page} setPage={setPage} more={list.data?.length === 30} /></View>}
      {(width >= 900 || selected) && <View style={{ flex: 1.35, width: '100%' }}>{selected ? <CustomerDetail key={selected} id={selected} compact={width < 900} close={() => setSelected('')} changed={() => void list.reload()} /> : <Card title="Hồ sơ khách hàng"><Label muted>Chọn một khách hàng trong danh sách để xem hồ sơ và thao tác.</Label></Card>}</View>}</View>
  </Page>;
}
function CustomerDetail({ id, compact, close, changed }: { id: string; compact: boolean; close: () => void; changed: () => void }) {
  const state = useLoad<Customer>('/customers/' + id);
  const [section, setSection] = useState('profile');
  const refresh = () => { void state.reload(); changed(); };
  const customer = state.data;
  const memberId = customer?.memberUserId;
  const assignments = useLoad<{ id: string; ptName: string; status: string; reason: string; startAt: string; endAt?: string }[]>(memberId ? '/members/' + memberId + '/pt-assignment/history' : null);
  const bookings = useLoad<Booking[]>(memberId ? '/bookings?memberId=' + memberId : null);
  return <Card title={customer?.fullName ?? 'Hồ sơ khách hàng'}>{compact && <Button secondary label="← Danh sách khách hàng" onPress={close} />}<LoadState state={state} />{customer && <><View style={styles.row}><Label>{customer.phone}</Label><Badge value={customer.status} /></View><Choices value={section} onChange={setSection} options={[{ value: 'profile', label: 'Hồ sơ' }, { value: 'membership', label: 'Gói tập' }, { value: 'assignment', label: 'PT' }, { value: 'booking', label: 'Booking' }, { value: 'checkin', label: 'Check-in' }, { value: 'trial', label: 'Trial' }, { value: 'history', label: 'Nhật ký' }]} />
    {section === 'profile' && <Card title="Thông tin chính"><Label>Họ tên: {customer.fullName}</Label><Label>SĐT: {customer.phone}</Label><Label>Phân loại: {customer.status === 'TRIAL' ? 'Khách Trial' : 'Member'}</Label>{customer.status === 'TRIAL' && <Card title="Chuyển thành Member"><Form fields={[{ name: 'cccd', label: 'CCCD', numeric: true }, { name: 'password', label: 'Mật khẩu cấp cho Member (ít nhất 10 ký tự)', secret: true }, ...packageFields]} label="Tạo Member và kích hoạt gói" submit={(v, k) => mutation('/customers/' + id + '/convert-to-member', { cccd: v.cccd, password: v.password, membership: packageBody(v) }, k)} onSuccess={refresh} /></Card>}</Card>}
    {section === 'membership' && (memberId ? <MemberPackages memberId={memberId} /> : <Label muted>Khách Trial chưa có gói Member.</Label>)}
    {section === 'assignment' && <><LoadState state={assignments} empty={!assignments.data?.length} emptyText="Member chưa có lịch sử PT assignment." />{assignments.data?.map(item => <Card key={item.id} title={item.ptName}><Badge value={item.status} /><Label muted>{dateTime(item.startAt)}{item.endAt ? ' → ' + dateTime(item.endAt) : ' → hiện tại'}</Label><Label>{item.reason}</Label></Card>)}</>}
    {section === 'booking' && <><LoadState state={bookings} empty={!bookings.data?.length} emptyText="Member chưa có booking." />{bookings.data?.map(item => <Card key={item.id} title={dateTime(item.startAt)}><Badge value={item.status} /><Label>{item.ptName ?? 'PT nội bộ'} · đến {dateTime(item.endAt)}</Label></Card>)}</>}
    {section === 'checkin' && <><LoadState state={{ ...state, loading: false }} empty={!customer.checkins?.length} emptyText="Chưa có lịch sử vào tập." />{customer.checkins?.map(log => <Label key={log.id}>{dateTime(log.checkedInAt)} · {log.context === 'SELF_TRAINING' ? 'Tự tập' : log.context === 'WITH_INTERNAL_PT' ? 'PT nội bộ' : log.context === 'WITH_EXTERNAL_PT' ? 'PT ngoài' : 'Trial'}</Label>)}</>}
    {section === 'trial' && (customer.trial ? <Card title="Trial 3 lượt"><Label>Đã dùng {customer.trial.usedSessions}/3 lượt</Label><Badge value={customer.trial.status} />{customer.status === 'TRIAL' && <Form fields={[]} label="Check-in Trial" submit={(_, k) => mutation('/customers/' + id + '/trial-checkin', {}, k)} onSuccess={refresh} />}</Card> : <Label muted>Hồ sơ không có Trial.</Label>)}
    {section === 'history' && <Card title="Lịch sử thay đổi"><Label muted>Các thay đổi hồ sơ, gói, PT và booking được giữ trong Audit Log.</Label><Label muted>Mở Logs / Báo cáo để đối chiếu đầy đủ theo mã hồ sơ.</Label></Card>}
  </>}</Card>;
}
