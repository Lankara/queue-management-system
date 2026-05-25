import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { DEFAULT_API_BASE_PATH } from './common/constants/http.constants';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(json({ limit: env.apiJsonBodyLimit }));
  app.use(urlencoded({ extended: true, limit: env.apiJsonBodyLimit }));
  app.setGlobalPrefix(DEFAULT_API_BASE_PATH);
  app.enableCors({
    origin: env.corsOrigin,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableShutdownHooks();

  await app.listen(env.port);
}

void bootstrap();

