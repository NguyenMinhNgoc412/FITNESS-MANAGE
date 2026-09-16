import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { AiRunStatus, AssignmentStatus, Prisma, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../prisma.service';
import { AiClientService } from './ai-client.service';
import { isStructuredPoseResult, isTrainingPlan, StructuredPoseResult } from './contracts';
import { CreateUploadIntentDto } from './dto';
import { PrivateMediaStorage } from './storage.service';
@Injectable()
export class AiAnalysisService {
  constructor(private readonly prisma: PrismaService, private readonly storage: PrivateMediaStorage, private readonly ai: AiClientService, private readonly audit: AuditService) {}
  async createUploadIntent(memberId: string, dto: CreateUploadIntentDto) {
    const prior = await this.prisma.aiAnalysisRun.findUnique({ where: { idempotencyKey: dto.idempotencyKey } });
    if (prior) {
      if (prior.memberId !== memberId) throw new ConflictException('Idempotency key đã được dùng bởi Member khác.');
      const upload = prior.status === AiRunStatus.UPLOAD_PENDING ? await this.storage.createUploadAuthorization(prior.mediaPath) : undefined;
      return { runId: prior.id, status: prior.status, upload, idempotentReplay: true };
    }
    const configuredMax = Number(process.env.AI_MAX_UPLOAD_BYTES);
    if (!Number.isSafeInteger(configuredMax) || configuredMax <= 0) throw new ServiceUnavailableException('Giới hạn upload AI chưa được cấu hình.');
    if (dto.sizeBytes > configuredMax) throw new BadRequestException('Video vượt quá giới hạn upload đã cấu hình.');
    const runId = randomUUID(); const extension = dto.mimeType === 'video/mp4' ? 'mp4' : dto.mimeType === 'video/webm' ? 'webm' : 'mov';
    const mediaPath = `members/${memberId}/${runId}/body-video.${extension}`;
    const run = await this.prisma.aiAnalysisRun.create({ data: { id: runId, memberId, mediaPath, mimeType: dto.mimeType, sizeBytes: dto.sizeBytes, idempotencyKey: dto.idempotencyKey, correlationId: randomUUID(), pipelineVersion: process.env.AI_PIPELINE_VERSION ?? '1.0.0' } });
    await this.audit.append(memberId, 'AI_ANALYSIS_RUN_CREATED', 'AI_ANALYSIS_RUN', runId, { mimeType: dto.mimeType, sizeBytes: dto.sizeBytes, pipelineVersion: run.pipelineVersion });
    try { return { runId, status: run.status, upload: await this.storage.createUploadAuthorization(mediaPath), idempotentReplay: false }; }
    catch (error) { await this.prisma.aiAnalysisRun.update({ where: { id: runId }, data: { status: AiRunStatus.FAILED, errorCode: 'UPLOAD_AUTH_FAILED' } }); throw error; }
  }
  async confirmUpload(actorId: string, runId: string) {
    const run = await this.requireScope(actorId, Role.MEMBER, runId);
    if (run.status !== AiRunStatus.UPLOAD_PENDING && run.status !== AiRunStatus.UPLOADED) throw new BadRequestException('Analysis run không ở trạng thái chờ upload.');
    await this.storage.assertUploaded(run.mediaPath);
    const updated = await this.prisma.aiAnalysisRun.update({ where: { id: runId }, data: { status: AiRunStatus.UPLOADED, errorCode: null } });
    await this.audit.append(actorId, 'AI_UPLOAD_CONFIRMED', 'AI_ANALYSIS_RUN', runId, { status: updated.status });
    return updated;
  }
  async analyze(actorId: string, role: Role, runId: string) {
    const run = await this.requireScope(actorId, role, runId);
    if (run.status === AiRunStatus.COMPLETED) return this.get(actorId, role, runId);
    if (run.result && !run.plan) return this.generateFromStoredResult(actorId, run);
    if (run.status !== AiRunStatus.UPLOADED) throw new BadRequestException('Analysis run chưa sẵn sàng để xử lý.');
    const claim = await this.prisma.aiAnalysisRun.updateMany({ where: { id: runId, status: AiRunStatus.UPLOADED }, data: { status: AiRunStatus.VALIDATING, errorCode: null } });
    if (claim.count !== 1) throw new ConflictException('Analysis run đang được xử lý bởi yêu cầu khác.');
    try {
      const mediaUrl = await this.storage.createDownloadUrl(run.mediaPath);
      const structured = await this.ai.analyzePose(mediaUrl, run.correlationId);
      if (!isStructuredPoseResult(structured)) throw new Error('INVALID_STRUCTURED_RESULT');
      await this.prisma.aiAnalysisResult.create({ data: this.structuredData(runId, structured) });
      if (structured.inputQuality.status !== 'VALID') {
        await this.prisma.aiAnalysisRun.update({ where: { id: runId }, data: { status: AiRunStatus.NEEDS_RETAKE, errorCode: 'INPUT_QUALITY' } });
        return this.get(actorId, role, runId);
      }
    } catch (error) {
      await this.prisma.aiAnalysisRun.update({ where: { id: runId }, data: { status: AiRunStatus.FAILED, errorCode: error instanceof Error && error.message === 'INVALID_STRUCTURED_RESULT' ? 'INVALID_STRUCTURED_RESULT' : 'PIPELINE_FAILED' } });
      throw error;
    }
    const refreshed = await this.prisma.aiAnalysisRun.findUniqueOrThrow({ where: { id: runId }, include: { member: true, result: true, plan: true } });
    return this.generateFromStoredResult(actorId, refreshed);
  }
  async retryGeneration(actorId: string, role: Role, runId: string) {
    const run = await this.requireScope(actorId, role, runId);
    if (!run.result) throw new BadRequestException('Chưa có structured result hợp lệ để retry generation.');
    if (run.plan) return this.get(actorId, role, runId);
    return this.generateFromStoredResult(actorId, run);
  }
  async get(actorId: string, role: Role, runId: string) { return this.requireScope(actorId, role, runId); }
  async history(actorId: string, role: Role) {
    const where = role === Role.OWNER_ADMIN ? {} : role === Role.MEMBER ? { memberId: actorId } : { member: { assignments: { some: { ptId: actorId, status: AssignmentStatus.ACTIVE } } } };
    return this.prisma.aiAnalysisRun.findMany({ where, include: { result: true, plan: true }, orderBy: { createdAt: 'desc' } });
  }
  private async generateFromStoredResult(actorId: string, run: Awaited<ReturnType<AiAnalysisService['requireScope']>>) {
    if (!run.result) throw new BadRequestException('Structured result phải tồn tại trước generation.');
    const structured = this.toStructured(run.result);
    if (!isStructuredPoseResult(structured) || structured.inputQuality.status !== 'VALID') throw new BadRequestException('Structured result không đủ điều kiện generation.');
    const claim = await this.prisma.aiAnalysisRun.updateMany({ where: { id: run.id, status: { in: [AiRunStatus.VALIDATING, AiRunStatus.FAILED] } }, data: { status: AiRunStatus.ANALYZING, errorCode: null } });
    if (claim.count !== 1) throw new ConflictException('Kế hoạch đang được tạo bởi yêu cầu khác.');
    try {
      const plan = await this.ai.generatePlan(structured, run.member.goal, run.correlationId);
      if (!isTrainingPlan(plan)) throw new Error('INVALID_PLAN_OUTPUT');
      await this.prisma.$transaction(async (tx) => {
        await tx.trainingPlanOutput.create({ data: { analysisRunId: run.id, summary: plan.summary, focusAreas: plan.focusAreas as Prisma.InputJsonValue, recommendations: plan.recommendations as Prisma.InputJsonValue, trainingPlan: plan.trainingPlan as Prisma.InputJsonValue, limitations: plan.limitations as Prisma.InputJsonValue, safetyFlags: plan.safetyFlags as Prisma.InputJsonValue, promptVersion: plan.promptVersion, modelVersion: plan.modelVersion } });
        await tx.aiAnalysisRun.update({ where: { id: run.id }, data: { status: AiRunStatus.COMPLETED, completedAt: new Date(), errorCode: null } });
        await this.audit.append(actorId, 'AI_ANALYSIS_COMPLETED', 'AI_ANALYSIS_RUN', run.id, { pipelineVersion: run.pipelineVersion, schemaVersion: structured.schemaVersion, analyzerVersion: structured.analyzerVersion, modelVersion: plan.modelVersion }, tx);
      });
      return this.prisma.aiAnalysisRun.findUniqueOrThrow({ where: { id: run.id }, include: { result: true, plan: true } });
    } catch (error) {
      const existing = await this.prisma.trainingPlanOutput.findUnique({ where: { analysisRunId: run.id }, select: { id: true } });
      if (existing) return this.prisma.aiAnalysisRun.findUniqueOrThrow({ where: { id: run.id }, include: { result: true, plan: true } });
      await this.prisma.aiAnalysisRun.updateMany({ where: { id: run.id, status: AiRunStatus.ANALYZING }, data: { status: AiRunStatus.FAILED, errorCode: error instanceof Error && error.message === 'INVALID_PLAN_OUTPUT' ? 'INVALID_PLAN_OUTPUT' : 'GENERATION_FAILED' } });
      throw error;
    }
  }
  private async requireScope(actorId: string, role: Role, runId: string) {
    const run = await this.prisma.aiAnalysisRun.findUnique({ where: { id: runId }, include: { member: true, result: true, plan: true } });
    if (!run) throw new NotFoundException('Không tìm thấy analysis run.');
    if (role === Role.MEMBER && run.memberId !== actorId) throw new ForbiddenException('Không có quyền xem analysis run này.');
    if (role === Role.PT) {
      const scope = await this.prisma.assignment.findFirst({ where: { memberId: run.memberId, ptId: actorId, status: AssignmentStatus.ACTIVE }, select: { id: true } });
      if (!scope) throw new ForbiddenException('Không có quyền xem analysis run này.');
    }
    return run;
  }
  private structuredData(runId: string, value: StructuredPoseResult) { return { analysisRunId: runId, inputQuality: value.inputQuality as Prisma.InputJsonValue, extractedFeatures: value.pose as Prisma.InputJsonValue, confidence: value.confidence as Prisma.InputJsonValue, warnings: value.warnings as Prisma.InputJsonValue, schemaVersion: value.schemaVersion, analyzerVersion: value.analyzerVersion }; }
  private toStructured(result: { inputQuality: Prisma.JsonValue; extractedFeatures: Prisma.JsonValue; confidence: Prisma.JsonValue; warnings: Prisma.JsonValue; schemaVersion: string; analyzerVersion: string }): StructuredPoseResult { return { schemaVersion: result.schemaVersion, inputQuality: result.inputQuality as StructuredPoseResult['inputQuality'], pose: result.extractedFeatures as StructuredPoseResult['pose'], confidence: result.confidence as StructuredPoseResult['confidence'], warnings: result.warnings as string[], analyzerVersion: result.analyzerVersion }; }
}
