import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { api } from '../src/api';
import { DataList } from '../src/components/data-list';
import { AppButton, Feedback, Screen } from '../src/design-system';

export default function Checkins() {
  const router = useRouter(); const [items, setItems] = useState<Record<string, unknown>[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const load = async () => { setLoading(true); try { const { data } = await api.get('/checkins/self'); setItems(data); setError(''); } catch { setError('Không tải được lịch sử check-in.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const checkin = async () => { setSaving(true); try { await api.post('/checkins/self', { idempotencyKey: `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}` }); await load(); } catch { setError('Không thể check-in lúc này.'); } finally { setSaving(false); } };
  return <Screen title="Check-in" subtitle="Mỗi lần check-in được lưu thành một sự kiện riêng." headerAction={<AppButton label="Quay lại" variant="secondary" onPress={() => router.back()} />}><AppButton label="Check-in ngay" loading={saving} onPress={() => void checkin()} />{error ? <><Feedback tone="error" message={error} /><AppButton label="Thử lại" variant="secondary" onPress={() => void load()} /></> : null}{loading ? <Feedback message="Đang tải..." /> : <DataList items={items} empty="Chưa có lần check-in nào." />}</Screen>;
}
