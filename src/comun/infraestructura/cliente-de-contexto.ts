import { Prisma } from '@prisma/client';
import { ContextoTransaccion } from '../dominio/contexto-transaccion';
import { PrismaService } from './prisma.service';

// Devuelve el cliente Prisma a usar: el de la transacción en curso si existe,
// o el cliente general si la operación es suelta.
export function clienteDeContexto(
  prisma: PrismaService,
  ctx?: ContextoTransaccion,
): Prisma.TransactionClient {
  return (ctx as Prisma.TransactionClient) ?? prisma;
}
