import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
export function fail(code: string, message: string, status = 409): never {
  throw new HttpException({ code, message }, status);
}
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    if (error instanceof HttpException) {
      const value = error.getResponse();
      const body = typeof value === 'object' ? value as Record<string, unknown> : { message: value };
      response.status(error.getStatus()).json({ code: body.code ?? 'REQUEST_REJECTED', message: Array.isArray(body.message) ? 'Dữ liệu gửi lên không hợp lệ.' : body.message, details: {} });
      return;
    }
    // Do not serialize database errors, requests, credentials or PII to logs/responses.
    response.status(500).json({ code: 'INTERNAL_ERROR', message: 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.', details: {} });
  }
}
