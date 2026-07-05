import { Injectable } from '@nestjs/common';
import { UnidadDeTrabajo } from '../aplicacion/unidad-de-trabajo';
import { ContextoTransaccion } from '../dominio/contexto-transaccion';
import { PrismaService } from './prisma.service';

@Injectable()
export class UnidadDeTrabajoPrisma extends UnidadDeTrabajo {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  ejecutar<T>(trabajo: (ctx: ContextoTransaccion) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((transaccion) => trabajo(transaccion));
  }
}
