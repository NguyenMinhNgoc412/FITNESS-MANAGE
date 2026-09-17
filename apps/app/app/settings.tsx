import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AppButton, Card, Feedback, Screen, colors, radius, spacing, typography } from '../src/design-system';
import { api } from '../src/api';
import { persistAvatar } from '../src/features/profile/preferences';
import { useAuthStore } from '../src/store/auth';
import { useProfileStore } from '../src/store/profile';
import { GuardFallback, useAuthGuard } from '../src/use-role-guard';

export default function Settings() {
  const session = useAuthGuard();
  const router = useRouter();
  const avatarUri = useProfileStore((state) => state.avatarUri);
  const load = useProfileStore((state) => state.load);
  const setAvatar = useProfileStore((state) => state.setAvatar);
  const clearSession = useAuthStore((state) => state.clear);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [profile, setProfile] = useState<{ fullName: string; email: string; phone?: string; status: string } | null>(null);
  const [profileError, setProfileError] = useState('');
  useEffect(() => { if (session) void load(session.user.id); }, [load, session?.user.id]);
  useEffect(() => { if (session) void api.get('/auth/me').then(({ data }) => setProfile(data)).catch(() => setProfileError('Không tải được thông tin tài khoản.')); }, [session?.user.id]);
  if (!session) return <GuardFallback />;
  const roleName = roleLabel(session.user.role);
  const initials = session.user.role === 'OWNER_ADMIN' ? 'OA' : session.user.role === 'MEMBER' ? 'MB' : 'PT';
  const chooseAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setAvatarError('Cần quyền truy cập Thư viện ảnh để chọn ảnh đại diện.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (result.canceled) return;
    if ((result.assets[0].fileSize ?? 0) > 3 * 1024 * 1024) { setAvatarError('Ảnh phải nhỏ hơn 3 MB.'); return; }
    setSaving(true); setMessage(''); setAvatarError('');
    try { const stableUri = await persistAvatar(session.user.id, result.assets[0].uri, result.assets[0].mimeType); await setAvatar(stableUri); setMessage('Đã cập nhật ảnh đại diện trên thiết bị này.'); }
    catch { setAvatarError('Không thể lưu ảnh đại diện. Vui lòng thử ảnh khác.'); }
    finally { setSaving(false); }
  };
  const signOut = async () => { setSaving(true); await clearSession(); router.replace('/login'); };
  return <Screen title="Cài đặt" subtitle="Thông tin tài khoản và tùy chọn phiên đăng nhập." headerAction={<AppButton label="Quay lại" variant="secondary" onPress={() => router.back()} />}>
    <Card style={styles.profile}>
      {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatar} accessibilityLabel="Ảnh đại diện" /> : <View style={styles.fallback}><Text style={styles.initials}>{initials || 'FM'}</Text></View>}
      <View style={styles.identity}><Text style={styles.name}>{profile?.fullName ?? roleName}</Text><Text style={styles.meta}>{profile?.email ?? `Mã tài khoản: ${session.user.id}`}</Text>{profile?.phone ? <Text style={styles.meta}>{profile.phone}</Text> : null}<View style={styles.role}><Text style={styles.roleText}>{roleName} · {profile?.status ?? 'ACTIVE'}</Text></View></View>
    </Card>
    <Feedback tone="error" message={profileError} />
    <Card><Text style={styles.heading}>Ảnh đại diện</Text><Text style={styles.meta}>Ảnh mặc định dùng chữ viết tắt. Ảnh tùy chọn hiện được lưu trên thiết bị này.</Text><View style={styles.actions}><AppButton label="Chọn ảnh" loading={saving} onPress={() => void chooseAvatar()} style={styles.flex} />{avatarUri ? <AppButton label="Dùng ảnh mặc định" variant="secondary" disabled={saving} onPress={() => void setAvatar(undefined)} style={styles.flex} /> : null}</View><Feedback tone="success" message={message} /><Feedback tone="error" message={avatarError} /></Card>
    <Card><Text style={styles.heading}>Phiên đăng nhập</Text><Text style={styles.meta}>Đăng xuất an toàn khỏi tài khoản hiện tại.</Text><AppButton label="Đăng xuất" variant="danger" loading={saving} onPress={() => void signOut()} /></Card>
  </Screen>;
}

function roleLabel(role: string) { return role === 'OWNER_ADMIN' ? 'OWNER / ADMIN' : role; }
const styles = StyleSheet.create({ profile: { flexDirection: 'row', alignItems: 'center' }, avatar: { width: 72, height: 72, borderRadius: 36 }, fallback: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, initials: { ...typography.heading, color: colors.onPrimary }, identity: { flex: 1, gap: spacing.xs }, name: { ...typography.heading, color: colors.text }, meta: { ...typography.caption, color: colors.textMuted }, role: { alignSelf: 'flex-start', backgroundColor: colors.successSurface, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, roleText: { ...typography.label, color: colors.success }, heading: { ...typography.heading, color: colors.text }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, flex: { flexGrow: 1, flexBasis: 180 } });
