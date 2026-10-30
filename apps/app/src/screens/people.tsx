import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Badge, Button, Choices, Label, LoadState, styles } from '../ui';
import { Form } from '../components/form';
import { DetailModal } from '../components/detail-modal';
import { PeopleDetail } from '../components/people-detail';
import { mutation } from '../lib/http';
import { useLoad } from '../hooks/use-load';
import { Person } from '../models';
import { colors, controlSize, spacing } from '../design-system/theme';

export default function People() {
  const { width } = useWindowDimensions();
  const [role, setRole] = useState('PT'), [serverPage, setServerPage] = useState(1), [part, setPart] = useState(0);
  const [selected, setSelected] = useState<Person | null>(null), [creating, setCreating] = useState(false), [busy, setBusy] = useState(false);
  const [query, setQuery] = useState(''), [capacity, setCapacity] = useState(3);
  const lock = useRef(false);
  const state = useLoad<Person[]>('/people?role=' + role + '&page=' + serverPage);
  const filtered = (state.data ?? []).filter(p => (p.profile.fullName + ' ' + p.phone).toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')));
  const lastPart = Math.max(0, Math.ceil(filtered.length / capacity) - 1), currentPart = Math.min(part, lastPart);
  const shown = filtered.slice(currentPart * capacity, (currentPart + 1) * capacity);
  const run = async (action: () => Promise<unknown>) => {
    if (lock.current) throw new Error('Đang lưu thay đổi.');
    lock.current = true; setBusy(true);
    try { return await action(); } finally { lock.current = false; setBusy(false); }
  };
  const close = () => { if (!lock.current) { setSelected(null); setCreating(false); } };
  const person = state.data?.find(p => p.id === selected?.id) ?? selected;
  return <View style={{ flex: 1, minHeight: 0, backgroundColor: colors.background, padding: width < 600 ? spacing.lg : spacing.xl, gap: spacing.md }}>
    <View style={styles.row}><Text style={[width < 400 ? styles.heading : styles.title, { flex: 1 }]}>PT & Member</Text><Button label={role === 'PT' ? 'Thêm PT' : 'Thêm Member'} onPress={() => setCreating(true)} /></View>
    <Choices value={role} onChange={v => { setRole(v); setServerPage(1); setPart(0); setQuery(''); }} options={[{ value: 'PT', label: 'Huấn luyện viên' }, { value: 'MEMBER', label: 'Hội viên' }]} />
    <View style={{ gap: spacing.xs }}><Label muted>Lọc nhóm hiện tại · tên hoặc SĐT</Label><TextInput accessibilityLabel="Lọc nhóm hiện tại theo tên hoặc SĐT" placeholder="Lọc nhóm hiện tại: tên hoặc SĐT" placeholderTextColor={colors.textMuted} style={styles.input} value={query} onChangeText={v => { setQuery(v); setPart(0); }} /></View>
    <View style={{ flex: 1, minHeight: 0, overflow: 'hidden' }} onLayout={event => {
      const count = Math.max(1, Math.min(10, Math.floor(event.nativeEvent.layout.height / 80)));
      const next = [1, 2, 3, 5, 6, 10].filter(n => n <= count).pop() ?? 1;
      if (next !== capacity) { setCapacity(next); setPart(0); }
    }}>
      <LoadState state={state} empty={!filtered.length} emptyText={query ? 'Không có kết quả trong nhóm hiện tại. Xóa bộ lọc hoặc chuyển nhóm tiếp theo.' : role === 'PT' ? 'Chưa có PT nội bộ.' : 'Chưa có Member chính thức.'} />
      {!state.loading && !state.error && shown.map(p => <PersonRow key={p.id} person={p} onPress={() => setSelected(p)} />)}
    </View>
    <View style={[styles.row, { justifyContent: 'space-between', gap: spacing.xs }]}>
      <Button secondary label="Trang trước" disabled={state.loading || (serverPage === 1 && currentPart === 0)} onPress={() => { if (currentPart > 0) setPart(currentPart - 1); else { setServerPage(serverPage - 1); setPart(Math.ceil(30 / capacity) - 1); setQuery(''); } }} />
      <Label>Trang {(serverPage - 1) * (30 / capacity) + currentPart + 1}</Label>
      <Button secondary label="Trang sau" disabled={state.loading || !!state.error || (currentPart === lastPart && state.data?.length !== 30)} onPress={() => { if (currentPart < lastPart) setPart(currentPart + 1); else { setServerPage(serverPage + 1); setPart(0); setQuery(''); } }} />
    </View>
    {(creating || person) && <DetailModal title={creating ? (role === 'PT' ? 'Tạo PT nội bộ' : 'Tạo Member mới') : person!.profile.fullName} busy={busy} onClose={close}>
      {creating ? <Form fields={[{ name: 'fullName', label: 'Họ tên' }, { name: 'phone', label: 'SĐT', numeric: true }, { name: 'cccd', label: 'CCCD', numeric: true }, { name: 'password', label: 'Mật khẩu (ít nhất 10 ký tự)', secret: true }]} label="Tạo hồ sơ" submit={(v, k) => run(() => mutation('/people', { ...v, role }, k))} onSuccess={() => { close(); setServerPage(1); setPart(0); setQuery(''); void state.reload(); }} /> : <PeopleDetail key={person!.id} person={person!} busy={busy} run={run} onUpdated={() => void state.reload()} />}
    </DetailModal>}
  </View>;
}

function PersonRow({ person, onPress }: { person: Person; onPress: () => void }) {
  const [focused, setFocused] = useState(false), [hovered, setHovered] = useState(false);
  return <Pressable testID="person-row" accessibilityRole="button" accessibilityLabel={'Xem chi tiết ' + person.profile.fullName} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={({ pressed }) => ({ minHeight: controlSize.touch, height: 80, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, borderWidth: 1, borderColor: focused ? colors.focus : colors.transparent, borderBottomColor: focused ? colors.focus : colors.border, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: pressed || hovered ? colors.surfaceMuted : colors.transparent })}>
    <View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={1} style={styles.text}>{person.profile.fullName}</Text><Text style={styles.muted}>{person.phone}</Text></View><Badge value={person.status} /><Text style={styles.muted}>›</Text>
  </Pressable>;
}
