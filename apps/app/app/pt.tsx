import { RoleHome } from '../src/components/role-home';
import { useRoleGuard } from '../src/use-role-guard';

export default function Pt() {
  const allowed = useRoleGuard('PT');
  return allowed ? <RoleHome title="Khu vực PT" description="Xem dữ liệu Member trong phạm vi assignment đang hoạt động." canViewAnalysis menu={[{ label: 'Member đang phụ trách', route: '/people' }, { label: 'Lịch tập', route: '/schedules' }, { label: 'Check-in của tôi', route: '/checkins' }]} /> : null;
}
