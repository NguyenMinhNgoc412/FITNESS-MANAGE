import { isStructuredPoseResult, isTrainingPlan } from './contracts';
describe('AI contracts', () => {
  const structured = { schemaVersion: '1', inputQuality: { status: 'VALID', reasons: [] }, pose: { features: {}, keypoints: [], derivedMetrics: {} }, confidence: {}, warnings: [], analyzerVersion: '1' };
  it('chỉ nhận structured CV/Pose đủ schema', () => { expect(isStructuredPoseResult(structured)).toBe(true); expect(isStructuredPoseResult({ inputQuality: { status: 'VALID' } })).toBe(false); });
  it('từ chối plan thiếu limitations và safety flags', () => { expect(isTrainingPlan({ summary: 'x', focusAreas: [], recommendations: [], trainingPlan: { phases: [] } })).toBe(false); });
});
