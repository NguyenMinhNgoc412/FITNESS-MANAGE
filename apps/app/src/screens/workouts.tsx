import { useRef, useState } from 'react';
import { Page } from '../ui';
import { ScrollViewInstance } from 'react-native';
import { ActivityHeader, ActivityNavigation } from '../components/activity-visuals';
import { useAuthStore } from '../store/auth';
import { WorkoutJournal } from './workout-journal';
import { BodyMeasurements } from './body-measurements';
import { ExerciseLibrary } from './exercise-library';
import { ProgressScreen } from './workout-progress';
import { CatalogDetail } from '../features/workouts';
import { ActivityBusy, ActivityScroll, confirmAction } from '../components/workout-controls';

export default function Workouts() {
  const memberId = useAuthStore(s => s.session?.user.id);
  return memberId ? <Activity key={memberId} /> : null;
}
function Activity() {
  const scroll = useRef<ScrollViewInstance>(null);
  const [tab, setTab] = useState('journal'), [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<CatalogDetail | null>(null);
  return <ActivityBusy.Provider value={setBusy}><ActivityScroll.Provider value={scroll}><Page scrollRef={scroll} title="Hoạt động tập luyện" header={<ActivityHeader />}><ActivityNavigation value={tab} disabled={busy} onChange={value => { void (async () => { if (value === tab) return; if (!dirty || await confirmAction('Có nội dung chưa lưu. Chuyển mục và bỏ phần này?')) { setDirty(false); setPicked(null); setTab(value); } })(); }} />{tab === 'journal' ? <WorkoutJournal setDirty={setDirty} initialCatalog={picked} /> : tab === 'measurements' ? <BodyMeasurements setDirty={setDirty} /> : tab === 'library' ? <ExerciseLibrary onSelect={c => { setPicked(c); setTab('journal'); }} /> : <ProgressScreen />}</Page></ActivityScroll.Provider></ActivityBusy.Provider>;
}
