import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { FiltroExcepcionesDominio } from './comun/infraestructura/filtro-excepciones-dominio';

// TODO (futuro): cuando se necesite autenticación, agregar acá un guard global
// (ej. JWT) y el módulo de usuarios. Por ahora el sistema es de uso interno
// en la carnicería y todos los endpoints son públicos.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new FiltroExcepcionesDominio());

  const configuracionSwagger = new DocumentBuilder()
    .setTitle('API Carnicería')
    .setDescription(
      'Sistema de gestión para la carnicería: productos y stock, compras, ventas, cuentas corrientes (fiado) y reportes.',
    )
    .setVersion('1.0')
    .build();
  const documento = SwaggerModule.createDocument(app, configuracionSwagger);
  SwaggerModule.setup('api', app, documento);

  const puerto = process.env.PORT ?? 3000;
  await app.listen(puerto);
  console.log(`API de la carnicería escuchando en el puerto ${puerto} (documentación en /api)`);
}

bootstrap();
