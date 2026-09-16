import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { api } from '../src/api';
import { DataList } from '../src/components/data-list';
import { AppButton, AppInput, Card, Feedback, Screen } from '../src/design-system';
import { useAuthStore } from '../src/store/auth';

export default function Schedules() {
  const router = useRouter(); const role = useAuthStore((s) => s.session?.user.role); const [items, setItems] = useState<Record<string, unknown>[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [memberId, setMemberId] = useState(''); const [ptId, setPtId] = useState(''); const [start, setStart] = useState(''); const [end, setEnd] = useState(''); const [saving, setSaving] = useState(false);
  const [scheduleId, setScheduleId] = useState('');
  const load = async () => { setLoading(true); setError(''); try { const { data } = await api.get('/schedules'); setItems(data); } catch { setError('Không tải được lịch tập.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const create = async () => { setSaving(true); setError(''); try { await api.post('/schedules', { memberId, ptId, windowType: 'FIXED', windowStart: new Date(start).toISOString(), windowEnd: new Date(end).toISOString() }); setMemberId(''); setPtId(''); setStart(''); setEnd(''); await load(); } catch { setError('Không thể tạo lịch. Dùng thời gian ISO, ví dụ 2026-09-20T09:00:00+07:00.'); } finally { setSaving(false); } };
  const updateStatus = async (status: 'COMPLETED' | 'CANCELLED') => { setSaving(true); try { await api.patch(`/schedules/${scheduleId}`, { status }); await load(); } catch { setError('Không thể cập nhật lịch.'); } finally { setSaving(false); } };
  return <Screen title="Lịch tập" subtitle="Lịch được hiển thị theo phạm vi của tài khoản." headerAction={<AppButton label="Quay lại" variant="secondary" onPress={() => router.back()} />} keyboardAware>
    {role === 'OWNER_ADMIN' ? <><Card><Text>Tạo lịch cố định</Text><AppInput label="ID Member" value={memberId} onChangeText={setMemberId} /><AppInput label="ID PT" value={ptId} onChangeText={setPtId} /><AppInput label="Bắt đầu (ISO 8601)" value={start} onChangeText={setStart} /><AppInput label="Kết thúc (ISO 8601)" value={end} onChangeText={setEnd} /><AppButton label="Tạo lịch" loading={saving} disabled={!memberId || !ptId || !start || !end} onPress={() => void create()} /></Card><Card><Text>Cập nhật trạng thái lịch</Text><AppInput label="ID lịch" value={scheduleId} onChangeText={setScheduleId} /><AppButton label="Hoàn thành" disabled={!scheduleId} onPress={() => void updateStatus('COMPLETED')} /><AppButton label="Hủy lịch" variant="danger" disabled={!scheduleId} onPress={() => void updateStatus('CANCELLED')} /></Card></> : null}
    {error ? <><Feedback tone="error" message={error} /><AppButton label="Thử lại" variant="secondary" onPress={() => void load()} /></> : null}{loading ? <Feedback message="Đang tải lịch..." /> : <DataList items={items} empty="Chưa có lịch tập." />}
  </Screen>;
}
