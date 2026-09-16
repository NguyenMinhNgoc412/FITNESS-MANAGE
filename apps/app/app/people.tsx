import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '../src/api';
import { DataList } from '../src/components/data-list';
import { AppButton, AppInput, Card, Feedback, Screen, colors, spacing, typography } from '../src/design-system';
import { useAuthStore } from '../src/store/auth';

type Person = Record<string, unknown> & { id: string; fullName?: string; memberProfile?: { goal?: string; assignments?: { ptId: string }[] } };
export default function People() {
  const router = useRouter(); const session = useAuthStore((s) => s.session); const role = session?.user.role;
  const [items, setItems] = useState<Person[]>([]); const [pts, setPts] = useState<Person[]>([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<'PT' | 'MEMBER'>('PT'); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [extra, setExtra] = useState(''); const [ptId, setPtId] = useState(''); const [saving, setSaving] = useState(false);
  const [targetId, setTargetId] = useState(''); const [targetType, setTargetType] = useState<'PT' | 'MEMBER'>('MEMBER'); const [newPtId, setNewPtId] = useState('');
  const load = async () => { if (!session) return; setLoading(true); setError(''); try {
    if (role === 'OWNER_ADMIN') { const [ptRes, memberRes] = await Promise.all([api.get('/pts'), api.get('/members')]); setPts(ptRes.data); setItems([...ptRes.data, ...memberRes.data].map((p: Person) => ({ ...p, goal: p.memberProfile?.goal, memberProfile: undefined }))); }
    else if (role === 'PT') { const { data } = await api.get(`/pts/${session.user.id}/members`); setItems(data); }
    else { const { data } = await api.get(`/members/${session.user.id}/current-pt`); setItems([data.pt]); }
  } catch (e) { setError('Không tải được dữ liệu. Hãy thử lại.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [session?.user.id]);
  const create = async () => { setSaving(true); setError(''); try { if (kind === 'PT') await api.post('/pts', { fullName: name, email, password, specialization: extra }); else await api.post('/members', { fullName: name, email, password, goal: extra, ptId }); setName(''); setEmail(''); setPassword(''); setExtra(''); await load(); } catch { setError('Không thể tạo tài khoản. Kiểm tra dữ liệu và thử lại.'); } finally { setSaving(false); } };
  const setStatus = async (status: 'ACTIVE' | 'LOCKED') => { setSaving(true); try { await api.patch(`/${targetType === 'PT' ? 'pts' : 'members'}/${targetId}`, { status }); await load(); } catch { setError('Không thể cập nhật trạng thái tài khoản.'); } finally { setSaving(false); } };
  const changePt = async () => { setSaving(true); try { await api.post(`/members/${targetId}/assignment/change-pt`, { newPtId, idempotencyKey: `mobile-change-${Date.now()}` }); setNewPtId(''); await load(); } catch { setError('Không thể đổi PT cho Member.'); } finally { setSaving(false); } };
  return <Screen title="PT và Member" subtitle="Dữ liệu được giới hạn theo vai trò." headerAction={<AppButton label="Quay lại" variant="secondary" onPress={() => router.back()} />} keyboardAware>
    {role === 'OWNER_ADMIN' ? <><Card><Text style={styles.heading}>Tạo tài khoản</Text><View style={styles.switch}><AppButton label="PT" variant={kind === 'PT' ? 'primary' : 'secondary'} onPress={() => setKind('PT')} style={styles.flex} /><AppButton label="Member" variant={kind === 'MEMBER' ? 'primary' : 'secondary'} onPress={() => setKind('MEMBER')} style={styles.flex} /></View><AppInput label="Họ tên" value={name} onChangeText={setName} /><AppInput label="Email" value={email} autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} /><AppInput label="Mật khẩu (ít nhất 8 ký tự)" value={password} secureTextEntry onChangeText={setPassword} /><AppInput label={kind === 'PT' ? 'Chuyên môn' : 'Mục tiêu'} value={extra} onChangeText={setExtra} />{kind === 'MEMBER' ? <AppInput label="ID PT phụ trách" value={ptId} onChangeText={setPtId} /> : null}<AppButton label="Tạo tài khoản" loading={saving} disabled={!name || !email || password.length < 8 || !extra || (kind === 'MEMBER' && !ptId)} onPress={() => void create()} /></Card><Card><Text style={styles.heading}>Cập nhật tài khoản</Text><View style={styles.switch}><AppButton label="PT" variant={targetType === 'PT' ? 'primary' : 'secondary'} onPress={() => setTargetType('PT')} style={styles.flex} /><AppButton label="Member" variant={targetType === 'MEMBER' ? 'primary' : 'secondary'} onPress={() => setTargetType('MEMBER')} style={styles.flex} /></View><AppInput label="ID tài khoản" value={targetId} onChangeText={setTargetId} /><View style={styles.switch}><AppButton label="Mở khóa" disabled={!targetId} onPress={() => void setStatus('ACTIVE')} style={styles.flex} /><AppButton label="Khóa" variant="danger" disabled={!targetId} onPress={() => void setStatus('LOCKED')} style={styles.flex} /></View>{targetType === 'MEMBER' ? <><AppInput label="ID PT mới" value={newPtId} onChangeText={setNewPtId} /><AppButton label="Đổi PT" variant="secondary" disabled={!targetId || !newPtId} onPress={() => void changePt()} /></> : null}</Card></> : null}
    {error ? <><Feedback tone="error" message={error} /><AppButton label="Thử lại" variant="secondary" onPress={() => void load()} /></> : null}
    {loading ? <Feedback message="Đang tải dữ liệu..." /> : <DataList items={items} />}
  </Screen>;
}
const styles = StyleSheet.create({ heading: { ...typography.heading, color: colors.text }, switch: { flexDirection: 'row', gap: spacing.sm }, flex: { flex: 1 } });
