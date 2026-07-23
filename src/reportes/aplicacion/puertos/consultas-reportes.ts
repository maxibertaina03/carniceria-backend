// Contexto de soporte de solo lectura: modelos de los reportes que consume la UI.

export interface RangoFechas {
  desde?: Date;
  hasta?: Date;
}

export interface ReporteGanancias {
  cantidadVentas: number;
  totalVendido: number;
  // Ganancia bruta de las ventas (precio − costo de la mercadería).
  gananciaTotal: number;
  totalContado: number;
  totalFiado: number;
  // Gastos del negocio en el período (alquiler, luz, etc.).
  totalGastos: number;
  // Resultado real = ganancia de ventas − gastos.
  resultado: number;
}

export interface ProductoMasVendido {
  productoId: string;
  nombre: string;
  unidadMedida: string;
  cantidadVendida: number;
  totalVendido: number;
  gananciaGenerada: number;
}

export interface DeudaCliente {
  clienteId: string;
  nombre: string;
  telefono: string | null;
  saldoDeudor: number;
}

export interface StockProducto {
  productoId: string;
  nombre: string;
  categoria: string;
  unidadMedida: string;
  stockActual: number;
  costoUnitarioReferencia: number;
  precioVentaReferencia: number;
}

export abstract class ConsultasReportes {
  abstract ganancias(rango: RangoFechas): Promise<ReporteGanancias>;
  abstract productosMasVendidos(rango: RangoFechas): Promise<ProductoMasVendido[]>;
  abstract deudas(): Promise<DeudaCliente[]>;
  abstract stock(): Promise<StockProducto[]>;
}
