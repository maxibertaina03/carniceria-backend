import { randomUUID } from 'crypto';
import { redondearCantidad } from '../../comun/dominio/redondeo';
import { UnidadMedida } from '../../comun/dominio/unidad-medida';
import { RecetaInvalidaException } from './excepciones';

// Un ingrediente de la fórmula: qué producto (insumo o corte), cuánto y en qué
// unidad, por el rinde base de la receta. La unidad puede ser distinta a la del
// producto (ej. 28 g de una sal que se compra por kg); se convierte al usarla.
export class IngredienteReceta {
  constructor(
    readonly productoId: string,
    readonly cantidad: number,
    readonly unidad: UnidadMedida,
  ) {}
}

export interface DatosIngrediente {
  productoId: string;
  cantidad: number;
  unidad: UnidadMedida;
}

// Aggregate root: la fórmula para producir un embutido. Define cuánto rinde
// (ej. 10 kg de salame) y qué ingredientes lleva ese lote base.
export class Receta {
  private constructor(
    readonly id: string,
    readonly productoTerminadoId: string,
    readonly rindeCantidad: number,
    readonly activa: boolean,
    readonly ingredientes: IngredienteReceta[],
  ) {}

  static crear(datos: {
    productoTerminadoId: string;
    rindeCantidad: number;
    ingredientes: DatosIngrediente[];
  }): Receta {
    return Receta.construir(randomUUID(), datos, true);
  }

  static reconstruir(props: {
    id: string;
    productoTerminadoId: string;
    rindeCantidad: number;
    activa: boolean;
    ingredientes: DatosIngrediente[];
  }): Receta {
    return new Receta(
      props.id,
      props.productoTerminadoId,
      props.rindeCantidad,
      props.activa,
      props.ingredientes.map(
        (i) => new IngredienteReceta(i.productoId, i.cantidad, i.unidad),
      ),
    );
  }

  // Reemplaza los datos de la receta (rinde e ingredientes) manteniendo el id.
  actualizar(datos: {
    rindeCantidad: number;
    ingredientes: DatosIngrediente[];
  }): Receta {
    return Receta.construir(
      this.id,
      { productoTerminadoId: this.productoTerminadoId, ...datos },
      this.activa,
    );
  }

  private static construir(
    id: string,
    datos: {
      productoTerminadoId: string;
      rindeCantidad: number;
      ingredientes: DatosIngrediente[];
    },
    activa: boolean,
  ): Receta {
    if (!(datos.rindeCantidad > 0)) {
      throw new RecetaInvalidaException(
        'El rinde de la receta debe ser mayor a cero',
      );
    }
    if (!datos.ingredientes || datos.ingredientes.length === 0) {
      throw new RecetaInvalidaException(
        'La receta debe tener al menos un ingrediente',
      );
    }
    const vistos = new Set<string>();
    const ingredientes = datos.ingredientes.map((ingrediente) => {
      if (ingrediente.productoId === datos.productoTerminadoId) {
        throw new RecetaInvalidaException(
          'Un producto no puede ser ingrediente de su propia receta',
        );
      }
      if (vistos.has(ingrediente.productoId)) {
        throw new RecetaInvalidaException(
          'La receta tiene un ingrediente repetido',
        );
      }
      vistos.add(ingrediente.productoId);
      if (!(ingrediente.cantidad > 0)) {
        throw new RecetaInvalidaException(
          'La cantidad de cada ingrediente debe ser mayor a cero',
        );
      }
      return new IngredienteReceta(
        ingrediente.productoId,
        ingrediente.cantidad,
        ingrediente.unidad,
      );
    });

    return new Receta(
      id,
      datos.productoTerminadoId,
      datos.rindeCantidad,
      activa,
      ingredientes,
    );
  }

  // Escala los ingredientes para producir `cantidadProducida` del terminado.
  // Ej: receta rinde 10 kg, se quieren 30 kg → cada ingrediente ×3.
  // La cantidad sigue expresada en la unidad del ingrediente (ej. gramos).
  escalarIngredientes(
    cantidadProducida: number,
  ): { productoId: string; cantidad: number; unidad: UnidadMedida }[] {
    if (!(cantidadProducida > 0)) {
      throw new RecetaInvalidaException(
        'La cantidad a producir debe ser mayor a cero',
      );
    }
    const factor = cantidadProducida / this.rindeCantidad;
    return this.ingredientes.map((ingrediente) => ({
      productoId: ingrediente.productoId,
      cantidad: redondearCantidad(ingrediente.cantidad * factor),
      unidad: ingrediente.unidad,
    }));
  }
}
