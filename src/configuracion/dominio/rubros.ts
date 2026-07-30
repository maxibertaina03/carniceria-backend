import { ConfiguracionNegocio, Rubro } from './configuracion-negocio';

// Todas las secciones que existen en la app. La config de cada rubro elige
// cuáles se muestran (los códigos coinciden con las rutas del frontend).
const TODOS_LOS_MODULOS = [
  'inicio',
  'ventas',
  'pedidos',
  'clientes',
  'productos',
  'reportes',
  'compras',
  'proveedores',
  'gastos',
  'desposte',
  'produccion',
  'admin',
];

// Registro de rubros: esto es CONFIGURACIÓN (datos), centralizada en un solo
// lugar. Agregar un rubro nuevo es sumar una entrada acá, sin tocar la lógica.
export const REGISTRO_RUBROS: Record<Rubro, ConfiguracionNegocio> = {
  carniceria: {
    rubro: 'carniceria',
    nombreNegocio: 'La Carnicería',
    modulos: TODOS_LOS_MODULOS,
    categorias: [
      { codigo: 'VACUNO', nombre: 'Vacuno', producible: false, esInsumo: false },
      { codigo: 'CERDO', nombre: 'Cerdo', producible: false, esInsumo: false },
      { codigo: 'AVE', nombre: 'Ave', producible: false, esInsumo: false },
      { codigo: 'CHACINADOS', nombre: 'Chacinados', producible: true, esInsumo: false },
      { codigo: 'MILANESAS', nombre: 'Milanesas', producible: true, esInsumo: false },
      { codigo: 'HAMBURGUESAS', nombre: 'Hamburguesas', producible: true, esInsumo: false },
      { codigo: 'INSUMOS', nombre: 'Insumos', producible: false, esInsumo: true },
      { codigo: 'OTROS', nombre: 'Otros', producible: false, esInsumo: false },
    ],
    features: { lotes: false, presentaciones: false },
    etiquetas: {
      ejemploProducto: 'Milanesas',
      ejemploSubcategoria: 'Cerdo, Vaca, Pollo',
      ejemploInsumos: 'sal, pimienta, tripa',
    },
    iconos: {},
  },
  pastas: {
    rubro: 'pastas',
    nombreNegocio: 'Fábrica de Pastas',
    // Pastas no despieza medias reses: se oculta Desposte.
    modulos: TODOS_LOS_MODULOS.filter((m) => m !== 'desposte'),
    categorias: [
      { codigo: 'PASTAS_RELLENAS', nombre: 'Pastas rellenas', producible: true, esInsumo: false },
      { codigo: 'PASTAS_SECAS', nombre: 'Pastas secas', producible: true, esInsumo: false },
      { codigo: 'NOQUIS', nombre: 'Ñoquis', producible: true, esInsumo: false },
      { codigo: 'TAPAS', nombre: 'Tapas y masas', producible: true, esInsumo: false },
      { codigo: 'SALSAS', nombre: 'Salsas', producible: true, esInsumo: false },
      { codigo: 'INSUMOS', nombre: 'Insumos', producible: false, esInsumo: true },
      { codigo: 'OTROS', nombre: 'Otros', producible: false, esInsumo: false },
    ],
    features: { lotes: true, presentaciones: true },
    etiquetas: {
      ejemploProducto: 'Ravioles',
      ejemploSubcategoria: 'Ricota, Verdura, Jamón y queso',
      ejemploInsumos: 'harina, huevos, ricota',
    },
    // El ícono de Productos deja de ser una chuleta (🥩) y pasa a pasta.
    iconos: { productos: '🍝' },
  },
};

export const RUBRO_POR_DEFECTO: Rubro = 'carniceria';

// Resuelve la configuración a partir del nombre del rubro (ej. process.env.RUBRO).
// Si no se especifica o es desconocido, usa el rubro por defecto (carnicería).
export function resolverConfiguracion(rubro?: string): ConfiguracionNegocio {
  const clave = (rubro ?? '').trim().toLowerCase();
  if (clave in REGISTRO_RUBROS) {
    return REGISTRO_RUBROS[clave as Rubro];
  }
  return REGISTRO_RUBROS[RUBRO_POR_DEFECTO];
}
