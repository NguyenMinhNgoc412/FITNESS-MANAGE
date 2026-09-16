import { AiRunStatus } from '@prisma/client';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../prisma.service';
import { AiAnalysisService } from './ai-analysis.service';
import { AiClientService } from './ai-client.service';
import { PrivateMediaStorage } from './storage.service';
describe('AiAnalysisService', () => {
  beforeEach(() => { process.env.AI_MAX_UPLOAD_BYTES = '1000'; });
  it('retry upload intent không tạo analysis run thứ hai', async () => {
    const run = { id: 'run-1', memberId: 'member-1', status: AiRunStatus.UPLOAD_PENDING, mediaPath: 'members/member-1/run-1/body.mp4' };
    const prisma = { aiAnalysisRun: { findUnique: jest.fn().mockResolvedValue(run), create: jest.fn() } } as unknown as PrismaService;
    const storage = { createUploadAuthorization: jest.fn().mockResolvedValue({ path: run.mediaPath, token: 'signed-token', bucket: 'body-videos' }) } as unknown as PrivateMediaStorage;
    const service = new AiAnalysisService(prisma, storage, {} as AiClientService, {} as AuditService);
    await expect(service.createUploadIntent('member-1', { mimeType: 'video/mp4', sizeBytes: 100, idempotencyKey: 'upload-request-1' })).resolves.toEqual(expect.objectContaining({ runId: 'run-1', idempotentReplay: true }));
    expect(prisma.aiAnalysisRun.create).not.toHaveBeenCalled();
  });
  it('từ chối cấp upload intent khi Owner chưa cấu hình giới hạn dung lượng', async () => {
    delete process.env.AI_MAX_UPLOAD_BYTES;
    const prisma = { aiAnalysisRun: { findUnique: jest.fn().mockResolvedValue(null) } } as unknown as PrismaService;
    const service = new AiAnalysisService(prisma, {} as PrivateMediaStorage, {} as AiClientService, {} as AuditService);
    await expect(service.createUploadIntent('member-1', { mimeType: 'video/mp4', sizeBytes: 100, idempotencyKey: 'upload-request-2' })).rejects.toThrow('Giới hạn upload AI chưa được cấu hình.');
  });
  it('từ chối video vượt giới hạn đã cấu hình trước khi tạo run', async () => {
    const prisma = { aiAnalysisRun: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() } } as unknown as PrismaService;
    const service = new AiAnalysisService(prisma, {} as PrivateMediaStorage, {} as AiClientService, {} as AuditService);
    await expect(service.createUploadIntent('member-1', { mimeType: 'video/mp4', sizeBytes: 1001, idempotencyKey: 'upload-request-3' })).rejects.toThrow('Video vượt quá giới hạn upload đã cấu hình.');
    expect((prisma as unknown as { aiAnalysisRun: { create: jest.Mock } }).aiAnalysisRun.create).not.toHaveBeenCalled();
  });
});
