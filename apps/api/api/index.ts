import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'nestjs-zod';
import express from 'express';
import { AppModule } from '../src/app.module';
import { PrismaClientExceptionFilter } from '../src/common/filters/prisma-client-exception.filter';

const server = express();

let appPromise: Promise<any> | null = null;

async function bootstrapServerless() {
  if (!appPromise) {
    appPromise = (async () => {
      const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(server),
      );

      app.enableCors();
      app.useGlobalPipes(new ZodValidationPipe());

      const { httpAdapter } = app.get(HttpAdapterHost);
      app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

      app.setGlobalPrefix('api/v1');

      await app.init();
      return app;
    })();
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  await bootstrapServerless();
  server(req, res);
}
