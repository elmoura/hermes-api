import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { config } from '@/config/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : [
        config.mail.frontendUrl,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // whitelist: true,
      // forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Hermes API')
    .setDescription('API REST do Hermes (NestJS + MongoDB).')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Admin API Key',
        description:
          'Chave de serviço para rotas admin (variável de ambiente `ADMIN_API_KEY`). Envie como `Authorization: Bearer <chave>`.',
      },
      'admin-api-key',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Access token do utilizador no tenant (`sub` = userId, `org` = organizationId). Não usar a API key de staff nestas rotas.',
      },
      'tenant-jwt',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
