import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { api, logout } from '../api';
import { AppButton, Card, Feedback, Screen, colors, radius, spacing, typography } from '../design-system';
import { Role } from '../features/auth/types';
import { useAuthStore } from '../store/auth';
import { useProfileStore } from '../store/profile';

type Route = '/people' | '/schedules' | '/checkins' | '/operations' | '/ai-analysis' | '/ai-history' | '/owner-assistant' | '/settings';
type MenuItem = { label: string; description: string; icon: string; route: Route; tone?: 'mint' | 'coral' | 'violet' };
type Metric = { value: string; label: string; tone: 'mint' | 'coral' | 'violet' };
type Props = { role: Role; title: string; description: string; canViewAnalysis?: boolean; canCreateAnalysis?: boolean; menu: MenuItem[] };

export function RoleHome({ role, title, description, canViewAnalysis, canCreateAnalysis, menu }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const session = useAuthStore((state) => state.session);
  const avatarUri = useProfileStore((state) => state.avatarUri);
  const loadProfile = useProfileStore((state) => state.load);
  const [loggingOut, setLoggingOut] = useState(false);
  const [metrics, setMetrics] = useState<Metric[]>(defaultMetrics(role));
  const [attention, setAttention] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [focusedControl, setFocusedControl] = useState('');
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true); setError('');
      try {
        if (role === 'OWNER_ADMIN') {
          const [pts, members, schedules, attendance] = await Promise.all([api.get('/pts'), api.get('/members'), api.get('/schedules'), api.get('/attendance/review')]);
          if (active) { setMetrics([{ value: String(members.data.filter((item: { status?: string }) => item.status === 'ACTIVE').length), label: 'Member hoạt động', tone: 'mint' }, { value: String(pts.data.filter((item: { status?: string }) => item.status === 'ACTIVE').length), label: 'PT hoạt động', tone: 'violet' }, { value: String(attendance.data.length), label: 'Cần đối soát', tone: 'coral' }, { value: String(todaySchedules(schedules.data).length), label: 'Lịch hôm nay', tone: 'mint' }]); setAttention(attendance.data.slice(0, 3)); }
        } else if (role === 'PT' && session) {
          const [members, schedules] = await Promise.all([api.get(`/pts/${session.user.id}/members`), api.get('/schedules')]);
          if (active) { setMetrics([{ value: String(members.data.length), label: 'Member phụ trách', tone: 'mint' }, { value: String(todaySchedules(schedules.data).length), label: 'Lịch hôm nay', tone: 'violet' }]); setAttention(todaySchedules(schedules.data).slice(0, 3)); }
        } else if (role === 'MEMBER') {
          const schedules = await api.get('/schedules');
          if (active) { setMetrics([{ value: String(schedules.data.length), label: 'Lịch sắp tới', tone: 'mint' }]); setAttention(schedules.data.slice(0, 2)); }
        }
      } catch { if (active) setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.'); }
      finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [role, session, reloadKey]);
  useEffect(() => { if (session) void loadProfile(session.user.id); }, [loadProfile, session?.user.id]);
  const signOut = async () => { setLoggingOut(true); try { await logout(); } finally { setLoggingOut(false); router.replace('/login'); } };
  const homeRoute = role === 'OWNER_ADMIN' ? '/owner_admin' : role === 'PT' ? '/pt' : '/member';
  const mobile = width < 1024;
  return <Screen bottomBar={mobile ? <BottomNavigation onHome={() => router.replace(homeRoute)} onSchedules={() => router.push('/schedules')} onAnalysis={() => router.push(canCreateAnalysis ? '/ai-analysis' : '/ai-history')} onSettings={() => router.push('/settings' as never)} /> : undefined}>
    <View style={styles.topbar}><View style={styles.brandRow}><View style={styles.logoMark}><Text style={styles.logoText}>F</Text></View><Text style={styles.brand}>FITNESS</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Mở cài đặt tài khoản" onFocus={() => setFocusedControl('profile')} onBlur={() => setFocusedControl('')} onPress={() => router.push('/settings' as never)} style={[styles.profileButton, focusedControl === 'profile' && styles.focusedControl]}>{avatarUri ? <Image source={{ uri: avatarUri }} style={styles.profileImage} /> : <Text style={styles.profileText}>{role === 'OWNER_ADMIN' ? 'OA' : role === 'MEMBER' ? 'MB' : 'PT'}</Text>}</Pressable></View>
    <View style={[styles.dashboardShell, !mobile && styles.desktopShell]}>
    {!mobile ? <Card style={styles.desktopNav}><Text style={styles.navHeading}>ĐIỀU HƯỚNG</Text><AppButton label="Trang chủ" onPress={() => router.replace(homeRoute)} style={styles.navButton} /><AppButton label="Lịch tập" variant="secondary" onPress={() => router.push('/schedules')} style={styles.navButton} /><AppButton label="Cài đặt" variant="secondary" onPress={() => router.push('/settings' as never)} style={styles.navButton} /><AppButton label="Đăng xuất" variant="secondary" loading={loggingOut} onPress={() => void signOut()} style={styles.navButton} /></Card> : null}
    <View style={styles.dashboardMain}>
    <View style={styles.hero}><Text style={styles.kicker}>{role === 'OWNER_ADMIN' ? 'BẢNG ĐIỀU HÀNH' : role === 'PT' ? 'KHÔNG GIAN HUẤN LUYỆN' : 'HÀNH TRÌNH TẬP LUYỆN'}</Text><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{description}</Text></View>
    {loading ? <Feedback message="Đang tải dữ liệu dashboard..." /> : null}{error ? <><Feedback tone="error" message={error} /><AppButton label="Thử lại" variant="secondary" onPress={() => setReloadKey((value) => value + 1)} /></> : null}
    {!loading && !error ? <View style={styles.metricGrid}>{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</View> : null}
    <Card style={styles.attentionCard}><View style={styles.row}><View style={styles.flex}><Text style={styles.sectionTitle}>{role === 'OWNER_ADMIN' ? 'Việc cần xử lý' : 'Tiếp theo của bạn'}</Text><Text style={styles.sectionSubtitle}>{attention.length ? `${attention.length} mục ưu tiên từ dữ liệu hiện tại.` : 'Hiện chưa có mục cần chú ý.'}</Text></View><Text style={styles.sparkle}>✦</Text></View>{attention.map((item, index) => <View key={String(item.id ?? index)} style={styles.attentionItem}><View style={styles.attentionDot} /><Text style={styles.attentionText}>{attentionLabel(item, role)}</Text></View>)}<AppButton label={role === 'OWNER_ADMIN' ? 'Mở đối soát' : menu[0].label} onPress={() => router.push((role === 'OWNER_ADMIN' ? '/operations' : menu[0].route) as never)} /></Card>
    <View><Text style={styles.sectionTitle}>Khám phá nhanh</Text><Text style={styles.sectionSubtitle}>Các công cụ đúng với quyền của tài khoản.</Text></View>
    <View style={styles.menuGrid}>{menu.map((item) => <Pressable key={item.label} accessibilityRole="button" onFocus={() => setFocusedControl(item.route)} onBlur={() => setFocusedControl('')} onPress={() => router.push(item.route as never)} style={({ pressed }) => [styles.menuCard, styles[`menu${item.tone ?? 'mint'}`], focusedControl === item.route && styles.focusedControl, pressed && styles.pressed]}><View style={styles.menuIcon}><Text style={styles.menuIconText}>{item.icon}</Text></View><Text style={styles.menuTitle}>{item.label}</Text><Text style={styles.menuDescription}>{item.description}</Text><Text style={styles.menuArrow}>→</Text></Pressable>)}</View>
    {canViewAnalysis ? <Card style={styles.aiCard}><Text style={styles.aiEyebrow}>AI BODY ANALYSIS</Text><Text style={styles.aiTitle}>Dữ liệu có cấu trúc cho kế hoạch tập luyện phù hợp.</Text><Text style={styles.aiDescription}>Video luôn qua phân tích CV/Pose trước khi sinh gợi ý.</Text><View style={styles.actions}>{canCreateAnalysis ? <AppButton label="Phân tích mới" onPress={() => router.push('/ai-analysis')} style={styles.flex} /> : null}<AppButton label="Lịch sử" variant="secondary" onPress={() => router.push('/ai-history')} style={styles.flex} /></View></Card> : null}
    </View></View>
  </Screen>;
}

function MetricCard({ metric }: { metric: Metric }) { return <View style={[styles.metric, styles[`metric${metric.tone}`]]}><Text style={styles.metricValue}>{metric.value}</Text><Text style={styles.metricLabel}>{metric.label}</Text></View>; }
function BottomNavigation({ onHome, onSchedules, onAnalysis, onSettings }: { onHome: () => void; onSchedules: () => void; onAnalysis: () => void; onSettings: () => void }) { return <View style={styles.bottomNav}><NavItem icon="⌂" label="Trang chủ" active onPress={onHome} /><NavItem icon="▣" label="Lịch tập" onPress={onSchedules} /><NavItem icon="◌" label="AI phân tích" onPress={onAnalysis} /><NavItem icon="⚙" label="Cài đặt" onPress={onSettings} /></View>; }
function NavItem({ icon, label, active, onPress }: { icon: string; label: string; active?: boolean; onPress: () => void }) { return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={styles.navItem}><Text style={[styles.navIcon, active && styles.navActive]}>{icon}</Text><Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text></Pressable>; }
function defaultMetrics(role: Role): Metric[] { return role === 'OWNER_ADMIN' ? [{ value: '—', label: 'Member đang quản lý', tone: 'mint' }, { value: '—', label: 'PT đang hoạt động', tone: 'violet' }, { value: '—', label: 'Cần đối soát', tone: 'coral' }] : role === 'PT' ? [{ value: '—', label: 'Member phụ trách', tone: 'mint' }, { value: '—', label: 'Lịch của bạn', tone: 'violet' }] : [{ value: '—', label: 'Lịch sắp tới', tone: 'mint' }, { value: 'AI', label: 'Phân tích cơ thể', tone: 'violet' }]; }
function todaySchedules(items: { windowStart?: string }[]) { const today = new Date().toDateString(); return items.filter((item) => item.windowStart && new Date(item.windowStart).toDateString() === today); }
function attentionLabel(item: Record<string, unknown>, role: Role) { const schedule = item.schedule && typeof item.schedule === 'object' ? item.schedule as Record<string, unknown> : undefined; const status = String(item.status ?? item.attendanceStatus ?? 'SCHEDULED').replaceAll('_', ' '); const rawStart = item.windowStart ?? schedule?.windowStart ?? item.evaluatedAt; const start = rawStart ? new Date(String(rawStart)).toLocaleString('vi-VN') : ''; return role === 'OWNER_ADMIN' ? `${status}${start ? ` · ${start}` : ''}` : `Lịch tập ${start || 'sắp tới'} · ${status}`; }

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, logoMark: { width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, logoText: { color: colors.onPrimary, fontWeight: '800', fontSize: 17 }, brand: { ...typography.label, color: colors.text, letterSpacing: 1.2 }, profileButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.successSurface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface }, focusedControl: { borderColor: colors.focus, shadowColor: colors.focus, shadowOpacity: 0.3, shadowRadius: 6 }, profileImage: { width: 44, height: 44, borderRadius: 22 }, profileText: { ...typography.label, color: colors.primary }, dashboardShell: { gap: spacing.xl }, desktopShell: { flexDirection: 'row', alignItems: 'flex-start' }, dashboardMain: { flex: 1, gap: spacing.lg, minWidth: 0 }, desktopNav: { width: 220, alignSelf: 'flex-start', gap: spacing.sm }, navHeading: { ...typography.label, color: colors.textMuted }, navButton: { width: '100%' }, hero: { gap: spacing.xs }, kicker: { ...typography.label, color: colors.primary }, title: { ...typography.display, color: colors.text }, subtitle: { ...typography.body, color: colors.textMuted }, metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, metric: { flexGrow: 1, flexBasis: 145, minHeight: 108, borderRadius: radius.xl, padding: spacing.lg, justifyContent: 'space-between' }, metricmint: { backgroundColor: colors.successSurface }, metricviolet: { backgroundColor: colors.violetSurface }, metriccoral: { backgroundColor: colors.warningSurface }, metricValue: { ...typography.display, color: colors.text, fontVariant: ['tabular-nums'] }, metricLabel: { ...typography.label, color: colors.textMuted }, attentionCard: { backgroundColor: colors.surfaceAccent, borderColor: '#B8F2E8' }, attentionItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs, borderTopWidth: 1, borderColor: '#CFF4ED' }, attentionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }, sectionTitle: { ...typography.heading, color: colors.text }, sectionSubtitle: { ...typography.caption, color: colors.textMuted }, sparkle: { color: colors.primary, fontSize: 22 }, attentionText: { ...typography.body, color: colors.text }, menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }, menuCard: { flexGrow: 1, flexBasis: 220, minHeight: 176, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm, backgroundColor: colors.surface }, menumint: { backgroundColor: '#F5FFFD' }, menucoral: { backgroundColor: '#FFF9F5' }, menuviolet: { backgroundColor: '#FAF9FF' }, menuIcon: { height: 44, width: 44, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, menuIconText: { color: colors.primary, fontSize: 18 }, menuTitle: { ...typography.heading, color: colors.text }, menuDescription: { ...typography.caption, color: colors.textMuted, flex: 1 }, menuArrow: { ...typography.heading, color: colors.primary }, pressed: { opacity: 0.78 }, aiCard: { backgroundColor: colors.violetSurface, borderColor: '#D9D2FF' }, aiEyebrow: { ...typography.label, color: colors.violet }, aiTitle: { ...typography.heading, color: colors.text }, aiDescription: { ...typography.caption, color: colors.textMuted }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, flex: { flex: 1 }, bottomNav: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, navItem: { minWidth: 68, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: spacing.xs }, navIcon: { color: colors.textMuted, fontSize: 20 }, navLabel: { ...typography.label, color: colors.textMuted, fontSize: 10 }, navActive: { color: colors.primary },
});
