import { PrismaService } from '../prisma.service';
import { AuditService } from '../common/audit.service';
import { OwnerAssistantService } from './owner-assistant.service';

describe('OwnerAssistantService', () => {
  const prisma = {
    user: { count: jest.fn() },
    trainingSchedule: { count: jest.fn() },
    attendanceReconciliation: { count: jest.fn() },
    guestTrial: { count: jest.fn() },
  } as unknown as PrismaService;
  const audit = { append: jest.fn() } as unknown as AuditService;

  beforeEach(() => {
    jest.mocked(prisma.user.count).mockResolvedValueOnce(12).mockResolvedValueOnce(3);
    jest.mocked(prisma.trainingSchedule.count).mockResolvedValue(8);
    jest.mocked(prisma.attendanceReconciliation.count).mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    jest.mocked(prisma.guestTrial.count).mockResolvedValue(4);
  });

  it('trả về tổng quan với nguồn điều hướng và không lưu nội dung câu hỏi vào audit', async () => {
    const result = await new OwnerAssistantService(prisma, audit).answer('owner-1', 'Tổng quan vận hành hiện tại?');
    expect(result.answer).toContain('12 Member');
    expect(result.sources).toEqual(expect.arrayContaining([expect.objectContaining({ route: '/operations' })]));
    expect(audit.append).toHaveBeenCalledWith('owner-1', 'OWNER_ASSISTANT_QUERIED', 'OWNER_ASSISTANT', 'operational-summary', { intent: 'OVERVIEW' });
  });

  it('nhận diện câu hỏi đối soát không dấu', async () => {
    const result = await new OwnerAssistantService(prisma, audit).answer('owner-1', 'Can doi soat check-in nao?');
    expect(result.intent).toBe('ATTENDANCE');
    expect(result.answer).toContain('3 trường hợp cần chú ý');
  });
});
