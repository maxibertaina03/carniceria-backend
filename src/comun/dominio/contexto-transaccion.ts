// Marcador opaco de una transacción en curso. Los repositorios y puertos lo
// reciben para que varias operaciones (ej. registrar venta + descontar stock
// + generar deuda) se confirmen o cancelen juntas. La capa de dominio no
// conoce su contenido real (en infraestructura es un cliente Prisma).
export type ContextoTransaccion = unknown;
