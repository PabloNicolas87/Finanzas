import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

app.enableCors({
    origin: [
      'http://localhost:3001',   // Frontend Web
      'http://127.0.0.1:3001',
      'http://localhost:8081',   // Mobile App (Expo Web)
      'http://127.0.0.1:8081',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Mantenemos el prefijo /api que configuró el agente
  app.setGlobalPrefix('api');

  // Validaciones globales de los DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // ---------------------------------------------------
  // CONFIGURACIÓN DE SWAGGER (Documentación Automática)
  // ---------------------------------------------------
  const config = new DocumentBuilder()
    .setTitle('Finanzas API')
    .setDescription('API para la gestión financiera de la casa y facturación MEI')
    .setVersion('1.0')
    .addTag('users', 'Gestión de usuarios')
    .addTag('accounts', 'Cuentas bancarias y saldos')
    .addTag('transactions', 'Ingresos, egresos y facturas internas')
    .addTag('categories', 'Categorías compartidas')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // La documentación vivirá en la ruta /api/docs
  SwaggerModule.setup('api/docs', app, document);

  // 2. Escuchar en 0.0.0.0 para ser visible en la red local
  const port = process.env.PORT ?? 3005;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend running on: http://localhost:${port}/api`);
}
bootstrap();