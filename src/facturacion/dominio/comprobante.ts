import { randomUUID } from 'crypto';
import { Dinero } from '../../comun/dominio/dinero';
import { ExcepcionDominio } from '../../comun/dominio/excepcion-dominio';
import { redondearCantidad, redondearMoneda } from '../../comun/dominio/redondeo';

export class ComprobanteInvalidoException extends ExcepcionDominio {
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class ComprobanteNoEncontradoException extends ExcepcionDominio {
  constructor(id: string) {
    super(`No se encontró el comprobante con id ${id}`, 404);
  }
}

export type TipoComprobante =
  | 'FACTURA'
  | 'NOTA_CREDITO'
  | 'NOTA_DEBITO'
  | 'RECIBO';

export type EstadoComprobante = 'EMITIDO' | 'ANULADO';

export const TIPOS_COMPROBANTE: TipoComprobante[] = [
  'FACTURA',
  'NOTA_CREDITO',
  'NOTA_DEBITO',
  'RECIBO',
];

export interface DatosItemComprobante {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface PropiedadesItemComprobante {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

// Value object: una línea del comprobante. El subtotal se deriva.
export class ItemComprobante {
  private constructor(private readonly props: PropiedadesItemComprobante) {}

  static crear(datos: DatosItemComprobante): ItemComprobante {
    const descripcion = datos.descripcion?.trim();
    if (!descripcion) {
      throw new ComprobanteInvalidoException('Cada ítem necesita una descripción');
    }
    const cantidad = redondearCantidad(datos.cantidad);
    if (!(cantidad > 0)) {
      throw new ComprobanteInvalidoException(
        `La cantidad de "${descripcion}" debe ser mayor a cero`,
      );
    }
    const precio = Dinero.desde(datos.precioUnitario);
    return new ItemComprobante({
      id: randomUUID(),
      descripcion,
      cantidad,
      precioUnitario: precio.monto,
      subtotal: precio.multiplicarPor(cantidad).monto,
    });
  }

  static reconstruir(props: PropiedadesItemComprobante): ItemComprobante {
    return new ItemComprobante({ ...props });
  }

  get id() {
    return this.props.id;
  }
  get descripcion() {
    return this.props.descripcion;
  }
  get cantidad() {
    return this.props.cantidad;
  }
  get precioUnitario() {
    return this.props.precioUnitario;
  }
  get subtotal() {
    return this.props.subtotal;
  }
}

export interface Receptor {
  nombre: string;
  docTipo: string | null;
  docNumero: string | null;
  domicilio: string | null;
}

export interface PropiedadesComprobante {
  id: string;
  tipo: TipoComprobante;
  letra: string;
  puntoVenta: string;
  numero: number;
  fecha: Date;
  receptor: Receptor;
  neto: number;
  alicuotaIva: number;
  iva: number;
  total: number;
  observaciones: string | null;
  estado: EstadoComprobante;
  comprobanteOrigenId: string | null;
  items: ItemComprobante[];
}

// Aggregate root del módulo de facturación. Un comprobante interno (sin AFIP):
// factura, nota de crédito/débito o recibo. Los totales se derivan de los ítems
// y de la alícuota de IVA elegida. Invariante: total = neto + IVA.
export class Comprobante {
  private constructor(private readonly props: PropiedadesComprobante) {}

  static crear(datos: {
    tipo: TipoComprobante;
    numero: number;
    puntoVenta?: string;
    letra?: string;
    fecha?: Date;
    receptor: {
      nombre: string;
      docTipo?: string;
      docNumero?: string;
      domicilio?: string;
    };
    alicuotaIva?: number;
    items: DatosItemComprobante[];
    observaciones?: string;
    comprobanteOrigenId?: string;
  }): Comprobante {
    const nombre = datos.receptor?.nombre?.trim();
    if (!nombre) {
      throw new ComprobanteInvalidoException(
        'El comprobante necesita el nombre del cliente',
      );
    }
    if (!datos.items || datos.items.length === 0) {
      throw new ComprobanteInvalidoException(
        'El comprobante necesita al menos un ítem',
      );
    }
    // Las notas de crédito/débito refieren a una factura de origen.
    if (
      (datos.tipo === 'NOTA_CREDITO' || datos.tipo === 'NOTA_DEBITO') &&
      !datos.comprobanteOrigenId
    ) {
      throw new ComprobanteInvalidoException(
        'La nota de crédito/débito debe indicar la factura de origen',
      );
    }

    const items = datos.items.map((item) => ItemComprobante.crear(item));
    const neto = items.reduce(
      (suma, item) => suma + item.subtotal,
      0,
    );
    const alicuotaIva = datos.alicuotaIva ?? 0;
    if (alicuotaIva < 0 || alicuotaIva > 100) {
      throw new ComprobanteInvalidoException('La alícuota de IVA no es válida');
    }
    const netoRedondeado = redondearMoneda(neto);
    const iva = redondearMoneda((netoRedondeado * alicuotaIva) / 100);
    const total = redondearMoneda(netoRedondeado + iva);

    return new Comprobante({
      id: randomUUID(),
      tipo: datos.tipo,
      letra: (datos.letra ?? 'X').trim().toUpperCase() || 'X',
      puntoVenta: (datos.puntoVenta ?? '0001').trim() || '0001',
      numero: datos.numero,
      fecha: datos.fecha ?? new Date(),
      receptor: {
        nombre,
        docTipo: datos.receptor.docTipo?.trim() || null,
        docNumero: datos.receptor.docNumero?.trim() || null,
        domicilio: datos.receptor.domicilio?.trim() || null,
      },
      neto: netoRedondeado,
      alicuotaIva,
      iva,
      total,
      observaciones: datos.observaciones?.trim() || null,
      estado: 'EMITIDO',
      comprobanteOrigenId: datos.comprobanteOrigenId ?? null,
      items,
    });
  }

  static reconstruir(props: PropiedadesComprobante): Comprobante {
    return new Comprobante({ ...props });
  }

  // Anula el comprobante (queda registrado pero sin efecto).
  anular(): void {
    if (this.props.estado === 'ANULADO') {
      throw new ComprobanteInvalidoException('El comprobante ya está anulado');
    }
    this.props.estado = 'ANULADO';
  }

  get id() {
    return this.props.id;
  }
  get tipo() {
    return this.props.tipo;
  }
  get letra() {
    return this.props.letra;
  }
  get puntoVenta() {
    return this.props.puntoVenta;
  }
  get numero() {
    return this.props.numero;
  }
  get fecha() {
    return this.props.fecha;
  }
  get receptor() {
    return this.props.receptor;
  }
  get neto() {
    return this.props.neto;
  }
  get alicuotaIva() {
    return this.props.alicuotaIva;
  }
  get iva() {
    return this.props.iva;
  }
  get total() {
    return this.props.total;
  }
  get observaciones() {
    return this.props.observaciones;
  }
  get estado() {
    return this.props.estado;
  }
  get comprobanteOrigenId() {
    return this.props.comprobanteOrigenId;
  }
  get items(): ReadonlyArray<ItemComprobante> {
    return this.props.items;
  }
}
