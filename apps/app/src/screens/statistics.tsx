import { PopupRow, RecordRow } from '../components/record-row';
import { DetailModal } from '../components/detail-modal';
import { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { spacing } from '../design-system/theme';
import { Button, Choices, Label, LoadState, styles } from '../ui';
import { useLoad } from '../hooks/use-load';

type PackageMode = 'SESSION_BASED' | 'TIME_BASED';
type PackageStatistic = { name: string; mode: PackageMode; memberCount: number; registrations: number };
const packageGroups: { mode: PackageMode; label: string; shortLabel: string }[] = [
  { mode: 'SESSION_BASED', label: 'Theo số buổi', shortLabel: 'Số buổi' },
  { mode: 'TIME_BASED', label: 'Theo thời gian', shortLabel: 'Thời gian' },
];
const packagesPerPage = 3;
export function PackageStatistics() {
  const state = useLoad<PackageStatistic[]>('/reports/packages'), { width } = useWindowDimensions();
  const [detail, setDetail] = useState<PackageStatistic | null>(null);
  const [mode, setMode] = useState('SESSION_BASED'), [pages, setPages] = useState<Record<PackageMode, number>>({ SESSION_BASED: 1, TIME_BASED: 1 });
  const groups = packageGroups.map(group => ({ ...group, items: (state.data ?? []).filter(item => item.mode === group.mode) })).filter(group => group.items.length);
  const selected = groups.find(group => group.mode === mode)?.mode ?? groups[0]?.mode;
  const wide = width >= 1100;
  return <View testID="package-statistics" style={{ gap: spacing.md }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}><Text accessibilityRole="header" style={[styles.heading, { flex: 1 }]}>Thống kê gói tập</Text><Button secondary label="Làm mới" pending={state.loading} onPress={() => void state.reload()} /></View>
    <Label muted>Toàn lịch sử, gồm gói hết hạn/hủy. Mỗi người đếm một lần theo cùng tên và loại gói; gia hạn tăng số lần cấp.</Label>
    <LoadState state={state} empty={!state.data?.length} emptyText="Chưa có gói được cấp để thống kê." />
    {!state.loading && !state.error && <>
      {!wide && groups.length > 1 && <Choices value={selected ?? ''} onChange={setMode} options={groups.map(group => ({ value: group.mode, label: group.shortLabel }))} />}
      <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: 'flex-start', gap: spacing.md }}>
        {groups.filter(group => wide || group.mode === selected).map(group => <PackageStatisticsGroup onSelect={setDetail} wide={wide} key={group.mode} label={group.label} mode={group.mode} items={group.items} page={pages[group.mode]} setPage={page => setPages(old => ({ ...old, [group.mode]: page }))} />)}
      </View>
    </>}
    {detail && <DetailModal title={detail.name} onClose={() => setDetail(null)}><Label>{detail.mode === 'TIME_BASED' ? 'Theo thời gian' : 'Theo số buổi'}</Label><Label>{detail.memberCount} người đăng ký · {detail.registrations} lần cấp/gia hạn</Label><Label muted>Toàn bộ lịch sử, kể cả gói hết hạn/hủy. Member chỉ tính một lần trong cùng tên và loại gói; mỗi lần cấp hoặc gia hạn là một bản ghi riêng.</Label></DetailModal>}
  </View>;
}
function PackageStatisticsGroup({ label, mode, items, page, setPage, wide, onSelect }: { onSelect: (item: PackageStatistic) => void; wide: boolean; label: string; mode: PackageMode; items: PackageStatistic[]; page: number; setPage: (page: number) => void }) {
  const totalPages = Math.ceil(items.length / packagesPerPage), current = Math.min(page, totalPages);
  return <View testID={'package-stat-group-' + mode} style={{ ...(wide ? { flex: 1 } : { width: '100%' as const }), minWidth: 0, gap: spacing.sm }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}><Text accessibilityRole="header" style={styles.heading}>{label}</Text><Text style={styles.muted}>{items.length} gói</Text></View>
    <View>{items.slice((current - 1) * packagesPerPage, current * packagesPerPage).map(item => <RecordRow key={item.name} testID="package-stat-row" title={item.name} description={item.memberCount + ' người đăng ký · ' + item.registrations + ' lần cấp'} onPress={() => onSelect(item)} />)}</View>
    {totalPages > 1 && <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs }}><Button secondary label="Trước" disabled={current === 1} onPress={() => setPage(current - 1)} /><Label>{current} / {totalPages}</Label><Button secondary label="Sau" disabled={current === totalPages} onPress={() => setPage(current + 1)} /></View>}
  </View>;
}

export function MonthlyCheckins() {
  const currentYear = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date()));
  const [year, setYear] = useState(currentYear);
  const state = useLoad<{ months: { month: number; member: number; trial: number; total: number; pt: number }[] }>('/reports/checkins?year=' + year);
  return <View testID="monthly-checkin-report" style={{ gap: spacing.md }}><Text accessibilityRole="header" style={styles.heading}>Lượt check-in theo tháng</Text>
    <Choices value={String(year)} onChange={value => setYear(Number(value))} options={[
      ...(year > 1900 ? [{ value: String(year - 1), label: '← ' + (year - 1) }] : []),
      { value: String(year), label: 'Năm ' + year },
      ...(year < 2199 ? [{ value: String(year + 1), label: (year + 1) + ' →' }] : []),
    ]} />
    <Label muted>Tính theo UTC+7. Tổng lượt vào tập gồm Member và Trial; PT attendance thống kê riêng, không kết luận attendance theo booking.</Label>
    <LoadState state={state} />
    <Button secondary label="Làm mới báo cáo check-in" pending={state.loading} onPress={() => void state.reload()} />
    <View>{!state.loading && !state.error && state.data?.months.map(item => <PopupRow key={year + ':' + item.month} title={'Tháng ' + item.month + '/' + year} description={item.total + ' lượt vào tập · Member: ' + item.member + ' · Trial: ' + item.trial}>
      <Label>{item.total} lượt vào tập · Member: {item.member} · Trial: {item.trial}</Label>
      <Label muted>PT attendance: {item.pt} lượt</Label>
    </PopupRow>)}</View>
  </View>;
}
