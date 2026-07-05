import { Injectable } from '@nestjs/common';
import { ContextoTransaccion } from '../../../comun/dominio/contexto-transaccion';
import { Dinero } from '../../../comun/dominio/dinero';
import { RegistradorDeudaCliente } from '../../../ventas/aplicacion/puertos/registrador-deuda-cliente';
import {
  ClienteInvalidoException,
  ClienteNoEncontradoException,
} from '../../dominio/excepciones';
import { RepositorioCliente } from '../../dominio/repositorio-cliente';

// Adaptador de Cuentas Corrientes para el puerto que define Ventas:
// una venta fiada genera un CARGO y actualiza el saldo del cliente.
@Injectable()
export class RegistradorDeudaClienteCuentas extends RegistradorDeudaCliente {
  constructor(private readonly repositorio: RepositorioCliente) {
    super();
  }

  async verificarClienteActivo(
    clienteId: string,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    const cliente = await this.repositorio.obtenerPorId(clienteId, ctx);
    if (!cliente) {
      throw new ClienteNoEncontradoException(clienteId);
    }
    if (!cliente.activo) {
      throw new ClienteInvalidoException(
        `El cliente "${cliente.nombre}" está desactivado`,
      );
    }
  }

  async registrarCargoPorVenta(
    clienteId: string,
    ventaId: string,
    monto: number,
    fecha: Date,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    const cliente = await this.repositorio.obtenerPorId(clienteId, ctx);
    if (!cliente) {
      throw new ClienteNoEncontradoException(clienteId);
    }
    const movimiento = cliente.registrarCargo(Dinero.desde(monto), {
      ventaId,
      fecha,
      observaciones: 'Venta fiada',
    });
    await this.repositorio.guardar(cliente, ctx);
    await this.repositorio.agregarMovimiento(movimiento, ctx);
  }
}
