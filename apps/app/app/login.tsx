import { useRouter } from 'expo-router';
import { z } from 'zod';
import { api } from '../src/api';
import { Form, Page, Card, Label } from '../src/ui';
import { roleRoute, sessionSchema } from '../src/features/auth/types';
import { useAuthStore } from '../src/store/auth';
export default function Login() {
  const router = useRouter();
  return <Page title="FITNESS-MANAGE" subtitle="Quản lý phòng tập, kết nối mỗi buổi tập."><Card title="Đăng nhập"><Label muted>Dùng tài khoản do chủ phòng tập cấp.</Label>
    <Form fields={[{ name: 'phone', label: 'Số điện thoại', numeric: true }, { name: 'password', label: 'Mật khẩu', secret: true }]} schema={z.object({ phone: z.string().min(10), password: z.string().min(1) })} label="Đăng nhập" submit={async input => {
      const { data } = await api.post('/auth/login', input); const session = sessionSchema.parse(data);
      await useAuthStore.getState().setSession(session); router.replace(roleRoute(session.user.role));
    }} />
  </Card></Page>;
}
