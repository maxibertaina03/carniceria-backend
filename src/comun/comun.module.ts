import { Global, Module } from '@nestjs/common';
import { UnidadDeTrabajo } from './aplicacion/unidad-de-trabajo';
import { PrismaService } from './infraestructura/prisma.service';
import { UnidadDeTrabajoPrisma } from './infraestructura/unidad-de-trabajo-prisma';
import { GuardiaAdmin } from './seguridad/guardia-admin';

@Global()
@Module({
  providers: [
    PrismaService,
    { provide: UnidadDeTrabajo, useClass: UnidadDeTrabajoPrisma },
    GuardiaAdmin,
  ],
  exports: [PrismaService, UnidadDeTrabajo, GuardiaAdmin],
})
export class ComunModule {}
