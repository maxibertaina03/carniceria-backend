// Capacidad publicada por Producción: recalcular el costo de referencia de
// todos los productos que se fabrican con receta, según el precio actual de
// sus insumos. La usan Compras y Desposte (cuando cambian costos de insumos)
// y la propia Producción (al guardar recetas o producir).
export abstract class RecalculadorCostos {
  abstract recalcularTodos(): Promise<void>;
}
