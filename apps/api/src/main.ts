import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';

function validateEnvironmentConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (!process.env.DATABASE_URL) {
    throw new Error('[FATAL_CONFIG_ERROR] DATABASE_URL environment variable is required');
  }

  if (nodeEnv === 'production') {
    if (!process.env.REDIS_URL) {
      throw new Error('[FATAL_CONFIG_ERROR] Production mode requires REDIS_URL for mandatory distributed rate limiting');
    }
    if (!process.env.METRICS_AUTH_TOKEN) {
      throw new Error('[FATAL_CONFIG_ERROR] Production mode requires METRICS_AUTH_TOKEN for secure Prometheus exposition');
    }
  }
}

async function bootstrap() {
  validateEnvironmentConfig();

  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors();

  // Validation
  app.useGlobalPipes(new ZodValidationPipe());

  // Exception Filters
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('EDIMP Enterprise Platform API')
    .setDescription('Enterprise Data Integration & Migration Platform (Phase 1–8)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
