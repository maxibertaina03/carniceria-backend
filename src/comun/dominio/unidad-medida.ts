// Unidad en la que se mide un producto. El caso principal es KG.
// GRAMO y METRO se usan para insumos de producción (especias, tripa);
// UNIDAD para productos vendidos por unidad.
export type UnidadMedida = 'KG' | 'GRAMO' | 'METRO' | 'UNIDAD';

export const UNIDADES_MEDIDA: UnidadMedida[] = ['KG', 'GRAMO', 'METRO', 'UNIDAD'];
