import { Injectable } from '@nestjs/common';
import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { clienteDeContexto } from '../../comun/infraestructura/cliente-de-contexto';
import { PrismaService } from '../../comun/infraestructura/prisma.service';
import { Desposte } from '../dominio/desposte';
import { RepositorioDesposte } from '../dominio/repositorio-desposte';

@Injectable()
export class RepositorioDespostePrisma extends RepositorioDesposte {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async guardar(desposte: Desposte, ctx?: ContextoTransaccion): Promise<void> {
    await clienteDeContexto(this.prisma, ctx).desposte.create({
      data: {
        id: desposte.id,
        fecha: desposte.fecha,
        proveedor: desposte.proveedor,
        pesoRes: desposte.pesoRes,
        costoTotal: desposte.costoTotal,
        observaciones: desposte.observaciones,
        cortes: {
          create: desposte.cortes.map((corte) => ({
            productoId: corte.productoId,
            cantidad: corte.cantidad,
            valorReferencia: corte.valorReferencia,
            costoUnitario: corte.costoUnitario,
            subtotal: corte.subtotal,
          })),
        },
      },
    });
  }
}
