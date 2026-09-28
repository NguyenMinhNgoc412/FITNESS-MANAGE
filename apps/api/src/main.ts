import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/errors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  if (!/^mongodb(\+srv)?:\/\//.test(process.env.DATABASE_URL ?? '')) throw new Error('DATABASE_URL must use MongoDB.');
  const secrets = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'JWT_QR_SECRET'].map(key => process.env[key] ?? '');
  if (secrets.some(value => value.length < 32) || new Set(secrets).size !== 3) throw new Error('Configure three distinct JWT secrets of at least 32 characters.');
  const allowedOrigins = (process.env.CLIENT_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  app.enableCors({ origin: allowedOrigins, methods: ['GET', 'POST', 'PATCH', 'DELETE'], allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key'] });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new ApiExceptionFilter());
  await app.listen(Number(process.env.PORT ?? 3000));
}
void bootstrap();
