import { BackHandler, Keyboard, Platform, Text, TextInputInstance, View, ViewInstance } from 'react-native';
import { RecordRow } from '../components/record-row';
import { DetailModal } from '../components/detail-modal';
import { ActivityCard as Card } from '../components/activity-visuals';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { Button, Label, LoadState, Pager, styles } from '../ui';
import { ExerciseDemo } from '../components/exercise-demo';
import { FilterSelect } from '../components/filter-select';
import { colors, radius, spacing } from '../design-system/theme';
import { ActivityScroll, ActivityFilters } from '../components/workout-controls';
import { useLoad } from '../hooks/use-load';
import { CatalogDetail, CatalogSummary, Collection, equipmentLabels, muscleLabels } from '../features/workouts';

export function ExerciseLibrary({ onSelect }: { onSelect?: (item: CatalogDetail) => void }) {
  const [group, setGroup] = useState(''), [equipment, setEquipment] = useState(''), [search, setSearch] = useState(''), [query, setQuery] = useState(''), [page, setPage] = useState(1), [selected, setSelected] = useState('');
  const state = useLoad<Collection<CatalogSummary>>('/exercise-library?' + new URLSearchParams({ page: String(page), ...(group ? { muscleGroup: group } : {}), ...(equipment ? { equipment } : {}), ...(query ? { q: query } : {}) }));
  const [openFilter, setOpenFilter] = useState<'group' | 'equipment' | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'android' || !openFilter) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => { setOpenFilter(null); return true; });
    return () => back.remove();
  }, [openFilter]);
  const input = useRef<TextInputInstance>(null), results = useRef<ViewInstance>(null), scroll = useContext(ActivityScroll);
  const keyboardSearch = useRef(false);
  const revealResults = useCallback(() => {
    requestAnimationFrame(() => {
      if (Platform.OS === 'web') {
        (results.current as unknown as HTMLElement | null)?.scrollIntoView({ block: 'start', behavior: 'auto' });
      } else {
        const container = scroll?.current, target = container?.getInnerViewRef();
        if (container && target != null) results.current?.measureLayout(target, (_x, y) => container.scrollTo({ y: Math.max(0, y - spacing.md), animated: false }), () => {});
      }
    });
  }, [scroll]);
  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidHide', () => { if (keyboardSearch.current) { keyboardSearch.current = false; revealResults(); } });
    return () => subscription.remove();
  }, [revealResults]);
  const submitSearch = () => {
    keyboardSearch.current = Platform.OS !== 'web' && Keyboard.isVisible();
    input.current?.blur(); Keyboard.dismiss();
    const nextQuery = search.trim();
    if (nextQuery === query && page === 1) void state.reload();
    else { setQuery(nextQuery); setPage(1); }
    setSelected(''); setOpenFilter(null); revealResults();
  };
  return <><Card kind="library" title="Bài tập mẫu"><Label muted>Tham khảo kỹ thuật theo nhóm cơ. Chọn mức tạ và số hiệp theo hướng dẫn PT.</Label>
    <Label>Tìm bài tập</Label><TextInput ref={input} returnKeyType="search" onSubmitEditing={submitSearch} submitBehavior="blurAndSubmit" accessibilityLabel="Tên bài Việt hoặc Anh" placeholder="Tên bài Việt hoặc Anh" maxLength={100} value={search} onChangeText={setSearch} style={styles.input} />
    <Button label="Tìm bài tập" pending={state.loading} onPress={submitSearch} />
    <ActivityFilters onExpandedChange={() => setOpenFilter(null)} summary={(muscleLabels[group] ?? 'Tất cả nhóm cơ') + ' · ' + (equipmentLabels[equipment] ?? 'Tất cả dụng cụ')}>
      <FilterSelect open={openFilter === 'group'} onOpenChange={open => setOpenFilter(open ? 'group' : null)} label="Nhóm cơ" value={group} options={[{ value: '', label: 'Tất cả nhóm cơ' }, ...Object.entries(muscleLabels).map(([value, label]) => ({ value, label }))]} onChange={v => { setGroup(v); setPage(1); }} />
      <FilterSelect open={openFilter === 'equipment'} onOpenChange={open => setOpenFilter(open ? 'equipment' : null)} label="Dụng cụ" value={equipment} options={[{ value: '', label: 'Tất cả dụng cụ' }, ...Object.entries(equipmentLabels).map(([value, label]) => ({ value, label }))]} onChange={v => { setEquipment(v); setPage(1); }} />
    </ActivityFilters>
    <Label muted>Thư viện tham khảo, không phải giáo án cá nhân.</Label>
  </Card>
    <View ref={results} testID="exercise-search-results" style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderTopWidth: 3, borderTopColor: colors.primary, padding: spacing.lg, gap: spacing.sm }}>
      <Text accessibilityRole="header" style={styles.heading}>Kết quả tìm kiếm</Text>
      <View accessibilityLiveRegion="polite"><Label muted>{state.loading ? 'Đang tìm bài tập…' : state.error ? 'Chưa tải được kết quả.' : (state.data?.total ?? 0) + ' bài phù hợp' + (query ? ' với “' + query + '”' : '')}</Label></View>
      <LoadState state={state} empty={state.data?.total === 0} emptyText="Không có bài phù hợp. Thử đổi nhóm cơ, dụng cụ hoặc từ khóa." />
      <View>{!state.loading && !state.error && state.data?.items.map(item => <RecordRow key={item.id} title={item.nameVi} description={item.muscleGroups.map(g => muscleLabels[g]).join(', ') + ' · ' + item.equipmentCodes.map(e => equipmentLabels[e]).join(', ')} label={'Xem ' + item.nameVi} onPress={() => { setOpenFilter(null); setSelected(item.id); }} />)}</View>
    {selected && <ExerciseDetail key={selected} id={selected} onClose={() => setSelected('')} onSelect={onSelect ? item => { setSelected(''); onSelect(item); } : undefined} />}
    <Pager page={page} setPage={setPage} disabled={state.loading} more={page * 20 < (state.data?.total ?? 0)} /></View>
  </>;
}
function ExerciseDetail({ id, onSelect, onClose }: { id: string; onSelect?: (item: CatalogDetail) => void; onClose: () => void }) {
  const state = useLoad<CatalogDetail>('/exercise-library/' + id);
  return <DetailModal title="Chi tiết bài tập mẫu" onClose={onClose} footer={onSelect && state.data && !state.loading && !state.error ? <Button label="Chọn bài vào buổi nháp" onPress={() => onSelect(state.data!)} /> : undefined}><LoadState state={state} />{state.data && <><Label>{state.data.nameVi}</Label><Label>{state.data.nameEn}</Label><ExerciseDemo item={state.data} /><Label>{state.data.description}</Label>{state.data.steps.map((s, i) => <Label key={i}>{i + 1}. {s}</Label>)}{state.data.techniqueNotes.map((s, i) => <Label key={i} muted>{s}</Label>)}<Label muted>Bài mẫu không đồng nghĩa AI hỗ trợ phân tích bài này.</Label></>}</DetailModal>;
}
