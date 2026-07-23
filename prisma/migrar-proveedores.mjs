// Convierte las compras viejas que tienen el proveedor cargado a mano (texto)
// pero sin cuenta, en proveedores con cuenta, y las vincula. Así aparecen en
// la sección Proveedores. Idempotente: se puede correr varias veces.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrar() {
  const compras = await prisma.compra.findMany({
    where: { proveedorId: null, proveedor: { not: null } },
  });

  // Índice de proveedores existentes por nombre (sin distinguir mayúsculas).
  const existentes = await prisma.proveedor.findMany();
  const porNombre = new Map(
    existentes.map((p) => [p.nombre.trim().toLowerCase(), p]),
  );

  let creados = 0;
  let vinculadas = 0;
  for (const compra of compras) {
    const nombre = compra.proveedor.trim();
    if (!nombre) continue;
    const clave = nombre.toLowerCase();

    let proveedor = porNombre.get(clave);
    if (!proveedor) {
      proveedor = await prisma.proveedor.create({ data: { nombre } });
      porNombre.set(clave, proveedor);
      creados++;
    }
    await prisma.compra.update({
      where: { id: compra.id },
      data: { proveedorId: proveedor.id },
    });
    vinculadas++;
  }

  console.log(`Proveedores creados: ${creados} | Compras vinculadas: ${vinculadas}`);
  const total = await prisma.proveedor.count();
  console.log(`Total de proveedores ahora: ${total}`);
}

migrar()
  .catch((error) => {
    console.error('Error en la migración:', error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
