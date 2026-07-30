import { Producto } from '../../dominio/producto';

export interface ProductoRespuesta {
  id: string;
  nombre: string;
  categoria: string;
  subcategoria: string | null;
  unidadMedida: string;
  stockActual: number;
  costoUnitarioReferencia: number;
  precioVentaReferencia: number;
  seVende: boolean;
  diasVencimiento: number | null;
  imagen: string | null;
  activo: boolean;
  fechaCreacion: Date;
}

export function aProductoRespuesta(producto: Producto): ProductoRespuesta {
  return {
    id: producto.id,
    nombre: producto.nombre,
    categoria: producto.categoria,
    subcategoria: producto.subcategoria,
    unidadMedida: producto.unidadMedida,
    stockActual: producto.stockActual,
    costoUnitarioReferencia: producto.costoUnitarioReferencia,
    precioVentaReferencia: producto.precioVentaReferencia,
    seVende: producto.seVende,
    diasVencimiento: producto.diasVencimiento,
    imagen: producto.imagen,
    activo: producto.activo,
    fechaCreacion: producto.fechaCreacion,
  };
}
