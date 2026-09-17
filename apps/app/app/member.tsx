import { RoleHome } from '../src/components/role-home';
import { GuardFallback, useRoleGuard } from '../src/use-role-guard';

export default function Member() {
  const allowed = useRoleGuard('MEMBER');
  return allowed ? <RoleHome role="MEMBER" title="Hành trình của bạn" description="Giữ nhịp tập đều, xem PT phụ trách và theo dõi tiến trình." canCreateAnalysis canViewAnalysis menu={[{ label: 'PT hiện tại', description: 'Người đang đồng hành cùng bạn.', icon: '◎', route: '/people' }, { label: 'Lịch tập', description: 'Khung tập đã được thống nhất.', icon: '▣', route: '/schedules', tone: 'violet' }, { label: 'Check-in', description: 'Xác nhận khi bạn đến phòng.', icon: '✓', route: '/checkins', tone: 'coral' }]} /> : <GuardFallback />;
}
