import { useState } from 'react';
import { Link } from 'expo-router';
import { Badge, Card, Form, Label, LoadState, Page, Pager, dateTime, mutation, useLoad } from '../ui';
export default function Alerts() {
  const [page, setPage] = useState(1), state = useLoad<{ id: string; type: string; status: string; triggeredAt: string; ownerNote?: string; customerName: string; customerId?: string }[]>('/sales-alerts?page=' + page);
  return <Page title="Sales & Cảnh báo" subtitle="Trial lượt cuối, gói còn 7 ngày hoặc 3 lượt."><LoadState state={state} empty={!state.data?.length} />
    {state.data?.map(item => <Card key={item.id} title={item.customerName}><Badge value={item.type} /><Badge value={item.status} /><Label muted>{dateTime(item.triggeredAt)}</Label>{!!item.customerId && <Link href={{ pathname: '/owner/customers', params: { customerId: item.customerId } }}>Mở hồ sơ khách hàng</Link>}<Form fields={[{ name: 'status', label: 'Trạng thái chăm sóc', defaultValue: item.status, options: [{ value: 'OPEN', label: 'Chưa xử lý' }, { value: 'CONTACTED', label: 'Đã liên hệ' }, { value: 'CONVERTED_RENEWED', label: 'Đã mua / gia hạn' }, { value: 'CLOSED_NOT_CONTINUING', label: 'Không tiếp tục' }] }, { name: 'ownerNote', label: 'Ghi chú', defaultValue: item.ownerNote }]} submit={(v, k) => mutation('/sales-alerts/' + item.id, v, k, 'patch')} onSuccess={() => void state.reload()} /></Card>)}
    <Pager page={page} setPage={setPage} more={state.data?.length === 30} />
  </Page>;
}
