import { RoleHome } from '../src/components/role-home';
import { GuardFallback, useRoleGuard } from '../src/use-role-guard';

export default function Owner() {
  const allowed = useRoleGuard('OWNER_ADMIN');
  return allowed ? <RoleHome role="OWNER_ADMIN" title="Vận hành & đối soát" description="Một nơi để theo dõi con người, lịch tập và các việc cần chú ý." canViewAnalysis menu={[{ label: 'Trợ lý AI', description: 'Hỏi nhanh số liệu vận hành có nguồn dữ liệu.', icon: '◌', route: '/owner-assistant', tone: 'violet' }, { label: 'PT và Member', description: 'Tạo, cập nhật và theo dõi assignment.', icon: '◎', route: '/people' }, { label: 'Lịch tập', description: 'Xem và quản lý các khung tập.', icon: '▣', route: '/schedules', tone: 'violet' }, { label: 'Vận hành', description: 'Guest, điểm danh và audit.', icon: '✦', route: '/operations', tone: 'coral' }]} /> : <GuardFallback />;
}
