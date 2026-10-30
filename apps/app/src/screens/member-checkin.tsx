import { PopupRow } from '../components/record-row';
import { useEffect, useMemo, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { Button, Card, Label, LoadState, Page } from '../ui';
import { dateTime } from '../lib/date-time';
import { useLoad } from '../hooks/use-load';
import { qrMatrix } from '../qr';
import { Checkin } from '../models';
export function CheckinQr({ endpoint }: { endpoint: string }) {
  const state = useLoad<{ token: string; expiresIn: number }>(endpoint);
  const [expiresAt, setExpires] = useState(0), [remaining, setRemaining] = useState(0), { width } = useWindowDimensions();
  const matrix = useMemo(() => state.data ? qrMatrix(state.data.token) : null, [state.data]);
  const scale = Math.max(3, Math.min(6, Math.floor((width - 80) / ((matrix?.length ?? 57) + 8))));
  useEffect(() => { if (state.data) setExpires(Date.now() + state.data.expiresIn * 1000); }, [state.data]);
  useEffect(() => { const update = () => setRemaining(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))); update(); const timer = setInterval(update, 1000); return () => clearInterval(timer); }, [expiresAt]);
  useEffect(() => { if (!expiresAt) return; const timer = setTimeout(() => void state.reload(), Math.max(0, expiresAt - Date.now() - 15000)); return () => clearTimeout(timer); }, [expiresAt, state.reload]);
  return <Card title="QR của bạn"><LoadState state={state} />{matrix && remaining > 0 ? <View accessible accessibilityLabel="Mã QR check-in có thời hạn" style={{ alignSelf: 'center', backgroundColor: 'white', padding: scale * 4 }}>{matrix.map((row, y) => <View key={y} style={{ flexDirection: 'row' }}>{row.map((dark, x) => <View key={x} style={{ width: scale, height: scale, backgroundColor: dark ? '#000000' : '#FFFFFF' }} />)}</View>)}</View> : <Label muted>Mã đã hết hạn hoặc chưa được cấp. Nhấn làm mới để lấy mã.</Label>}
      <Text style={{ textAlign: 'center' }}>Còn {remaining} giây</Text><Button label="Làm mới QR" pending={state.loading} onPress={() => void state.reload()} /></Card>;
}
export default function MemberCheckin() {
  const logs = useLoad<Checkin[]>('/members/me/checkins');
  return <Page title="Mã check-in" subtitle="Đưa QR cho chủ phòng tập. Quyền vào tập được kiểm tra tại quầy.">
    <CheckinQr endpoint="/members/me/qr" />
    <Card title="Lịch sử vào tập"><LoadState state={logs} empty={!logs.data?.length} /><View>{logs.data?.map(log => <PopupRow key={log.id} title={dateTime(log.checkedInAt)} description={log.context === 'SELF_TRAINING' ? 'Tự tập' : log.context === 'WITH_INTERNAL_PT' ? 'PT nội bộ' : 'PT ngoài'}><Label>{dateTime(log.checkedInAt)}</Label><Label>{log.context === 'SELF_TRAINING' ? 'Tự tập' : log.context === 'WITH_INTERNAL_PT' ? 'PT nội bộ' : 'PT ngoài'}</Label></PopupRow>)}</View></Card>
  </Page>;
}
