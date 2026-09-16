import { StyleSheet, Text, View } from 'react-native';
import { Card, Feedback, colors, spacing, typography } from '../design-system';

export function DataList({ items, empty = 'Chưa có dữ liệu.' }: { items: Record<string, unknown>[]; empty?: string }) {
  if (!items.length) return <Feedback message={empty} />;
  return <View style={styles.list}>{items.map((item, index) => (
    <Card key={String(item.id ?? index)}>
      {Object.entries(item).filter(([, value]) => value !== null && value !== undefined && typeof value !== 'object').map(([key, value]) => (
        <Text key={key} style={styles.row}><Text style={styles.label}>{label(key)}: </Text>{format(value)}</Text>
      ))}
    </Card>
  ))}</View>;
}

function label(key: string) {
  return ({ fullName: 'Họ tên', email: 'Email', phone: 'Điện thoại', status: 'Trạng thái', goal: 'Mục tiêu', displayName: 'Tên', windowStart: 'Bắt đầu', windowEnd: 'Kết thúc', checkedInAt: 'Check-in', action: 'Hành động', entityType: 'Loại dữ liệu', createdAt: 'Tạo lúc', trialAt: 'Ngày tập thử' } as Record<string, string>)[key] ?? key;
}
function format(value: unknown) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Date(value).toLocaleString('vi-VN');
  return String(value);
}
const styles = StyleSheet.create({ list: { gap: spacing.md }, row: { ...typography.body, color: colors.text }, label: { fontWeight: '700' } });
