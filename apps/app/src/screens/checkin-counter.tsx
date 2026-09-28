import { useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Text, TextInput, View } from 'react-native';
import { api } from '../api';
import { Booking, Customer, ExternalRequest, Membership, Pass } from '../models';
import { Badge, Button, Card, Choices, Form, Label, LoadState, Page, dateTime, errorMessage, mutation, styles, useLoad } from '../ui';
import { colors as c } from '../design-system/theme';
export default function Counter() {
  const [phone, setPhone] = useState(''), [phoneInput, setPhoneInput] = useState(''), [member, setMember] = useState<{ id: string; name: string } | null>(null), [token, setToken] = useState(''), [scanning, setScanning] = useState(false), [scanError, setScanError] = useState(''), [showPending, setShowPending] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const customer = useLoad<Customer[]>(phone ? '/customers/search?phone=' + encodeURIComponent(phone) : null);
  const [context, setContext] = useState('SELF_TRAINING');
  const current = member ?? (customer.data?.[0]?.memberUserId ? { id: customer.data[0].memberUserId, name: customer.data[0].fullName } : null);
  const packages = useLoad<Membership[]>(current ? '/members/' + current.id + '/memberships' : null), passes = useLoad<Pass[]>(current ? '/members/' + current.id + '/external-pt-passes' : null);
  const bookings = useLoad<Booking[]>(current ? '/bookings' : null), requests = useLoad<ExternalRequest[]>('/external-pt/requests');
  const resolve = async (data: string) => {
    setScanning(false); setScanError('');
    try { const response = await api.post('/checkins/resolve-qr', { token: data }); setToken(data); setPhone(''); setMember({ id: response.data.member.id, name: response.data.member.profile.fullName }); }
    catch (e) { setScanError(errorMessage(e)); }
  };
  return <Page title="Quầy check-in" subtitle="Quét QR của Member hoặc tra cứu SĐT tại quầy.">
    <Card title="Quét QR"><Button secondary label="Mở máy quét" onPress={() => { void (async () => { const p = permission?.granted ? permission : await requestPermission(); if (p.granted) setScanning(true); else setScanError('Chưa có quyền camera. Bạn có thể dùng SĐT để tra cứu.'); })(); }} />
      {scanning && <><CameraView style={{ height: 260 }} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => { void resolve(data); }} /><Button secondary label="Đóng camera" onPress={() => setScanning(false)} /></>}
      {scanError ? <Text style={styles.error}>{scanError}</Text> : null}
    </Card><Card title="Tra cứu bằng SĐT"><Label muted>Dùng khi Member không mở được QR.</Label><TextInput accessibilityLabel="Số điện thoại" keyboardType="phone-pad" placeholder="Nhập số điện thoại" placeholderTextColor={c.textMuted} style={styles.input} value={phoneInput} onChangeText={setPhoneInput} /><Button label="Tra cứu" onPress={() => { setMember(null); setToken(''); setPhone(phoneInput.trim()); }} /></Card><LoadState state={customer} empty={!!phone && !customer.data?.length} emptyText="Không tìm thấy khách hàng với số điện thoại này." />
    {customer.data?.[0]?.status === 'TRIAL' && <Card title={customer.data[0].fullName}><Badge value="TRIAL" /><Form fields={[]} label="Check-in Trial" submit={(_, k) => mutation('/customers/' + customer.data![0].id + '/trial-checkin', {}, k)} onSuccess={() => void customer.reload()} /></Card>}
    {current && <Card title={'Xác nhận cho ' + current.name}><View style={[styles.row, { justifyContent: 'space-between' }]}><Badge value={token ? 'QR' : 'PHONE'} /><Label muted>{token ? 'Đã xác thực bằng QR' : 'Đã tra cứu bằng SĐT'}</Label></View><LoadState state={packages} /><Label>Hình thức tập</Label><Choices value={context} onChange={setContext} options={[{ value: 'SELF_TRAINING', label: 'Tự tập' }, { value: 'WITH_INTERNAL_PT', label: 'PT nội bộ' }, { value: 'WITH_EXTERNAL_PT', label: 'PT ngoài' }]} />
      {context !== 'WITH_EXTERNAL_PT' ? <Form key={current.id + context + token} fields={[{ name: 'membershipId', label: 'Gói đang dùng', options: (packages.data ?? []).filter(p => p.effectiveStatus === 'ACTIVE').map(p => ({ value: p.id, label: p.name + (p.remainingSessions != null ? ' · ' + p.remainingSessions + ' lượt' : '') })) }, ...(context === 'WITH_INTERNAL_PT' ? [{ name: 'bookingId', label: 'Booking', options: (bookings.data ?? []).filter(b => b.memberId === current.id && b.status !== 'CANCELLED').map(b => ({ value: b.id, label: dateTime(b.startAt) })) }] : [])]} label="Xác nhận vào tập" submit={(v, k) => mutation('/checkins/member', { ...v, memberId: current.id, context, method: token ? 'QR' : 'PHONE', ...(token ? { qrToken: token } : {}) }, k)} onSuccess={() => void packages.reload()} /> : <>
        <Label muted>Tra cứu SĐT Member để bắt đầu xác nhận PT ngoài.</Label><LoadState state={passes} /><Form key={current.id + ':external'} fields={[{ name: 'phone', label: 'SĐT Member', defaultValue: phone }, { name: 'membershipId', label: 'Gói tập', options: (packages.data ?? []).filter(p => p.effectiveStatus === 'ACTIVE').map(p => ({ value: p.id, label: p.name })) }, { name: 'passId', label: 'External PT Pass', options: (passes.data ?? []).filter(p => p.status === 'ACTIVE').map(p => ({ value: p.id, label: 'Còn ' + (p.totalUses - p.usedUses) + ' lượt' })) }]} label="Gửi yêu cầu xác nhận" submit={(v, k) => mutation('/external-pt/checkin/initiate', v, k)} onSuccess={() => void requests.reload()} />
      </>}
    </Card>}
    <Card title="Yêu cầu PT ngoài đang chờ"><View style={[styles.row, { justifyContent: 'space-between' }]}><Label>{requests.data?.length ?? 0} yêu cầu</Label><Button secondary label={showPending ? 'Thu gọn' : 'Xem yêu cầu'} onPress={() => setShowPending(value => !value)} /></View>{showPending && <><LoadState state={requests} empty={!requests.data?.length} emptyText="Không có yêu cầu PT ngoài đang chờ." />{requests.data?.filter(r => !current || r.memberId === current.id).map(r => <Card key={r.id}><Label>{dateTime(r.createdAt)}</Label><Label muted>Chỉ dùng khi push không đến và Member đã xác nhận trực tiếp tại quầy.</Label><Form fields={[{ name: 'reason', label: 'Lý do push không khả dụng và xác nhận tại quầy' }, { name: 'confirmation', label: 'Xác nhận trực tiếp', options: [{ value: 'yes', label: 'Member đã đồng ý tại quầy; push không khả dụng' }] }]} label="Owner xác nhận thay thế" submit={(v, k) => {
      if (v.confirmation !== 'yes') throw { response: { data: { message: 'Cần xác nhận trực tiếp trước khi trừ pass.' } } };
      return mutation('/external-pt/checkin/' + r.id + '/owner-fallback-confirm', { reason: v.reason, confirmedAtCounter: true, pushUnavailable: true }, k);
    }} onSuccess={() => { void requests.reload(); void packages.reload(); }} /></Card>)}<Button secondary label="Làm mới" onPress={() => void requests.reload()} /></>}</Card>
  </Page>;
}
