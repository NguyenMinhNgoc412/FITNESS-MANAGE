import { PopupRow } from '../components/record-row';
import { DetailModal } from '../components/detail-modal';
import { ActivityCard as Card, ActivityMetric } from '../components/activity-visuals';
import { useState } from 'react';
import { View } from 'react-native';
import { Choices, Label, LoadState, RecordPicker, styles } from '../ui';
import { useLoad } from '../hooks/use-load';
import { initialRange, MeasurementProgress, MeasurementSeries, WorkoutProgress } from '../features/workouts';
import { ActivityFilters, RangeFilter, ValueChart } from '../components/workout-controls';

function MeasurementsChart({ title, series }: { title: string; series: MeasurementSeries }) {
  return <PopupRow title={title} description={series.latest ? series.latest.value + ' ' + series.unit + ' · ' + series.latest.date : 'Chưa có dữ liệu'}><Label muted>{series.comparison ? `Thay đổi ${series.comparison.delta > 0 ? '+' : ''}${series.comparison.delta} ${series.unit}, từ ${series.comparison.firstDate} đến ${series.comparison.lastDate}` : 'Chưa đủ dữ liệu so sánh.'}</Label><ValueChart title={title} unit={series.unit} points={series.points} /></PopupRow>;
}
function LatestMeasurement({ title, series }: { title: string; series: MeasurementSeries }) {
  return <ActivityMetric label={title} value={series.latest ? `${series.latest.value} ${series.unit}` : 'Chưa ghi'} hint={series.latest ? `Đo ngày ${series.latest.date} trong khoảng đã chọn.` : 'Chưa có số đo trong khoảng đã chọn.'} />;
}
export function ProgressScreen() {
  const [seriesOpen, setSeriesOpen] = useState(false);
  const [range, setRange] = useState(initialRange), [groupBy, setGroupBy] = useState('week'), [groupKey, setGroupKey] = useState('');
  const query = new URLSearchParams(range).toString();
  const workouts = useLoad<WorkoutProgress>('/members/me/workout-progress?' + query + '&groupBy=' + groupBy), measurements = useLoad<MeasurementProgress>('/members/me/body-measurement-progress?' + query);
  const series = workouts.data?.series.find(s => s.groupKey === groupKey);
  const period = range.from === initialRange().from && range.to === initialRange().to ? '30 ngày gần nhất' : range.from + ' → ' + range.to;
  return <>
    <Card kind="progress" title="Tiến bộ của bạn"><ActivityFilters summary={period + ' · ' + (groupBy === 'week' ? 'Theo tuần' : 'Theo tháng')}><RangeFilter onChange={(from, to) => { setRange({ from, to }); setGroupKey(''); }} /><Choices value={groupBy} onChange={setGroupBy} options={[{ value: 'week', label: 'Theo tuần' }, { value: 'month', label: 'Theo tháng' }]} /></ActivityFilters><Label muted>Chỉ số do bạn tự ghi, không dùng để đánh giá sức khỏe hoặc kỹ thuật tập.</Label></Card>
    <LoadState state={workouts} />
    {!workouts.loading && workouts.data && <ActivityMetric label="Buổi đã ghi nhật ký" value={workouts.data.totalSessions} hint="Chỉ buổi hoàn tất chưa lưu trữ; không phải lượt đến gym." />}
    <LoadState state={measurements} />
    {!measurements.loading && measurements.data && <View style={styles.row}><LatestMeasurement title="Cân nặng cơ thể gần nhất" series={measurements.data.weight} /><LatestMeasurement title="Chiều cao gần nhất" series={measurements.data.height} /></View>}
    {!workouts.loading && workouts.data && <>
      <PopupRow title="Tần suất ghi buổi tập" description={workouts.data.totalSessions + ' buổi hoàn tất trong khoảng đã chọn'}><ValueChart title="Số buổi" unit="buổi" points={workouts.data.buckets.map(b => ({ date: b.date, value: b.count }))} /></PopupRow>
      <Card title="Theo dõi từng bài"><RecordPicker label="Bài đã ghi" placeholder="Nhập tên bài tập" value={groupKey} options={workouts.data.series.map(s => ({ value: s.groupKey, label: s.label, meta: s.groupKey.startsWith('catalog:') ? 'Bài mẫu' : 'Bài tự nhập' }))} onChange={value => { setGroupKey(value); setSeriesOpen(true); }} />{series && seriesOpen ? <DetailModal title={series.label} onClose={() => setSeriesOpen(false)}><ValueChart title="Tổng số lần mỗi ngày" unit="lần" points={series.points.map(p => ({ date: p.date, value: p.reps }))} /><ValueChart title="Mức tạ cao nhất mỗi ngày" unit="kg" points={series.points.filter(p => p.maxWeightKg !== null).map(p => ({ date: p.date, value: p.maxWeightKg! }))} /></DetailModal> : <Label muted>Chọn một bài hoặc ghi buổi hoàn tất để xem.</Label>}</Card>
    </>}
    {!measurements.loading && measurements.data && <><MeasurementsChart title="Cân nặng cơ thể" series={measurements.data.weight} /><MeasurementsChart title="Chiều cao" series={measurements.data.height} /></>}
  </>;
}
