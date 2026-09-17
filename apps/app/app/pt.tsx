import { RoleHome } from '../src/components/role-home';
import { GuardFallback, useRoleGuard } from '../src/use-role-guard';

export default function Pt() {
  const allowed = useRoleGuard('PT');
  return allowed ? <RoleHome role="PT" title="Nhịp tập hôm nay" description="Theo dõi Member đang phụ trách và giữ lịch tập đúng nhịp." canViewAnalysis menu={[{ label: 'Member phụ trách', description: 'Danh sách assignment đang hiệu lực.', icon: '◎', route: '/people' }, { label: 'Lịch tập', description: 'Các khung tập liên quan đến bạn.', icon: '▣', route: '/schedules', tone: 'violet' }, { label: 'Check-in', description: 'Xác nhận có mặt tại phòng.', icon: '✓', route: '/checkins', tone: 'coral' }]} /> : <GuardFallback />;
}
