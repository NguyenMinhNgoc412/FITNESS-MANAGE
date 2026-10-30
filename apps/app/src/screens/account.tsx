import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { api, logout } from '../api';
import { Card, Label, LoadState, Page } from '../ui';
import { Form } from '../components/form';
import { useLoad } from '../hooks/use-load';
import { useAuthStore } from '../store/auth';
import { MemberServices } from './member-services';
import { Person } from '../models';
export default function Account() {
  const role = useAuthStore(s => s.session?.user.role);
  const state = useLoad<Person>('/auth/me'), router = useRouter();
  return <Page title="Tài khoản"><LoadState state={state} /><Card title={state.data?.profile?.fullName ?? 'Hồ sơ'}>
    <Label>SĐT: {state.data?.phone ?? '—'}</Label><Label>CCCD: {state.data?.profile?.cccd ?? 'Chưa cập nhật'}</Label><Label muted>Liên hệ chủ phòng tập để cập nhật thông tin chính thức.</Label>
  </Card>{role === 'MEMBER' && <MemberServices />}<Card title="Thông báo"><Form fields={[]} label="Cho phép thông báo" submit={async () => {
    if (Platform.OS === 'web') throw { response: { data: { message: 'Thông báo push khả dụng trên ứng dụng điện thoại. Bạn có thể xem yêu cầu trực tiếp trong app.' } } };
    const permission = await Notifications.requestPermissionsAsync();
    if (permission.status !== 'granted') throw { response: { data: { message: 'Chưa được cấp quyền thông báo. Bật quyền trong cài đặt thiết bị.' } } };
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('default', { name: 'Lịch và xác nhận', importance: Notifications.AndroidImportance.DEFAULT });
    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    if (!projectId) throw { response: { data: { message: 'Ứng dụng chưa được cấu hình thông báo push.' } } };
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.post('/notifications/device-token', { token });
  }} /></Card><Form fields={[]} label="Đăng xuất" submit={async () => { await logout(); router.replace('/login'); }} /></Page>;
}
