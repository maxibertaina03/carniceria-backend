import { Injectable } from '@nestjs/common';
import { UnidadDeTrabajo } from '../../comun/aplicacion/unidad-de-trabajo';
import { Dinero } from '../../comun/dominio/dinero';
import {
  ProveedorInvalidoException,
  ProveedorNoEncontradoException,
} from '../dominio/excepciones';
import { MovimientoProveedor } from '../dominio/movimiento-proveedor';
import { Proveedor } from '../dominio/proveedor';
import { RepositorioProveedor } from '../dominio/repositorio-proveedor';

export interface DatosActualizarProveedor {
  nombre?: string;
  telefono?: string;
  activo?: boolean;
}

@Injectable()
export class ServicioProveedores {
  constructor(
    private readonly unidadDeTrabajo: UnidadDeTrabajo,
    private readonly repositorio: RepositorioProveedor,
  ) {}

  async crear(datos: {
    nombre: string;
    telefono?: string;
    deudaInicial?: number;
  }): Promise<Proveedor> {
    const proveedor = Proveedor.crear(datos);
    const deudaInicial = datos.deudaInicial ?? 0;
    // Si arranca con una deuda ya existente, la registramos como un cargo
    // inicial para que quede en el historial y el saldo sea coherente.
    if (deudaInicial > 0) {
      return this.unidadDeTrabajo.ejecutar(async (ctx) => {
        const movimiento = proveedor.registrarCargo(Dinero.desde(deudaInicial), {
          observaciones: 'Saldo inicial',
        });
        await this.repositorio.guardar(proveedor, ctx);
        await this.repositorio.agregarMovimiento(movimiento, ctx);
        return proveedor;
      });
    }
    await this.repositorio.guardar(proveedor);
    return proveedor;
  }

  listar(incluirInactivos = false): Promise<Proveedor[]> {
    return this.repositorio.obtenerTodos(incluirInactivos);
  }

  async obtener(id: string): Promise<Proveedor> {
    const proveedor = await this.repositorio.obtenerPorId(id);
    if (!proveedor) {
      throw new ProveedorNoEncontradoException(id);
    }
    return proveedor;
  }

  async actualizar(
    id: string,
    datos: DatosActualizarProveedor,
  ): Promise<Proveedor> {
    const proveedor = await this.obtener(id);
    proveedor.actualizarDatos({ nombre: datos.nombre, telefono: datos.telefono });
    if (datos.activo === true) {
      proveedor.activar();
    } else if (datos.activo === false) {
      proveedor.desactivar();
    }
    await this.repositorio.guardar(proveedor);
    return proveedor;
  }

  async desactivar(id: string): Promise<void> {
    const proveedor = await this.obtener(id);
    proveedor.desactivar();
    await this.repositorio.guardar(proveedor);
  }

  async eliminarDefinitivo(id: string): Promise<void> {
    await this.obtener(id);
    if (await this.repositorio.tieneHistorial(id)) {
      throw new ProveedorInvalidoException(
        'Este proveedor tiene compras, gastos o movimientos, no se puede borrar. Podés desactivarlo.',
      );
    }
    await this.repositorio.eliminar(id);
  }

  async obtenerMovimientos(
    id: string,
  ): Promise<{ proveedor: Proveedor; movimientos: MovimientoProveedor[] }> {
    const proveedor = await this.obtener(id);
    const movimientos = await this.repositorio.obtenerMovimientos(id);
    return { proveedor, movimientos };
  }

  // Registra un pago al proveedor (parcial o total) en una única transacción.
  registrarPago(
    id: string,
    datos: { monto: number; observaciones?: string },
  ): Promise<{ proveedor: Proveedor; movimiento: MovimientoProveedor }> {
    return this.unidadDeTrabajo.ejecutar(async (ctx) => {
      const proveedor = await this.repositorio.obtenerPorId(id, ctx);
      if (!proveedor) {
        throw new ProveedorNoEncontradoException(id);
      }
      const movimiento = proveedor.registrarPago(Dinero.desde(datos.monto), {
        observaciones: datos.observaciones,
      });
      await this.repositorio.guardar(proveedor, ctx);
      await this.repositorio.agregarMovimiento(movimiento, ctx);
      return { proveedor, movimiento };
    });
  }
}
