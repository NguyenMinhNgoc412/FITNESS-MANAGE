import { useRouter } from 'expo-router';
import { logout } from '../api';
import { Card, Label, LoadState, Page } from '../ui';
import { Form } from '../components/form';
import { useLoad } from '../hooks/use-load';
import { useAuthStore } from '../store/auth';
import { MemberServices } from './member-services';
import { Person } from '../models';
import { NotificationSettings } from '../components/notification-settings';
export default function Account() {
  const role = useAuthStore(s => s.session?.user.role);
  const state = useLoad<Person>('/auth/me'), router = useRouter();
  return <Page title="Tài khoản"><LoadState state={state} /><Card title={state.data?.profile?.fullName ?? 'Hồ sơ'}>
    <Label>SĐT: {state.data?.phone ?? '—'}</Label><Label>CCCD: {state.data?.profile?.cccd ?? 'Chưa cập nhật'}</Label><Label muted>Liên hệ chủ phòng tập để cập nhật thông tin chính thức.</Label>
  </Card>{role === 'MEMBER' && <MemberServices />}<NotificationSettings /><Form fields={[]} label="Đăng xuất" submit={async () => { await logout(); router.replace('/login'); }} /></Page>;
}
