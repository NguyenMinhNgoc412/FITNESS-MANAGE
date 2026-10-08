import { formInput, formResponse } from './contracts';
import { AiController } from './ai.controller';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
const valid = () => ({ schemaVersion: '2.0', exercise: 'SQUAT', status: 'COMPLETED', recognitionScore: 0.9, reps: 1,
  metrics: { detectedRatio: 0.9, minJointAngle: 80 }, reference: { trunkMax: null },
  perRep: [{ index: 1, timeSeconds: 0.6, angles: { kneeLeft: 80, kneeRight: null, trunk: 20, elbowLeft: 170, elbowRight: null, armLeft: 10, armRight: null }, bodyLine: null }],
});
describe('automatic form metrics contract', () => {
  it.each(['SQUAT', 'PUSH_UP', 'LUNGE'])('accepts %s with explicit evidence', exercise => {
    expect(formInput.safeParse({ ...valid(), exercise }).success).toBe(true);
  });
  it('keeps Member authorization at the API boundary', () => {
    expect(Reflect.getMetadata('roles', AiController)).toEqual(['MEMBER']);
    expect(Reflect.getMetadata('__guards__', AiController)).toEqual([JwtAuthGuard, RolesGuard]);
  });
  it('rejects mismatched upstream exercises and never forwards unexpected media fields', async () => {
    const originalUrl = process.env.AI_SERVICE_URL, originalToken = process.env.AI_SERVICE_TOKEN;
    process.env.AI_SERVICE_URL = 'http://unit-test.invalid'; process.env.AI_SERVICE_TOKEN = 'unit-test-only';
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ schemaVersion: '2.0', exercise: 'LUNGE', status: 'COMPLETED', provider: 'LOCAL', feedback: ['text'] }) } as Response);
    try {
      const controller = new AiController();
      await expect(controller.form({ ...valid(), video: 'forbidden' })).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
      await expect(controller.form(valid())).rejects.toThrow();
      expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual(valid());
    } finally {
      fetchMock.mockRestore();
      if (originalUrl === undefined) delete process.env.AI_SERVICE_URL; else process.env.AI_SERVICE_URL = originalUrl;
      if (originalToken === undefined) delete process.env.AI_SERVICE_TOKEN; else process.env.AI_SERVICE_TOKEN = originalToken;
    }
  });
  it('rejects unknown or incomplete evidence presented as a completed analysis', () => {
    for (const changes of [{ exercise: 'UNKNOWN' }, { perRep: [] }, { reps: 2 }, { recognitionScore: 0.6 }]) expect(formInput.safeParse({ ...valid(), ...changes }).success).toBe(false);
  });
  it('forbids raw video, identity and landmarks at every object level', () => {
    for (const field of ['video', 'base64', 'landmarks', 'memberId']) {
      const value = valid();
      expect(formInput.safeParse({ ...value, [field]: 'forbidden' }).success).toBe(false);
      expect(formInput.safeParse({ ...value, metrics: { ...value.metrics, [field]: 'forbidden' } }).success).toBe(false);
      expect(formInput.safeParse({ ...value, perRep: [{ ...value.perRep[0], angles: { ...value.perRep[0].angles, [field]: 'forbidden' } }] }).success).toBe(false);
    }
  });
  it('accepts honest unknown states and bounds the feedback contract', () => {
    expect(formInput.safeParse({ ...valid(), exercise: 'UNKNOWN', status: 'UNRECOGNIZED_EXERCISE', reps: 0, perRep: [] }).success).toBe(true);
    expect(formResponse.safeParse({ schemaVersion: '2.0', exercise: 'SQUAT', status: 'COMPLETED', provider: 'OPENAI', feedback: ['Measured feedback'] }).success).toBe(true);
    expect(formResponse.safeParse({ schemaVersion: '2.0', exercise: 'SQUAT', status: 'COMPLETED', provider: 'OPENAI', feedback: Array(9).fill('text') }).success).toBe(false);
  });
});
