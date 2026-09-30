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
const bottomIcons: Record<string, string> = {
  '/pt': '⌂', '/pt/schedule': '▦',
  '/member': '⌂', '/member/schedule': '▦', '/member/ai': '✦',
};
function NavIcon({ href, active }: { href: string; active: boolean }) {
  const color = active ? c.primary : c.textMuted;
  if (href.endsWith('/account')) return <View style={s.iconFrame}><View style={[s.personHead, { backgroundColor: color }]} /><View style={[s.personBody, { backgroundColor: color }]} /></View>;
  if (href.endsWith('/members')) return <View style={s.iconFrame}><View style={[s.groupHead, { left: 4, backgroundColor: color }]} /><View style={[s.groupHead, { left: 14, backgroundColor: color }]} /><View style={[s.groupBody, { backgroundColor: color }]} /></View>;
  if (href.endsWith('/checkin')) return <View style={s.iconFrame}><View style={[s.qrCell, { top: 3, left: 3, borderColor: color }]} /><View style={[s.qrCell, { top: 3, right: 3, borderColor: color }]} /><View style={[s.qrCell, { bottom: 3, left: 3, borderColor: color }]} /><View style={[s.qrCell, { bottom: 3, right: 3, borderColor: color }]} /></View>;
  return <Text style={[s.icon, active && s.activeText]}>{bottomIcons[href]}</Text>;
}
export function Shell({ role }: { role: Role }) {
  const ready = useRoleGuard(role), { width } = useWindowDimensions(), pathname = usePathname();
  const [ownerMenu, setOwnerMenu] = useState(false);
  if (!ready) return <GuardFallback />;
  const wide = role === 'OWNER' && width >= 900;
  const bottom = !wide && role !== 'OWNER';
  const nav = <View style={[s.nav, wide || role === 'OWNER' ? s.sidebar : s.bottom]}>{menus[role].map(([href, label]) => {
    const active = pathname === href;
    return bottom
      ? <Link asChild href={href as never} key={href}><Pressable accessibilityRole="link" accessibilityLabel={label} accessibilityState={{ selected: active }} style={StyleSheet.flatten([s.bottomLink, active ? s.bottomActive : null])}><NavIcon href={href} active={active} />{active && <Text numberOfLines={1} style={s.activeLabel}>{label}</Text>}</Pressable></Link>
      : <Link onPress={() => setOwnerMenu(false)} href={href as never} key={href} style={[s.link, active && s.active]} accessibilityRole="link">{label}</Link>;
  })}</View>;
  const compactOwner = role === 'OWNER' && !wide;
  return <SafeAreaView style={s.safe}><View style={s.brand}><Text style={s.logo}>F</Text><View style={{ flex: 1 }}><Text style={s.brandText}>FITNESS-MANAGE</Text><Text style={s.subtitle}>{role === 'OWNER' ? 'Quản lý phòng tập' : role === 'PT' ? 'Huấn luyện viên' : 'Hội viên'}</Text></View>{compactOwner && <Pressable accessibilityLabel={ownerMenu ? 'Đóng menu' : 'Mở menu'} accessibilityRole="button" accessibilityState={{ expanded: ownerMenu }} onPress={() => setOwnerMenu(value => !value)} style={s.menuButton}><Text style={s.menuText}>{ownerMenu ? 'Đóng' : 'Menu'}</Text></Pressable>}</View><View style={[s.body, { flexDirection: wide ? 'row' : 'column' }]}>{wide && nav}{compactOwner && ownerMenu && <View accessibilityViewIsModal style={s.drawerLayer}><Pressable accessibilityLabel="Đóng menu" accessibilityRole="button" style={s.backdrop} onPress={() => setOwnerMenu(false)} /><View style={s.drawer}>{nav}</View></View>}<View style={{ flex: 1, minWidth: 0 }}><Slot /></View>{bottom && nav}</View></SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.surface }, body: { flex: 1 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderColor: c.border },
  logo: { color: c.onPrimary, backgroundColor: c.primary, fontSize: 26, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  brandText: { fontSize: 16, fontWeight: '700', color: c.primary }, subtitle: { color: c.textMuted, fontSize: 12, marginTop: 4 },
  nav: { padding: 8, gap: 4, backgroundColor: c.surface }, sidebar: { width: 208, borderRightWidth: 1, borderColor: c.border },
  bottom: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', borderTopWidth: 1, borderColor: c.border },
  link: { minHeight: 48, padding: 12, color: c.textMuted, borderRadius: 8, fontSize: 14, overflow: 'hidden' },
  bottomLink: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 2 },
  bottomActive: { flex: 1.8, backgroundColor: c.surfaceMuted },
  icon: { color: c.textMuted, fontSize: 22, lineHeight: 28, textAlign: 'center' },
  iconFrame: { width: 28, height: 28, position: 'relative' },
  personHead: { position: 'absolute', top: 3, left: 10, width: 8, height: 8, borderRadius: 4 },
  personBody: { position: 'absolute', bottom: 3, left: 5, width: 18, height: 9, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  groupHead: { position: 'absolute', top: 4, width: 8, height: 8, borderRadius: 4 },
  groupBody: { position: 'absolute', bottom: 3, left: 2, width: 24, height: 9, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  qrCell: { position: 'absolute', width: 9, height: 9, borderWidth: 2, borderRadius: 2 },
  activeText: { color: c.primary },
  activeLabel: { color: c.primary, fontSize: 12, fontWeight: '600' },
  active: { color: c.primary, backgroundColor: c.surfaceMuted, fontWeight: '600' },
  menuButton: { minHeight: 44, minWidth: 64, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: c.surfaceMuted },
  menuText: { color: c.primary, fontWeight: '600' },
  drawerLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 10, elevation: 8, flexDirection: 'row' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: c.scrim },
  drawer: { width: 240, height: '100%', zIndex: 11, backgroundColor: c.surface, borderRightWidth: 1, borderColor: c.border },
});
