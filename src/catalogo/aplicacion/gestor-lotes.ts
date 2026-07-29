import { Injectable } from '@nestjs/common';
import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { LectorConfiguracion } from '../../configuracion/aplicacion/puertos/lector-configuracion';
import { Lote } from '../dominio/lote';
import { RepositorioLote } from '../dominio/repositorio-lote';
import { RepositorioProducto } from '../dominio/repositorio-producto';

// Gestiona los lotes de stock cuando el rubro tiene la función activada.
// Si NO está activada (ej. carnicería), todos sus métodos no hacen nada: el
// stock sigue funcionando exactamente como antes (un solo número por producto).
@Injectable()
export class GestorLotes {
  constructor(
    private readonly configuracion: LectorConfiguracion,
    private readonly repositorioLote: RepositorioLote,
    private readonly repositorioProducto: RepositorioProducto,
  ) {}

  activo(): boolean {
    return this.configuracion.features().lotes;
  }

  // Un ingreso de stock (compra o producción) crea un lote. El vencimiento se
  // calcula con los días de duración del producto (si tiene).
  async registrarIngreso(
    productoId: string,
    cantidad: number,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    if (!this.activo() || cantidad <= 0) return;
    const producto = await this.repositorioProducto.obtenerPorId(productoId, ctx);
    const elaboracion = new Date();
    const vencimiento = this.calcularVencimiento(
      elaboracion,
      producto?.diasVencimiento ?? null,
    );
    const lote = Lote.crear({
      productoId,
      cantidad,
      fechaElaboracion: elaboracion,
      fechaVencimiento: vencimiento,
    });
    await this.repositorioLote.guardar(lote, ctx);
  }

  // Un egreso de stock (venta o producción) descuenta de los lotes que vencen
  // antes primero (FIFO por vencimiento). Es best-effort: la invariante dura del
  // stock ya la garantiza el producto; acá solo mantenemos la trazabilidad.
  async descontar(
    productoId: string,
    cantidad: number,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    if (!this.activo() || cantidad <= 0) return;
    let restante = cantidad;
    const lotes = await this.repositorioLote.disponiblesDeProducto(productoId, ctx);
    for (const lote of lotes) {
      if (restante <= 0) break;
      const tomado = lote.consumir(restante);
      if (tomado > 0) {
        await this.repositorioLote.actualizarDisponible(
          lote.id,
          lote.cantidadDisponible,
          ctx,
        );
        restante -= tomado;
      }
    }
  }

  // Ajuste manual de stock (fija un total): reconcilia los lotes para que
  // acompañen el nuevo valor (crea o descuenta la diferencia).
  async reconciliarAjuste(
    productoId: string,
    stockAnterior: number,
    stockNuevo: number,
    ctx?: ContextoTransaccion,
  ): Promise<void> {
    if (!this.activo()) return;
    const delta = stockNuevo - stockAnterior;
    if (delta > 0) {
      await this.registrarIngreso(productoId, delta, ctx);
    } else if (delta < 0) {
      await this.descontar(productoId, -delta, ctx);
    }
  }

  private calcularVencimiento(
    elaboracion: Date,
    dias: number | null,
  ): Date | null {
    if (!dias || dias <= 0) return null;
    const vencimiento = new Date(elaboracion);
    vencimiento.setDate(vencimiento.getDate() + dias);
    return vencimiento;
  }
}
