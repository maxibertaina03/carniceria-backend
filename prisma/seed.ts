// Semilla de datos: productos típicos del rubro.
// Se cargan con stock 0 y precios 0; se completan con la primera compra
// o editando el producto desde la aplicación.
import { PrismaClient, UnidadMedida } from '@prisma/client';

const prisma = new PrismaClient();

interface ProductoSemilla {
  nombre: string;
  // Código de categoría (según el rubro). El seed actual es de carnicería.
  categoria: string;
  unidadMedida?: UnidadMedida;
  // Los insumos y cortes intermedios no se venden al mostrador.
  seVende?: boolean;
}

const productosIniciales: ProductoSemilla[] = [
  // Mercadería que se vende al mostrador.
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
  // Insumos de producción (no se venden sueltos).
  { nombre: 'Sal', categoria: 'INSUMOS', unidadMedida: 'GRAMO', seVende: false },
  { nombre: 'Pimienta', categoria: 'INSUMOS', unidadMedida: 'GRAMO', seVende: false },
  { nombre: 'Tripa', categoria: 'INSUMOS', unidadMedida: 'METRO', seVende: false },
  // Cortes intermedios que salen del desposte y se usan para producir. Van en
  // INSUMOS para que aparezcan como ingredientes al armar recetas (no se venden).
  { nombre: 'Carne para salame', categoria: 'INSUMOS', seVende: false },
  { nombre: 'Carne para chorizo', categoria: 'INSUMOS', seVende: false },
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
