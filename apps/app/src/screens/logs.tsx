import { useState } from 'react';
import { Badge, Card, Choices, Label, LoadState, Page, Pager, dateTime, useLoad } from '../ui';
export default function Logs() {
  const [kind, setKind] = useState('checkins'), [page, setPage] = useState(1);
  const state = useLoad<{ id: string; checkedInAt?: string; createdAt?: string; context?: string; action?: string; reason?: string; actorId?: string; memberId?: string; ptId?: string }[]>('/' + kind + '?page=' + page);
  return <Page title="Logs & đối chiếu" subtitle="Xem booking và các log riêng để đối chiếu thủ công.">
    <Choices value={kind} onChange={v => { setKind(v); setPage(1); }} options={[{ value: 'checkins', label: 'Member / Trial' }, { value: 'pt/attendance', label: 'PT attendance' }, { value: 'audit', label: 'Audit' }]} />
    <LoadState state={state} empty={!state.data?.length} />{state.data?.map(item => <Card key={item.id}><Label>{dateTime(item.checkedInAt ?? item.createdAt!)}</Label><Badge value={item.context ?? item.action ?? 'PT check-in'} /><Label muted>Mã đối chiếu: {item.memberId ?? item.ptId ?? item.actorId ?? item.id}</Label>{item.reason && <Label>{item.reason}</Label>}</Card>)}<Pager page={page} setPage={setPage} more={state.data?.length === 30} />
  </Page>;
}
