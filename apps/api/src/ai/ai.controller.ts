import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../common/access';
import { parse } from '../common/input';
import { fail } from '../common/errors';
import { formInput, formResponse } from './contracts';
// Validate both saved v1 reports and automatic v2 metrics before proxying.
export { formInput } from './contracts';
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
        body: JSON.stringify(input), signal: AbortSignal.timeout(25000),
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      const output = parse(formResponse, result);
      if (output.schemaVersion !== input.schemaVersion || output.status !== input.status || (output.schemaVersion === '2.0' && input.schemaVersion === '2.0' && output.exercise !== input.exercise)) throw new Error();
      return output;
    } catch { return fail('AI_UNAVAILABLE', 'Chưa thể lấy giải thích. Kết quả local vẫn được giữ.', 503); }
  }
}
