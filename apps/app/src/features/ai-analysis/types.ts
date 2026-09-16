export type AiRunStatus = 'UPLOAD_PENDING' | 'UPLOADED' | 'VALIDATING' | 'ANALYZING' | 'NEEDS_RETAKE' | 'COMPLETED' | 'FAILED';

export type StructuredResult = {
  inputQuality: { status: 'VALID' | 'NEEDS_RETAKE' | 'INSUFFICIENT'; reasons: string[] };
  warnings: string[];
  confidence: Record<string, unknown>;
};

export type TrainingPhase = { name: string; durationWeeks: number; goals: string[]; exercises: string[] };

export type TrainingPlan = {
  summary: string;
  focusAreas: string[];
  recommendations: string[];
  trainingPlan: { phases: TrainingPhase[] };
  limitations: string[];
  safetyFlags: string[];
};

export type AiRun = {
  id: string;
  status: AiRunStatus;
  createdAt: string;
  completedAt?: string | null;
  errorCode?: string | null;
  result?: StructuredResult | null;
  plan?: TrainingPlan | null;
};

export type UploadIntent = {
  runId: string;
  status: AiRunStatus;
  upload?: { path: string; token: string; signedUrl: string; bucket: string };
};
