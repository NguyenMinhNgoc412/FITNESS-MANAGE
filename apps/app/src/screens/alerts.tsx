import { View } from 'react-native';
import { PopupRow } from '../components/record-row';
import { useState } from 'react';
import { Link } from 'expo-router';
import { Badge, Card, Choices, Label, LoadState, Page, Pager } from '../ui';
import { Form } from '../components/form';
import { dateTime } from '../lib/date-time';
import { mutation } from '../lib/http';
import { useLoad } from '../hooks/use-load';
export default function Alerts() {
  const [page, setPage] = useState(1), [status, setStatus] = useState('OPEN');
  const state = useLoad<{ id: string; type: string; status: string; triggeredAt: string; ownerNote?: string; customerName: string; customerId?: string }[]>('/sales-alerts?page=' + page + '&status=' + status);
  return <Page title="Sales & Cảnh báo" subtitle="Trial lượt cuối, gói còn 7 ngày hoặc 3 lượt.">
    <Card title="Lọc trạng thái"><Choices value={status} onChange={value => { setStatus(value); setPage(1); }} options={[{ value: 'OPEN', label: 'Chưa xử lý' }, { value: 'CONTACTED', label: 'Đã liên hệ' }, { value: 'CONVERTED_RENEWED', label: 'Đã mua / gia hạn' }, { value: 'CLOSED_NOT_CONTINUING', label: 'Không tiếp tục' }, { value: 'ALL', label: 'Tất cả' }]} /></Card>
    <LoadState state={state} empty={!state.data?.length} emptyText="Không có cảnh báo ở trạng thái đã chọn. Chọn trạng thái khác để xem lịch sử chăm sóc." />
    <View>{state.data?.map(item => <PopupRow key={item.id} title={item.customerName} description={dateTime(item.triggeredAt)} trailing={<Badge value={item.status} />}><Badge value={item.type} /><Badge value={item.status} /><Label muted>{dateTime(item.triggeredAt)}</Label>{!!item.customerId && <Link href={{ pathname: '/owner/customers', params: { customerId: item.customerId } }}>Mở hồ sơ khách hàng</Link>}<Form fields={[{ name: 'status', label: 'Trạng thái chăm sóc', defaultValue: item.status, options: [{ value: 'OPEN', label: 'Chưa xử lý' }, { value: 'CONTACTED', label: 'Đã liên hệ' }, { value: 'CONVERTED_RENEWED', label: 'Đã mua / gia hạn' }, { value: 'CLOSED_NOT_CONTINUING', label: 'Không tiếp tục' }] }, { name: 'ownerNote', label: 'Ghi chú', defaultValue: item.ownerNote }]} submit={(v, k) => mutation('/sales-alerts/' + item.id, v, k, 'patch')} onSuccess={() => void state.reload()} /></PopupRow>)}</View>
    <Pager page={page} setPage={setPage} more={state.data?.length === 30} />
  </Page>;
}
