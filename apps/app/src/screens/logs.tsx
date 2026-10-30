import { View } from 'react-native';
import { PopupRow } from '../components/record-row';
import { useState } from 'react';
import { Badge, Choices, Label, LoadState, Page, Pager } from '../ui';
import { dateTime } from '../lib/date-time';
import { useLoad } from '../hooks/use-load';
import { MonthlyCheckins } from './statistics';
export default function Logs() {
  const [kind, setKind] = useState('checkins'), [page, setPage] = useState(1);
  const state = useLoad<{ id: string; checkedInAt?: string; createdAt?: string; context?: string; action?: string; reason?: string; actorId?: string; memberId?: string; ptId?: string }[]>('/' + kind + '?page=' + page);
  return <Page title="Logs & Báo cáo" subtitle="Thống kê check-in theo tháng và đối chiếu các log độc lập.">
    <MonthlyCheckins />
    <Choices value={kind} onChange={v => { setKind(v); setPage(1); }} options={[{ value: 'checkins', label: 'Member / Trial' }, { value: 'pt/attendance', label: 'PT attendance' }, { value: 'audit', label: 'Audit' }]} />
    <LoadState state={state} empty={!state.data?.length} /><View>{state.data?.map(item => <PopupRow key={kind + ':' + item.id} title={dateTime(item.checkedInAt ?? item.createdAt!)} trailing={<Badge value={item.context ?? item.action ?? 'PT check-in'} />}><Badge value={item.context ?? item.action ?? 'PT check-in'} /><Label muted>Mã đối chiếu: {item.memberId ?? item.ptId ?? item.actorId ?? item.id}</Label>{item.reason ? <Label>{item.reason}</Label> : null}</PopupRow>)}</View><Pager page={page} setPage={setPage} more={state.data?.length === 30} />
  </Page>;
}
