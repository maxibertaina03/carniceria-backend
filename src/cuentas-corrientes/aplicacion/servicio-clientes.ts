import { Injectable } from '@nestjs/common';
import { UnidadDeTrabajo } from '../../comun/aplicacion/unidad-de-trabajo';
import { Dinero } from '../../comun/dominio/dinero';
import { Cliente } from '../dominio/cliente';
import { ClienteNoEncontradoException } from '../dominio/excepciones';
import { MovimientoCuenta } from '../dominio/movimiento-cuenta';
import { RepositorioCliente } from '../dominio/repositorio-cliente';

export interface DatosActualizarCliente {
  nombre?: string;
  telefono?: string;
  activo?: boolean;
}

@Injectable()
export class ServicioClientes {
  constructor(
    private readonly unidadDeTrabajo: UnidadDeTrabajo,
    private readonly repositorio: RepositorioCliente,
  ) {}

  async crear(datos: { nombre: string; telefono?: string }): Promise<Cliente> {
    const cliente = Cliente.crear(datos);
    await this.repositorio.guardar(cliente);
    return cliente;
  }

  listar(incluirInactivos = false): Promise<Cliente[]> {
    return this.repositorio.obtenerTodos(incluirInactivos);
  }

  async obtener(id: string): Promise<Cliente> {
    const cliente = await this.repositorio.obtenerPorId(id);
    if (!cliente) {
      throw new ClienteNoEncontradoException(id);
    }
    return cliente;
  }

  async actualizar(id: string, datos: DatosActualizarCliente): Promise<Cliente> {
    const cliente = await this.obtener(id);
    cliente.actualizarDatos({ nombre: datos.nombre, telefono: datos.telefono });
    if (datos.activo === true) {
      cliente.activar();
    } else if (datos.activo === false) {
      cliente.desactivar();
    }
    await this.repositorio.guardar(cliente);
    return cliente;
  }

  async desactivar(id: string): Promise<void> {
    const cliente = await this.obtener(id);
    cliente.desactivar();
    await this.repositorio.guardar(cliente);
  }

  async obtenerMovimientos(
    id: string,
  ): Promise<{ cliente: Cliente; movimientos: MovimientoCuenta[] }> {
    const cliente = await this.obtener(id);
    const movimientos = await this.repositorio.obtenerMovimientos(id);
    return { cliente, movimientos };
  }

  // Registra un pago (parcial o total) y actualiza el saldo, todo en una
  // única transacción.
  registrarPago(
    id: string,
    datos: { monto: number; observaciones?: string },
  ): Promise<{ cliente: Cliente; movimiento: MovimientoCuenta }> {
    return this.unidadDeTrabajo.ejecutar(async (ctx) => {
      const cliente = await this.repositorio.obtenerPorId(id, ctx);
      if (!cliente) {
        throw new ClienteNoEncontradoException(id);
      }
      const movimiento = cliente.registrarPago(
        Dinero.desde(datos.monto),
        datos.observaciones,
      );
      await this.repositorio.guardar(cliente, ctx);
      await this.repositorio.agregarMovimiento(movimiento, ctx);
      return { cliente, movimiento };
    });
  }
}
