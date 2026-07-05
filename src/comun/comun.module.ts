import { Global, Module } from '@nestjs/common';
import { UnidadDeTrabajo } from './aplicacion/unidad-de-trabajo';
import { PrismaService } from './infraestructura/prisma.service';
import { UnidadDeTrabajoPrisma } from './infraestructura/unidad-de-trabajo-prisma';

@Global()
@Module({
  providers: [
    PrismaService,
    { provide: UnidadDeTrabajo, useClass: UnidadDeTrabajoPrisma },
  ],
  exports: [PrismaService, UnidadDeTrabajo],
})
export class ComunModule {}
