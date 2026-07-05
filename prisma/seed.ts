// Semilla de datos: productos típicos del rubro.
// Se cargan con stock 0 y precios 0; se completan con la primera compra
// o editando el producto desde la aplicación.
import { PrismaClient, CategoriaProducto } from '@prisma/client';

const prisma = new PrismaClient();

const productosIniciales: { nombre: string; categoria: CategoriaProducto }[] = [
  { nombre: 'Milanesas', categoria: 'VACUNO' },
  { nombre: 'Asado', categoria: 'VACUNO' },
  { nombre: 'Carne picada', categoria: 'VACUNO' },
  { nombre: 'Matambre', categoria: 'VACUNO' },
  { nombre: 'Vacío', categoria: 'VACUNO' },
  { nombre: 'Carne de cerdo', categoria: 'CERDO' },
  { nombre: 'Pollo', categoria: 'AVE' },
  { nombre: 'Salame', categoria: 'CHACINADOS' },
  { nombre: 'Chorizo', categoria: 'CHACINADOS' },
  { nombre: 'Morcilla', categoria: 'CHACINADOS' },
];

async function sembrar() {
  for (const producto of productosIniciales) {
    const existente = await prisma.producto.findFirst({
      where: { nombre: producto.nombre },
    });
    if (!existente) {
      await prisma.producto.create({ data: producto });
      console.log(`Producto creado: ${producto.nombre}`);
    }
  }
  console.log('Semilla completada.');
}

sembrar()
  .catch((error) => {
    console.error('Error al sembrar datos:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
