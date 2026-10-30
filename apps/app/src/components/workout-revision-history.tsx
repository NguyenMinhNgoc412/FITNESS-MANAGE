import { View } from 'react-native';
import { PopupRow } from './record-row';
import { useState } from 'react';
import { Badge, Card, Label, LoadState, Pager } from '../ui';
import { useLoad } from '../hooks/use-load';
import { Collection, Revision, revisionActionLabel } from '../features/workouts';

export function RevisionHistory({ base }: { base: string }) {
  const [page, setPage] = useState(1);
  const state = useLoad<Collection<Revision>>(base + '/revisions?page=' + page);
  return <Card title="Lịch sử phiên bản"><LoadState state={state} /><View>{!state.loading && state.data?.items.map(r => <PopupRow key={r.id} title={'Phiên bản ' + r.version} description={revisionActionLabel(r.action) + ' · ' + new Date(r.recordedAt).toLocaleString('vi-VN')} trailing={<Badge value={r.snapshot.status} />}><Label>{revisionActionLabel(r.action)} · {new Date(r.recordedAt).toLocaleString('vi-VN')}</Label><Badge value={r.snapshot.status} />{'workoutDate' in r.snapshot ? <><Label>{r.snapshot.workoutDate} · {r.snapshot.title || 'Buổi tập'}</Label><Label>{r.snapshot.note}</Label>{r.snapshot.exercises.map(e => <Label key={e.id}>{e.displayName}: {e.sets.map(s => `${s.reps ?? 'chưa ghi'} lần / ${s.weightKg === null ? 'chưa ghi tạ' : s.weightKg + ' kg'}`).join('; ')}</Label>)}</> : <Label>{r.snapshot.measurementDate}: {r.snapshot.weightKg ?? 'chưa đo'} kg · {r.snapshot.heightCm ?? 'chưa đo'} cm</Label>}</PopupRow>)}</View><Pager page={page} setPage={setPage} more={page * 20 < (state.data?.total ?? 0)} /></Card>;
}
