import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StructuredPoseResult, TrainingPlan } from './contracts';
@Injectable()
export class AiClientService {
  constructor(private readonly config: ConfigService) {}
  analyzePose(mediaUrl: string, correlationId: string): Promise<StructuredPoseResult> { return this.post('/v1/analyze/pose', { mediaUrl, correlationId }); }
  generatePlan(structuredResult: StructuredPoseResult, goal: string, correlationId: string): Promise<TrainingPlan> { return this.post('/v1/generate/plan', { structuredResult, goal, correlationId }); }
  private async post<T>(path: string, body: unknown): Promise<T> {
    const baseUrl = this.config.get<string>('AI_SERVICE_URL'); const token = this.config.get<string>('AI_SERVICE_TOKEN');
    if (!baseUrl || !token) throw new ServiceUnavailableException('AI service chưa được cấu hình.');
    const response = await fetch(`${baseUrl}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-internal-token': token }, body: JSON.stringify(body), signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new ServiceUnavailableException(`AI service failed: ${response.status}`);
    return response.json() as Promise<T>;
  }
}
