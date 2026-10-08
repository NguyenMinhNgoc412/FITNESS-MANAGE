import { z } from 'zod';
const legacyStatus = z.enum(['COMPLETED', 'POSE_NOT_DETECTED', 'INSUFFICIENT_REPS']);
const autoStatus = z.enum(['COMPLETED', 'POSE_NOT_DETECTED', 'INSUFFICIENT_REPS', 'UNRECOGNIZED_EXERCISE']);
const exercise = z.enum(['SQUAT', 'PUSH_UP', 'LUNGE', 'UNKNOWN']);
const angle = z.number().finite().min(0).max(180).nullable();
const ratio = z.number().finite().min(0).max(1);
const legacy = z.object({
  schemaVersion: z.literal('1.0'), exercise: z.literal('SQUAT'), status: legacyStatus,
  reps: z.number().int().min(0).max(500),
  metrics: z.object({ minKneeAngle: z.number().min(0).max(180), detectedRatio: ratio }).strict(),
  issues: z.array(z.object({ code: z.literal('INSUFFICIENT_DEPTH'), confidence: ratio }).strict()).max(1),
}).strict();
const automatic = z.object({
  schemaVersion: z.literal('2.0'), exercise, status: autoStatus, recognitionScore: ratio,
  reps: z.number().int().min(0).max(500),
  metrics: z.object({ detectedRatio: ratio, minJointAngle: angle }).strict(),
  reference: z.object({ trunkMax: z.number().finite().min(0).max(90).nullable() }).strict(),
  perRep: z.array(z.object({
    index: z.number().int().min(1).max(500), timeSeconds: z.number().finite().min(0).max(120),
    angles: z.object({ kneeLeft: angle, kneeRight: angle, trunk: z.number().finite().min(0).max(90).nullable(), elbowLeft: angle, elbowRight: angle, armLeft: z.number().min(0).max(90).nullable(), armRight: z.number().min(0).max(90).nullable() }).strict(), bodyLine: angle,
  }).strict()).max(10),
}).strict().superRefine((input, context) => {
  const invalid = input.status === 'COMPLETED'
    ? input.exercise === 'UNKNOWN' || input.reps === 0 || input.metrics.detectedRatio < 0.6 || input.recognitionScore < 0.7 || input.perRep.length !== Math.min(input.reps, 10) || input.metrics.minJointAngle === null
    : input.perRep.length > 0 || input.reps !== 0;
  if (invalid || (input.status === 'UNRECOGNIZED_EXERCISE' && input.exercise !== 'UNKNOWN') || input.perRep.some((rep, index) => rep.index !== index + 1)) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid analysis evidence' });
});
export const formInput = z.union([legacy, automatic]);
export const formResponse = z.union([
  z.object({ schemaVersion: z.literal('1.0'), status: legacyStatus, feedback: z.array(z.string().max(500)).max(5) }).strict(),
  z.object({ schemaVersion: z.literal('2.0'), exercise, status: autoStatus, provider: z.enum(['OPENAI', 'LOCAL']), feedback: z.array(z.string().max(600)).min(1).max(8) }).strict(),
]);
