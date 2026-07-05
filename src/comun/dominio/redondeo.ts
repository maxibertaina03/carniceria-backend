// Redondeos estándar del sistema: montos a 2 decimales, cantidades a 3 (gramos).
export function redondearMoneda(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function redondearCantidad(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 1000) / 1000;
}
