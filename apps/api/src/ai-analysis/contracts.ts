export type StructuredPoseResult = {
  schemaVersion: string;
  inputQuality: { status: 'VALID' | 'NEEDS_RETAKE' | 'INSUFFICIENT'; reasons: string[] };
  pose: { features: Record<string, unknown>; keypoints: unknown[]; derivedMetrics: Record<string, unknown> };
  confidence: Record<string, unknown>;
  warnings: string[];
  analyzerVersion: string;
};
export type TrainingPlan = {
  summary: string;
  focusAreas: string[];
  recommendations: string[];
  trainingPlan: { phases: unknown[] };
  limitations: string[];
  safetyFlags: string[];
  promptVersion: string;
  modelVersion: string;
};
export function isStructuredPoseResult(value: unknown): value is StructuredPoseResult {
  if (!value || typeof value !== 'object') return false;
  const item = value as StructuredPoseResult;
  return typeof item.schemaVersion === 'string' && typeof item.analyzerVersion === 'string' && ['VALID', 'NEEDS_RETAKE', 'INSUFFICIENT'].includes(item.inputQuality?.status) && Array.isArray(item.inputQuality?.reasons) && Boolean(item.pose && typeof item.pose === 'object') && Boolean(item.confidence && typeof item.confidence === 'object') && Array.isArray(item.warnings);
}
export function isTrainingPlan(value: unknown): value is TrainingPlan {
  if (!value || typeof value !== 'object') return false;
  const item = value as TrainingPlan;
  return typeof item.summary === 'string' && Array.isArray(item.focusAreas) && Array.isArray(item.recommendations) && Array.isArray(item.trainingPlan?.phases) && Array.isArray(item.limitations) && Array.isArray(item.safetyFlags) && typeof item.promptVersion === 'string' && typeof item.modelVersion === 'string';
}
