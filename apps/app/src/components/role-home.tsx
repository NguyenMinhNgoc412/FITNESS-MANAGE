import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { logout } from '../api';
import { AppButton, Card, Screen, colors, spacing, typography } from '../design-system';

type MenuItem = { label: string; route: '/people' | '/schedules' | '/checkins' | '/operations' };
type Props = { title: string; description: string; canViewAnalysis?: boolean; canCreateAnalysis?: boolean; menu: MenuItem[] };

export function RoleHome({ title, description, canViewAnalysis, canCreateAnalysis, menu }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const signOut = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // Session local đã được xóa trong logout(); vẫn chuyển về màn hình đăng nhập.
    } finally {
      setLoggingOut(false);
      router.replace('/login');
    }
  };
  return (
    <Screen
      title={title}
      subtitle={description}
      headerAction={<AppButton label="Đăng xuất" variant="secondary" loading={loggingOut} onPress={() => void signOut()} />}
    >
      <Card>
        <Text style={styles.heading}>Quản lý</Text>
        <Text style={styles.body}>Chọn nghiệp vụ cần thực hiện.</Text>
        <View style={styles.actions}>
          {menu.map((item) => <AppButton key={item.label} label={item.label} variant="secondary" onPress={() => router.push(item.route)} />)}
        </View>
      </Card>
      <Card>
        <Text style={styles.heading}>Phân tích cơ thể</Text>
        <Text style={styles.body}>Theo dõi kết quả phân tích trong phạm vi tài khoản được cấp quyền.</Text>
        {canCreateAnalysis ? <AppButton label="Tạo phân tích mới" onPress={() => router.push('/ai-analysis')} /> : null}
        {canViewAnalysis ? <AppButton label="Xem lịch sử phân tích" variant="secondary" onPress={() => router.push('/ai-history')} /> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { ...typography.heading, color: colors.text },
  body: { ...typography.body, color: colors.textMuted, marginBottom: spacing.xs },
  actions: { gap: spacing.sm },
});
