import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, Feedback, colors, spacing, typography } from '../design-system';

export type DataListKind = 'person' | 'schedule' | 'attendance' | 'checkin' | 'guest' | 'audit';
type Props = { kind: DataListKind; items: Record<string, unknown>[]; empty?: string; renderAction?: (item: Record<string, unknown>) => ReactNode };

export function DataList({ kind, items, empty = 'Chưa có dữ liệu.', renderAction }: Props) {
  if (!items.length) return <Feedback message={empty} />;
  return <View style={styles.list}>{items.map((item, index) => <DataRow key={String(item.id ?? index)} kind={kind} item={item} action={renderAction?.(item)} />)}</View>;
}

function DataRow({ item, kind, action }: { item: Record<string, unknown>; kind: DataListKind; action?: ReactNode }) {
  const schedule = objectValue(item.schedule);
  const name = titleFor(item, schedule, kind);
  const status = item.attendanceStatus ?? item.status;
  const details = detailsFor(item, schedule, kind);
  return <Card style={styles.card}>
    <View style={styles.top}><View style={[styles.avatar, kind === 'schedule' && styles.scheduleAvatar]}><Text style={styles.avatarText}>{kind === 'schedule' ? '▣' : name.charAt(0).toUpperCase()}</Text></View><View style={styles.titleBlock}><Text style={styles.name}>{name}</Text>{item.goal ? <Text style={styles.goal}>{String(item.goal)}</Text> : null}</View>{status ? <StatusPill value={String(status)} /> : null}</View>
    {details.length ? <View style={styles.meta}>{details.map(([key, value]) => <Text key={key} style={styles.row}><Text style={styles.label}>{label(key)}: </Text>{format(value)}</Text>)}</View> : null}
    {action ? <View style={styles.actions}>{action}</View> : null}
  </Card>;
}

function objectValue(value: unknown): Record<string, unknown> | undefined { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined; }
function titleFor(item: Record<string, unknown>, schedule: Record<string, unknown> | undefined, kind: DataListKind) {
  if (kind === 'schedule' || kind === 'attendance') { const start = schedule?.windowStart ?? item.windowStart; return start ? new Date(String(start)).toLocaleString('vi-VN', { weekday: 'short', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : kind === 'attendance' ? 'Đối soát buổi tập' : 'Buổi tập'; }
  if (kind === 'checkin') return `Check-in ${String(item.actorRole ?? '')}`.trim();
  if (kind === 'guest') return String(item.displayName ?? 'Guest / Trial');
  return String(item.fullName ?? item.displayName ?? item.action ?? 'Bản ghi vận hành');
}
function detailsFor(item: Record<string, unknown>, schedule: Record<string, unknown> | undefined, kind: DataListKind): [string, unknown][] {
  if (schedule) return [['windowStart', schedule.windowStart], ['windowEnd', schedule.windowEnd], ['memberId', schedule.memberId], ['ptId', schedule.ptId]].filter((entry) => entry[1]) as [string, unknown][];
  const preferred = kind === 'schedule' ? ['memberName', 'memberPhone', 'ptName', 'windowStart'] : kind === 'checkin' ? ['checkedInAt', 'actorRole', 'scheduleId'] : kind === 'person' ? ['email', 'phone', 'specialization', 'goal', 'assignedAt', 'createdAt'] : kind === 'guest' ? ['phone', 'email', 'trialAt', 'convertedAt'] : ['entityType', 'createdAt', 'trialAt', 'phone'];
  return preferred.filter((key) => item[key] !== null && item[key] !== undefined).slice(0, 5).map((key) => [key, item[key]]);
}

function StatusPill({ value }: { value: string }) {
  const normalized = value.toUpperCase();
  const tone = normalized === 'MATCHED' || normalized === 'ACTIVE' || normalized === 'COMPLETED' ? 'good' : normalized === 'MEMBER_ONLY' || normalized === 'PT_ONLY' || normalized === 'NEEDS_REVIEW' || normalized === 'NEEDS_RETAKE' ? 'warn' : 'neutral';
  return <View style={[styles.pill, styles[`${tone}Pill`]]}><Text style={[styles.pillText, styles[`${tone}Text`]]}>{statusLabel(normalized)}</Text></View>;
}

function label(key: string) {
  return ({ email: 'Email', phone: 'Điện thoại', goal: 'Mục tiêu', specialization: 'Chuyên môn', assignedAt: 'Giao từ', windowStart: 'Giờ tập', windowEnd: 'Kết thúc', windowType: 'Loại khung', memberName: 'Khách', memberPhone: 'Điện thoại', ptName: 'PT', memberId: 'Mã Member', ptId: 'Mã PT', scheduleId: 'Lịch', actorRole: 'Vai trò', checkedInAt: 'Đã check-in', entityType: 'Loại dữ liệu', createdAt: 'Tạo lúc', trialAt: 'Ngày tập thử', convertedAt: 'Đã chuyển đổi' } as Record<string, string>)[key] ?? key;
}
function statusLabel(value: string) { return ({ MATCHED: 'ĐÃ KHỚP', MEMBER_ONLY: 'CHỈ MEMBER', PT_ONLY: 'CHỈ PT', NEEDS_REVIEW: 'CẦN XEM XÉT', MISSING: 'CHƯA CÓ MẶT', ACTIVE: 'ĐANG HOẠT ĐỘNG', COMPLETED: 'HOÀN THÀNH', CANCELLED: 'ĐÃ HỦY', NEEDS_RETAKE: 'CẦN QUAY LẠI' } as Record<string, string>)[value] ?? value; }
function format(value: unknown) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Date(value).toLocaleString('vi-VN');
  return String(value);
}
const styles = StyleSheet.create({ list: { gap: spacing.md }, card: { gap: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.primary }, top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAccent, alignItems: 'center', justifyContent: 'center' }, scheduleAvatar: { backgroundColor: colors.violetSurface }, avatarText: { ...typography.bodyStrong, color: colors.primary }, titleBlock: { flex: 1, gap: 2 }, name: { ...typography.bodyStrong, color: colors.text }, goal: { ...typography.caption, color: colors.textMuted }, meta: { borderTopWidth: 1, borderColor: colors.border, paddingTop: spacing.sm, gap: spacing.xs }, row: { ...typography.caption, color: colors.textMuted }, label: { color: colors.text, fontWeight: '600' }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, pill: { paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 999, maxWidth: 132 }, pillText: { ...typography.label, fontSize: 10, textAlign: 'center' }, goodPill: { backgroundColor: colors.successSurface }, goodText: { color: colors.success }, warnPill: { backgroundColor: colors.warningSurface }, warnText: { color: colors.warning }, neutralPill: { backgroundColor: colors.slateSurface }, neutralText: { color: colors.slateText } });
