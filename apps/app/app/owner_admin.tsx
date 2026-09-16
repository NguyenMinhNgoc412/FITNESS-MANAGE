import { RoleHome } from '../src/components/role-home';
import { useRoleGuard } from '../src/use-role-guard';

export default function Owner() {
  const allowed = useRoleGuard('OWNER_ADMIN');
  return allowed ? <RoleHome title="Khu vực Owner/Admin" description="Quản lý vận hành và dữ liệu trong phạm vi được cấp quyền." canViewAnalysis menu={[{ label: 'PT và Member', route: '/people' }, { label: 'Lịch tập', route: '/schedules' }, { label: 'Guest, điểm danh và audit', route: '/operations' }]} /> : null;
}
