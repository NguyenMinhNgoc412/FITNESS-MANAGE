import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { api } from '../src/api';
import { DataList } from '../src/components/data-list';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, Card, Feedback, Screen, colors, spacing, typography } from '../src/design-system';

export default function Checkins() {
  const router = useRouter(); const [items, setItems] = useState<Record<string, unknown>[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [saving, setSaving] = useState(false);
  const load = async () => { setLoading(true); try { const { data } = await api.get('/checkins/self'); setItems(data); setError(''); } catch { setError('Không tải được lịch sử check-in.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const checkin = async () => { setSaving(true); setError(''); setSuccess(''); try { const { data } = await api.post('/checkins/self', { idempotencyKey: `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}` }); setSuccess(data?.idempotentReplay ? 'Check-in này đã được ghi nhận trước đó.' : 'Check-in thành công. Hệ thống đang đối soát với lịch tập.'); await load(); } catch { setError('Không thể check-in lúc này.'); } finally { setSaving(false); } };
  return <Screen title="Lịch tập & Check-in" subtitle="Xác nhận sự có mặt của chính bạn trong ngày." headerAction={<AppButton label="Quay lại" variant="secondary" onPress={() => router.back()} />}>
    <Card style={styles.hero}><View style={styles.heroIcon}><Text style={styles.heroIconText}>✓</Text></View><View style={styles.heroCopy}><Text style={styles.heroTitle}>Bạn đã đến phòng?</Text><Text style={styles.heroText}>Check-in được lưu riêng và đối soát cùng lịch tập.</Text></View><AppButton label="Check-in" loading={saving} onPress={() => void checkin()} /></Card>
    <Feedback tone="success" message={success} />
    <View style={styles.section}><Text style={styles.sectionTitle}>Lịch sử gần đây</Text><Text style={styles.sectionNote}>Trạng thái được hiển thị theo dữ liệu máy chủ.</Text></View>
    {error ? <><Feedback tone="error" message={error} /><AppButton label="Thử lại" variant="secondary" onPress={() => void load()} /></> : null}{loading ? <Feedback message="Đang tải lịch sử check-in..." /> : <DataList kind="checkin" items={items} empty="Chưa có lần check-in nào." />}
  </Screen>;
}
const styles = StyleSheet.create({ hero: { backgroundColor: colors.surfaceAccent, borderColor: '#B8F2E8', flexDirection: 'row', alignItems: 'center', gap: spacing.md }, heroIcon: { height: 48, width: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, heroIconText: { color: colors.onPrimary, fontSize: 24, fontWeight: '700' }, heroCopy: { flex: 1, gap: 2 }, heroTitle: { ...typography.bodyStrong, color: colors.text }, heroText: { ...typography.caption, color: colors.textMuted }, section: { gap: 2 }, sectionTitle: { ...typography.heading, color: colors.text }, sectionNote: { ...typography.caption, color: colors.textMuted } });
