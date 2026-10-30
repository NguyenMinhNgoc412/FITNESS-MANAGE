import { PopupRow } from '../components/record-row';
import { useRef, useState } from 'react';
import { CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera';
import { ActivityIndicator, Platform, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { api } from '../api';
import { Booking, Customer, ExternalRequest, Membership, Pass } from '../models';
import { Badge, Button, Card, Choices, Label, LoadState, Page, styles } from '../ui';
import { Form } from '../components/form';
import { dateTime } from '../lib/date-time';
import { errorMessage, mutation } from '../lib/http';
import { useLoad } from '../hooks/use-load';
import { colors as c } from '../design-system/theme';
import { memberCheckinBody } from '../features/checkin-input';
export default function Counter() {
  const [phone, setPhone] = useState(''), [phoneInput, setPhoneInput] = useState(''), [member, setMember] = useState<{ id: string; name: string } | null>(null), [token, setToken] = useState(''), [scanning, setScanning] = useState(false), [scanError, setScanError] = useState(''), [showPending, setShowPending] = useState(false);
  const [resolving, setResolving] = useState(false), [checkingFrame, setCheckingFrame] = useState(false), [cameraReady, setCameraReady] = useState(false), [scanSuccess, setScanSuccess] = useState('');
  const [pt, setPt] = useState<{ id: string; name: string } | null>(null);
  const scanLocked = useRef(false);
  const camera = useRef<CameraView>(null);
  const { width } = useWindowDimensions();
  const scanFrame = Math.min(260, width - 96);
  const [permission, requestPermission] = useCameraPermissions();
  const customer = useLoad<Customer[]>(phone ? '/customers/search?phone=' + encodeURIComponent(phone) : null);
  const [context, setContext] = useState('SELF_TRAINING');
  const current = pt || resolving ? null : member ?? (phone && customer.data?.[0]?.memberUserId ? { id: customer.data[0].memberUserId, name: customer.data[0].fullName } : null);
  const packages = useLoad<Membership[]>(current ? '/members/' + current.id + '/memberships' : null), passes = useLoad<Pass[]>(current ? '/members/' + current.id + '/external-pt-passes' : null);
  const bookings = useLoad<Booking[]>(current ? '/bookings?memberId=' + current.id : null), requests = useLoad<ExternalRequest[]>('/external-pt/requests');
  const availableBookings = (bookings.data ?? []).filter(b => b.memberId === current?.id && b.status !== 'CANCELLED');
  const bookingUnavailable = bookings.loading || !!bookings.error || !availableBookings.length;
  const resolve = async (data: string) => {
    if (scanLocked.current) return;
    scanLocked.current = true; setResolving(true); setScanError(''); setScanSuccess('');
    setMember(null); setPt(null); setToken(''); setPhone('');
    try {
      const response = await api.post('/checkins/resolve-qr', { token: data });
      if (response.data.pt) {
        setPt({ id: response.data.pt.id, name: response.data.pt.profile.fullName }); setToken(data);
        setScanSuccess('Đã xác thực QR PT. Xác nhận có mặt bên dưới.'); setScanning(false); return;
      }
      const name = response.data.member.profile.fullName;
      setToken(data); setPhone(''); setMember({ id: response.data.member.id, name });
      setScanSuccess('Đã quét và xác thực QR của ' + name + '. Chọn hình thức tập rồi xác nhận vào tập bên dưới.');
      setScanning(false);
    } catch (e) { setScanError(errorMessage(e) + ' Hãy làm mới QR trên máy Member/PT rồi mở camera để quét lại.'); setScanning(false); }
    finally { scanLocked.current = false; setResolving(false); }
  };
  const checkFrame = async () => {
    if (scanLocked.current || checkingFrame) return;
    setCheckingFrame(true); setScanError('');
    try {
      const photo = await camera.current?.takePictureAsync();
      if (!photo?.uri) throw new Error('Camera chưa có hình để kiểm tra.');
      const results = await scanFromURLAsync(photo.uri, ['qr']);
      if (results[0]?.data) await resolve(results[0].data);
      else setScanError('Camera đã chụp được hình nhưng chưa đọc được QR. Đưa điện thoại cách webcam khoảng 30–50 cm, giữ mã lớn và nét trong khung, tránh phản chiếu ánh sáng rồi thử lại.');
    } catch { setScanError('Không kiểm tra được bộ giải mã QR trên trình duyệt này. Hãy thử Chrome/Edge mới nhất hoặc dùng SĐT để tra cứu.'); }
    finally { setCheckingFrame(false); }
  };
  return <Page title="Quầy check-in" subtitle="Quét QR của Member/PT hoặc tra cứu SĐT tại quầy.">
    <Card title="Quét QR"><Button secondary label={scanning ? 'Camera đang mở' : 'Mở máy quét'} disabled={scanning} onPress={() => { void (async () => { setScanError(''); setScanSuccess(''); setCameraReady(false); const p = permission?.granted ? permission : await requestPermission(); if (p.granted) setScanning(true); else setScanError('Chưa có quyền camera. Bạn có thể dùng SĐT để tra cứu.'); })(); }} />
      {scanning ? <>
        <View style={{ height: 360, minHeight: 320, overflow: 'hidden', borderRadius: 12, backgroundColor: '#17212F' }}>
          <CameraView ref={camera} style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onCameraReady={() => setCameraReady(true)} onMountError={() => { setScanning(false); setScanError('Không mở được camera. Kiểm tra quyền camera trong trình duyệt hoặc dùng SĐT để tra cứu.'); }} onBarcodeScanned={resolving ? undefined : ({ data }) => { void resolve(data); }} />
          <View style={{ pointerEvents: 'none', position: 'absolute', alignSelf: 'center', top: 38, width: scanFrame, height: scanFrame, borderWidth: 3, borderColor: c.onPrimary, borderRadius: 16 }} />
          <View style={{ pointerEvents: 'none', position: 'absolute', bottom: 12, alignSelf: 'center', backgroundColor: c.text, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}><Text style={{ color: c.onPrimary, textAlign: 'center' }}>Đưa toàn bộ mã QR vào giữa khung</Text></View>
        </View>
        {resolving ? <View style={styles.row}><ActivityIndicator color={c.primary} /><Label>Đã nhận QR, đang xác thực...</Label></View> : <Label muted>{cameraReady ? 'Camera sẵn sàng. ' : 'Đang mở camera. '}Giữ điện thoại Member/PT cách webcam khoảng 30–50 cm, tăng sáng màn hình nếu khó quét. Mã QR tự làm mới trước khi hết hạn.</Label>}
        {Platform.OS === 'web' ? <Button secondary label="Kiểm tra QR trong khung hình" pending={checkingFrame} disabled={!cameraReady || resolving} onPress={() => void checkFrame()} /> : null}
        <Button secondary label="Đóng camera" onPress={() => setScanning(false)} />
      </> : null}
      {scanError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{scanError}</Text> : null}
      {scanSuccess ? <Text accessibilityLiveRegion="polite" style={styles.success}>{scanSuccess}</Text> : null}
    </Card><Card title="Tra cứu bằng SĐT"><Label muted>Dùng khi Member không mở được QR.</Label><TextInput accessibilityLabel="Số điện thoại" keyboardType="phone-pad" placeholder="Nhập số điện thoại" placeholderTextColor={c.textMuted} style={styles.input} value={phoneInput} onChangeText={setPhoneInput} /><Button label="Tra cứu" onPress={() => { setMember(null); setPt(null); setToken(''); setScanSuccess(''); setPhone(phoneInput.trim()); }} /></Card><LoadState state={customer} empty={!!phone && !customer.data?.length} emptyText="Không tìm thấy khách hàng với số điện thoại này." />
    {pt && <Card title={'Xác nhận PT: ' + pt.name}><Label>Ghi nhận PT có mặt tại gym, độc lập với check-in Member.</Label><Form key={token} fields={[]} label="Xác nhận PT có mặt" submit={(_, k) => mutation('/checkins/pt', { token }, k)} onSuccess={() => { setPt(null); setToken(''); setScanSuccess('Đã ghi nhận PT có mặt tại gym.'); }} /></Card>}
    {phone && !pt && !resolving && customer.data?.[0]?.status === 'TRIAL' && <Card title={customer.data[0].fullName}><Badge value="TRIAL" /><Form fields={[]} label="Check-in Trial" submit={(_, k) => mutation('/customers/' + customer.data![0].id + '/trial-checkin', {}, k)} onSuccess={() => void customer.reload()} /></Card>}
    {current && <Card title={'Xác nhận cho ' + current.name}><View style={[styles.row, { justifyContent: 'space-between' }]}><Badge value={token ? 'QR' : 'PHONE'} /><Label muted>{token ? 'Đã xác thực bằng QR' : 'Đã tra cứu bằng SĐT'}</Label></View><LoadState state={packages} /><Label>Hình thức tập</Label><Choices value={context} onChange={setContext} options={[{ value: 'SELF_TRAINING', label: 'Tự tập' }, { value: 'WITH_INTERNAL_PT', label: 'PT nội bộ' }, { value: 'WITH_EXTERNAL_PT', label: 'PT ngoài' }]} />
      {context === 'WITH_INTERNAL_PT' && <LoadState state={bookings} empty={!availableBookings.length} emptyText="Member chưa có booking PT nội bộ phù hợp. Tạo hoặc kiểm tra lịch trong mục Lịch tập trước khi xác nhận." />}
      {context !== 'WITH_EXTERNAL_PT' ? <Form key={current.id + context + token} disabled={context === 'WITH_INTERNAL_PT' && bookingUnavailable} fields={[{ name: 'membershipId', label: 'Gói đang dùng', options: (packages.data ?? []).filter(p => p.effectiveStatus === 'ACTIVE').map(p => ({ value: p.id, label: p.name + (p.remainingSessions != null ? ' · ' + p.remainingSessions + ' lượt' : '') })) }, ...(context === 'WITH_INTERNAL_PT' ? [{ name: 'bookingId', label: 'Booking', options: availableBookings.map(b => ({ value: b.id, label: dateTime(b.startAt) })) }] : [])]} label="Xác nhận vào tập" submit={(v, k) => mutation('/checkins/member', memberCheckinBody(v, current.id, context, token), k)} onSuccess={() => void packages.reload()} /> : <>
        <Label muted>Tra cứu SĐT Member để bắt đầu xác nhận PT ngoài.</Label><LoadState state={passes} /><Form key={current.id + ':external'} fields={[{ name: 'phone', label: 'SĐT Member', defaultValue: phone }, { name: 'membershipId', label: 'Gói tập', options: (packages.data ?? []).filter(p => p.effectiveStatus === 'ACTIVE').map(p => ({ value: p.id, label: p.name })) }, { name: 'passId', label: 'External PT Pass', options: (passes.data ?? []).filter(p => p.status === 'ACTIVE').map(p => ({ value: p.id, label: 'Còn ' + (p.totalUses - p.usedUses) + ' lượt' })) }]} label="Gửi yêu cầu xác nhận" submit={(v, k) => mutation('/external-pt/checkin/initiate', v, k)} onSuccess={() => void requests.reload()} />
      </>}
    </Card>}
    <Card title="Yêu cầu PT ngoài đang chờ"><View style={[styles.row, { justifyContent: 'space-between' }]}><Label>{requests.data?.length ?? 0} yêu cầu</Label><Button secondary label={showPending ? 'Thu gọn' : 'Xem yêu cầu'} onPress={() => setShowPending(value => !value)} /></View>{showPending && <><LoadState state={requests} empty={!requests.data?.length} emptyText="Không có yêu cầu PT ngoài đang chờ." /><View>{requests.data?.filter(r => !current || r.memberId === current.id).map(r => <PopupRow key={r.id} title={dateTime(r.createdAt)} description="Yêu cầu PT ngoài"><Label>{dateTime(r.createdAt)}</Label><Label muted>Chỉ dùng khi push không đến và Member đã xác nhận trực tiếp tại quầy.</Label><Form fields={[{ name: 'reason', label: 'Lý do push không khả dụng và xác nhận tại quầy' }, { name: 'confirmation', label: 'Xác nhận trực tiếp', options: [{ value: 'yes', label: 'Member đã đồng ý tại quầy; push không khả dụng' }] }]} label="Owner xác nhận thay thế" submit={(v, k) => {
      if (v.confirmation !== 'yes') throw { response: { data: { message: 'Cần xác nhận trực tiếp trước khi trừ pass.' } } };
      return mutation('/external-pt/checkin/' + r.id + '/owner-fallback-confirm', { reason: v.reason, confirmedAtCounter: true, pushUnavailable: true }, k);
    }} onSuccess={() => { void requests.reload(); void packages.reload(); }} /></PopupRow>)}</View><Button secondary label="Làm mới" onPress={() => void requests.reload()} /></>}</Card>
  </Page>;
}
