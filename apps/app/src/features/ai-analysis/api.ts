import { api } from '../../api';
import { AiRun, UploadIntent } from './types';

export async function createUploadIntent(input: { mimeType: string; sizeBytes: number; idempotencyKey: string }): Promise<UploadIntent> {
  const { data } = await api.post<UploadIntent>('/ai-analysis/upload-intent', input);
  return data;
}

export async function confirmUpload(runId: string): Promise<void> {
  await api.post(`/ai-analysis/${runId}/confirm-upload`);
}

export async function analyzeRun(runId: string): Promise<AiRun> {
  const { data } = await api.post<AiRun>(`/ai-analysis/${runId}/analyze`, {}, { timeout: 270_000 });
  return data;
}

export async function getRun(runId: string): Promise<AiRun> {
  const { data } = await api.get<AiRun>(`/ai-analysis/${runId}`);
  return data;
}

export async function getHistory(): Promise<AiRun[]> {
  const { data } = await api.get<AiRun[]>('/ai-analysis');
  return data;
}
