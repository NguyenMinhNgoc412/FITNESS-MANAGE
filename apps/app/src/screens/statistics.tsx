import { useState } from 'react';
import { Button, Card, Choices, Label, LoadState } from '../ui';
import { useLoad } from '../hooks/use-load';

export function PackageStatistics() {
  const state = useLoad<{ name: string; mode: string; memberCount: number; registrations: number }[]>('/reports/packages');
  return <Card title="Số người đăng ký theo gói">
    <Label muted>Toàn bộ lịch sử, gồm gói hết hạn và đã hủy. Mỗi Member chỉ tính một lần cho cùng tên và loại gói; gia hạn vẫn tính vào số lần cấp.</Label>
    <LoadState state={state} empty={!state.data?.length} emptyText="Chưa có gói được cấp để thống kê." />
    <Button secondary label="Làm mới thống kê gói" pending={state.loading} onPress={() => void state.reload()} />
    {!state.loading && !state.error && state.data?.map(item => <Card key={JSON.stringify([item.name, item.mode])} title={item.name}>
      <Label muted>{item.mode === 'TIME_BASED' ? 'Theo thời gian' : 'Theo số lượt'}</Label>
      <Label>{item.memberCount} người đăng ký · {item.registrations} lần cấp/gia hạn</Label>
    </Card>)}
  </Card>;
}

export function MonthlyCheckins() {
  const currentYear = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date()));
  const [year, setYear] = useState(currentYear);
  const state = useLoad<{ months: { month: number; member: number; trial: number; total: number; pt: number }[] }>('/reports/checkins?year=' + year);
  return <Card title="Lượt check-in theo tháng">
    <Choices value={String(year)} onChange={value => setYear(Number(value))} options={[
      ...(year > 1900 ? [{ value: String(year - 1), label: '← ' + (year - 1) }] : []),
      { value: String(year), label: 'Năm ' + year },
      ...(year < 2199 ? [{ value: String(year + 1), label: (year + 1) + ' →' }] : []),
    ]} />
    <Label muted>Tính theo UTC+7. Tổng lượt vào tập gồm Member và Trial; PT attendance thống kê riêng, không kết luận attendance theo booking.</Label>
    <LoadState state={state} />
    <Button secondary label="Làm mới báo cáo check-in" pending={state.loading} onPress={() => void state.reload()} />
    {!state.loading && !state.error && state.data?.months.map(item => <Card key={item.month} title={'Tháng ' + item.month + '/' + year}>
      <Label>{item.total} lượt vào tập · Member: {item.member} · Trial: {item.trial}</Label>
      <Label muted>PT attendance: {item.pt} lượt</Label>
    </Card>)}
  </Card>;
}
