import { ExcepcionDominio } from './excepcion-dominio';
import { UnidadMedida } from './unidad-medida';

export class UnidadIncompatibleException extends ExcepcionDominio {
  constructor(desde: UnidadMedida, hacia: UnidadMedida) {
    super(
      `No se puede convertir de ${desde} a ${hacia}: son unidades de distinto tipo`,
    );
  }
}

// Cada unidad pertenece a un grupo y se expresa en una unidad base del grupo:
// el peso se convierte usando el gramo como base (1 kg = 1000 g).
const EQUIVALENCIAS: Record<UnidadMedida, { grupo: string; enBase: number }> = {
  KG: { grupo: 'peso', enBase: 1000 },
  GRAMO: { grupo: 'peso', enBase: 1 },
  METRO: { grupo: 'longitud', enBase: 1 },
  UNIDAD: { grupo: 'unidad', enBase: 1 },
};

// Unidades en las que se puede expresar una cantidad de un producto medido en
// `unidadProducto` (ej. un producto en KG se puede pedir en KG o en GRAMO).
export function unidadesCompatibles(unidadProducto: UnidadMedida): UnidadMedida[] {
  const grupo = EQUIVALENCIAS[unidadProducto].grupo;
  return (Object.keys(EQUIVALENCIAS) as UnidadMedida[]).filter(
    (unidad) => EQUIVALENCIAS[unidad].grupo === grupo,
  );
}

export function sonCompatibles(a: UnidadMedida, b: UnidadMedida): boolean {
  return EQUIVALENCIAS[a].grupo === EQUIVALENCIAS[b].grupo;
}

// Convierte una cantidad entre unidades del mismo grupo.
// Ej: convertirCantidad(28, 'GRAMO', 'KG') = 0.028 (28 g son 0,028 kg).
// No redondea: quien lo use decide la precisión (el costo necesita el valor exacto).
export function convertirCantidad(
  cantidad: number,
  desde: UnidadMedida,
  hacia: UnidadMedida,
): number {
  if (desde === hacia) {
    return cantidad;
  }
  if (!sonCompatibles(desde, hacia)) {
    throw new UnidadIncompatibleException(desde, hacia);
  }
  return (cantidad * EQUIVALENCIAS[desde].enBase) / EQUIVALENCIAS[hacia].enBase;
}
