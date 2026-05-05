import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AppLogger } from './common/logger/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('v1');

  app.use(cookieParser());

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'https://matt-uncelestial-kathi.ngrok-free.dev',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const logger = app.get(AppLogger);
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  const storagePath = process.env.STORAGE_LOCAL_PATH ?? 'uploads';
  const uploadsDir = join(process.cwd(), storagePath);
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Veliora API')
    .setDescription('Veliora mental-wellness backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Veliora API running on http://localhost:${port}/v1`);
  console.log(`📖 Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();
