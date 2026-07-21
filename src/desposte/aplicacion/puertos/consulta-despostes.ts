// Modelo de lectura de despostes (incluye el nombre del corte para la UI).
export interface CorteDetalle {
  id: string;
  productoId: string;
  productoNombre: string;
  // Unidad del corte (normalmente KG) para mostrar bien la cantidad.
  unidadMedida: string;
  cantidad: number;
  valorReferencia: number;
  costoUnitario: number;
  subtotal: number;
}

export interface DesposteDetalle {
  id: string;
  fecha: Date;
  proveedor: string | null;
  pesoRes: number;
  costoTotal: number;
  observaciones: string | null;
  cortes: CorteDetalle[];
}

export abstract class ConsultaDespostes {
  abstract obtenerTodos(): Promise<DesposteDetalle[]>;
  abstract obtenerPorId(id: string): Promise<DesposteDetalle | null>;
}
