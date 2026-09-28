import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../common/access';
import { parse } from '../common/input';
import { fail } from '../common/errors';
export const formInput = z.object({
  schemaVersion: z.literal('1.0'),
  exercise: z.literal('SQUAT'),
  status: z.enum(['COMPLETED', 'POSE_NOT_DETECTED', 'INSUFFICIENT_REPS']),
  reps: z.number().int().min(0).max(500),
  metrics: z.object({ minKneeAngle: z.number().min(0).max(180), detectedRatio: z.number().min(0).max(1) }).strict(),
  issues: z.array(z.object({ code: z.literal('INSUFFICIENT_DEPTH'), confidence: z.number().min(0).max(1) }).strict()).max(1),
}).strict();
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MEMBER)
export class AiController {
  @Post('form-analysis')
  async form(@Body() body: unknown) {
    const input = parse(formInput, body);
    if (!process.env.AI_SERVICE_TOKEN || !process.env.AI_SERVICE_URL) fail('AI_UNAVAILABLE', 'Dịch vụ giải thích chưa được cấu hình. Bạn vẫn có thể xem kết quả local.', 503);
    try {
      const response = await fetch(process.env.AI_SERVICE_URL + '/ai/form-analysis', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Service-Token': process.env.AI_SERVICE_TOKEN! },
        body: JSON.stringify(input), signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      return parse(z.object({ schemaVersion: z.literal('1.0'), status: z.enum(['COMPLETED', 'POSE_NOT_DETECTED', 'INSUFFICIENT_REPS']), feedback: z.array(z.string().max(500)).max(5) }).strict(), result);
    } catch { return fail('AI_UNAVAILABLE', 'Chưa thể lấy giải thích. Kết quả local vẫn được giữ.', 503); }
  }
}
