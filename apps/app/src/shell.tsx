import { Link, Slot, usePathname } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Role } from './features/auth/types';
import { useRoleGuard, GuardFallback } from './use-role-guard';
import { colors as c } from './design-system/theme';
const menus: Record<Role, [string, string][]> = {
  OWNER: [['/owner', 'Tổng quan'], ['/owner/customers', 'Khách hàng'], ['/owner/packages', 'Gói tập'], ['/owner/bookings', 'Lịch tập'], ['/owner/checkins', 'Check-in'], ['/owner/pt', 'PT'], ['/owner/alerts', 'Sales / Cảnh báo'], ['/owner/logs', 'Logs / Báo cáo'], ['/owner/settings', 'Cài đặt']],
  PT: [['/pt', 'Hôm nay'], ['/pt/schedule', 'Lịch'], ['/pt/members', 'Member'], ['/pt/account', 'Tài khoản']],
  MEMBER: [['/member', 'Trang chủ'], ['/member/schedule', 'Lịch'], ['/member/checkin', 'Check-in'], ['/member/ai', 'AI'], ['/member/account', 'Tài khoản']],
};
export function Shell({ role }: { role: Role }) {
  const ready = useRoleGuard(role), { width } = useWindowDimensions(), pathname = usePathname();
  const [ownerMenu, setOwnerMenu] = useState(false);
  if (!ready) return <GuardFallback />;
  const wide = role === 'OWNER' && width >= 900;
  const bottom = !wide && role !== 'OWNER';
  const nav = <View style={[s.nav, wide || role === 'OWNER' ? s.sidebar : s.bottom]}>{menus[role].map(([href, label]) => <Link onPress={() => setOwnerMenu(false)} href={href as never} key={href} style={[s.link, bottom && s.bottomLink, pathname === href && s.active]} accessibilityRole="link">{label}</Link>)}</View>;
  const compactOwner = role === 'OWNER' && !wide;
  return <SafeAreaView style={s.safe}><View style={s.brand}><Text style={s.logo}>F</Text><View style={{ flex: 1 }}><Text style={s.brandText}>FITNESS-MANAGE</Text><Text style={s.subtitle}>{role === 'OWNER' ? 'Quản lý phòng tập' : role === 'PT' ? 'Huấn luyện viên' : 'Hội viên'}</Text></View>{compactOwner && <Pressable accessibilityLabel={ownerMenu ? 'Đóng menu' : 'Mở menu'} accessibilityRole="button" accessibilityState={{ expanded: ownerMenu }} onPress={() => setOwnerMenu(value => !value)} style={s.menuButton}><Text style={s.menuText}>{ownerMenu ? 'Đóng' : 'Menu'}</Text></Pressable>}</View><View style={[s.body, { flexDirection: wide ? 'row' : 'column' }]}>{wide && nav}{compactOwner && ownerMenu && <View accessibilityViewIsModal style={s.drawerLayer}><Pressable accessibilityLabel="Đóng menu" accessibilityRole="button" style={s.backdrop} onPress={() => setOwnerMenu(false)} /><View style={s.drawer}>{nav}</View></View>}<View style={{ flex: 1, minWidth: 0 }}><Slot /></View>{bottom && nav}</View></SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.surface }, body: { flex: 1 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderColor: c.border },
  logo: { color: c.onPrimary, backgroundColor: c.primary, fontSize: 26, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  brandText: { fontSize: 16, fontWeight: '700', color: c.primary }, subtitle: { color: c.textMuted, fontSize: 12, marginTop: 4 },
  nav: { padding: 8, gap: 4, backgroundColor: c.surface }, sidebar: { width: 208, borderRightWidth: 1, borderColor: c.border },
  bottom: { flexDirection: 'row', flexWrap: 'nowrap', borderTopWidth: 1, borderColor: c.border },
  link: { minHeight: 48, padding: 12, color: c.textMuted, borderRadius: 8, fontSize: 14, overflow: 'hidden' },
  bottomLink: { flex: 1, paddingHorizontal: 2, textAlign: 'center', fontSize: 12 },
  active: { color: c.primary, backgroundColor: c.surfaceMuted, fontWeight: '600' },
  menuButton: { minHeight: 44, minWidth: 64, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: c.surfaceMuted },
  menuText: { color: c.primary, fontWeight: '600' },
  drawerLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 10, elevation: 8, flexDirection: 'row' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: c.scrim },
  drawer: { width: 240, height: '100%', zIndex: 11, backgroundColor: c.surface, borderRightWidth: 1, borderColor: c.border },
});
