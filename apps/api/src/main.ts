import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (process.env.CLIENT_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
  if (allowedOrigins.length) app.enableCors({ origin: allowedOrigins, methods: ['GET', 'POST', 'PATCH', 'DELETE'], allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key'] });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  await app.listen(Number(process.env.PORT ?? 3000));
}
void bootstrap();
