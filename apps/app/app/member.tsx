import { RoleHome } from '../src/components/role-home';
import { useRoleGuard } from '../src/use-role-guard';

export default function Member() {
  const allowed = useRoleGuard('MEMBER');
  return allowed ? <RoleHome title="Khu vực Member" description="Xem thông tin và sử dụng các chức năng dành cho hội viên." canCreateAnalysis canViewAnalysis menu={[{ label: 'PT hiện tại', route: '/people' }, { label: 'Lịch tập', route: '/schedules' }, { label: 'Check-in của tôi', route: '/checkins' }]} /> : null;
}
