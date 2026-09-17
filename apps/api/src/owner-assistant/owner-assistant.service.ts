import { Injectable } from '@nestjs/common';
import { AccountStatus, AttendanceStatus, Role } from '@prisma/client';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../prisma.service';

type AssistantIntent = 'OVERVIEW' | 'ATTENDANCE' | 'MEMBERS' | 'PTS' | 'GUESTS';
type Source = { label: string; route: '/people' | '/schedules' | '/operations' };
type Snapshot = { activeMembers: number; activePts: number; scheduledSessions: number; memberOnly: number; needsReview: number; unconvertedGuests: number };

@Injectable()
export class OwnerAssistantService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async answer(actorId: string, question: string) {
    const intent = this.detectIntent(question);
    const snapshot = await this.snapshot();
    await this.audit.append(actorId, 'OWNER_ASSISTANT_QUERIED', 'OWNER_ASSISTANT', 'operational-summary', { intent });
    return {
      answer: this.message(intent, snapshot),
      intent,
      scope: { label: 'Dữ liệu vận hành hiện tại' },
      sources: this.sources(intent),
      generatedAt: new Date().toISOString(),
    };
  }

  private async snapshot(): Promise<Snapshot> {
    const [activeMembers, activePts, scheduledSessions, memberOnly, needsReview, unconvertedGuests] = await Promise.all([
      this.prisma.user.count({ where: { role: Role.MEMBER, status: AccountStatus.ACTIVE } }),
      this.prisma.user.count({ where: { role: Role.PT, status: AccountStatus.ACTIVE } }),
      this.prisma.trainingSchedule.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.attendanceReconciliation.count({ where: { status: AttendanceStatus.MEMBER_ONLY } }),
      this.prisma.attendanceReconciliation.count({ where: { status: AttendanceStatus.NEEDS_REVIEW } }),
      this.prisma.guestTrial.count({ where: { convertedMemberId: null } }),
    ]);
    return { activeMembers, activePts, scheduledSessions, memberOnly, needsReview, unconvertedGuests };
  }

  private detectIntent(question: string): AssistantIntent {
    const text = question.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (/(checkin|check-in|diem danh|doi soat|vang|attendance)/.test(text)) return 'ATTENDANCE';
    if (/(guest|khach|trial|tap thu)/.test(text)) return 'GUESTS';
    if (/(thanh vien|member)/.test(text)) return 'MEMBERS';
    if (/(\bpt\b|huan luyen vien)/.test(text)) return 'PTS';
    return 'OVERVIEW';
  }

  private message(intent: AssistantIntent, data: Snapshot) {
    const exceptions = data.memberOnly + data.needsReview;
    if (intent === 'ATTENDANCE') return `Hiện có ${exceptions} trường hợp cần chú ý: ${data.memberOnly} Member đã có mặt nhưng chưa có bằng chứng PT hợp lệ và ${data.needsReview} lịch đang cần đối soát. Mở Vận hành để xem từng bản ghi.`;
    if (intent === 'GUESTS') return `Hiện có ${data.unconvertedGuests} Guest/Trial chưa chuyển thành Member. Mở Vận hành để xem danh sách và tiếp nhận hoặc chuyển đổi theo quy trình.`;
    if (intent === 'MEMBERS') return `Hiện có ${data.activeMembers} Member đang hoạt động và ${data.scheduledSessions} lịch tập ở trạng thái đã lên lịch. Mở PT và Member để xem assignment, hồ sơ và lịch liên quan.`;
    if (intent === 'PTS') return `Hiện có ${data.activePts} PT đang hoạt động. Có ${data.scheduledSessions} lịch tập ở trạng thái đã lên lịch để theo dõi cùng danh sách Member được giao.`;
    return `Tổng quan hiện tại: ${data.activeMembers} Member đang hoạt động, ${data.activePts} PT đang hoạt động và ${data.scheduledSessions} lịch đã lên lịch. Có ${exceptions} trường hợp check-in cần chú ý và ${data.unconvertedGuests} Guest/Trial chưa chuyển đổi.`;
  }

  private sources(intent: AssistantIntent): Source[] {
    if (intent === 'ATTENDANCE') return [{ label: 'Vận hành và đối soát', route: '/operations' }, { label: 'Lịch tập', route: '/schedules' }];
    if (intent === 'GUESTS') return [{ label: 'Vận hành và Guest', route: '/operations' }];
    if (intent === 'MEMBERS' || intent === 'PTS') return [{ label: 'PT và Member', route: '/people' }, { label: 'Lịch tập', route: '/schedules' }];
    return [{ label: 'PT và Member', route: '/people' }, { label: 'Lịch tập', route: '/schedules' }, { label: 'Vận hành', route: '/operations' }];
  }
}
