import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { FiltroExcepcionesDominio } from './comun/infraestructura/filtro-excepciones-dominio';

// Seguridad: todos los endpoints piden una clave compartida (ver
// GuardiaClaveApi, registrado como guardia global en AppModule) y el acceso
// desde el navegador se limita al dominio de la app (CORS de abajo).
// TODO (futuro): si se necesita seguridad más fuerte, sumar usuario/contraseña.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ORIGEN_PERMITIDO: uno o varios dominios separados por coma (ej. la app en
  // Vercel). Si no está configurado, se permite cualquier origen (desarrollo).
  const origenes = (process.env.ORIGEN_PERMITIDO ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origenes.length > 0 ? origenes : true });
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
