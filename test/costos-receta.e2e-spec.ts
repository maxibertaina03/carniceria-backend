// Test de integración del recálculo de costos según la receta.
// ATENCIÓN: limpia las tablas de DATABASE_URL (usar solo en local).
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { FiltroExcepcionesDominio } from '../src/comun/infraestructura/filtro-excepciones-dominio';
import { PrismaService } from '../src/comun/infraestructura/prisma.service';

describe('Costo de producción según receta (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let carneId: string;
  let salId: string;
  let salameId: string;
  let embutidoPremiumId: string;

  const http = () => request(app.getHttpServer());

  async function crearProducto(datos: Record<string, unknown>): Promise<string> {
    const res = await http().post('/productos').send(datos).expect(201);
    return res.body.id;
  }
  async function costoDe(id: string): Promise<number> {
    return (await http().get(`/productos/${id}`).expect(200)).body
      .costoUnitarioReferencia;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new FiltroExcepcionesDominio());
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.$executeRawUnsafe(
      'TRUNCATE items_produccion, ordenes_produccion, ingredientes_receta, recetas, items_desposte, despostes, items_venta, ventas, movimientos_cuenta, items_compra, compras, clientes, productos CASCADE',
    );

    carneId = await crearProducto({
      nombre: 'Carne para embutido',
      categoria: 'INSUMOS',
      seVende: false,
    });
    salId = await crearProducto({
      nombre: 'Sal fina',
      categoria: 'INSUMOS',
      unidadMedida: 'GRAMO',
      seVende: false,
    });
    salameId = await crearProducto({ nombre: 'Salame propio', categoria: 'CHACINADOS' });
    embutidoPremiumId = await crearProducto({
      nombre: 'Salame premium',
      categoria: 'CHACINADOS',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('al guardar la receta, el costo del producto = suma de insumos / rinde', async () => {
    // Precios de insumos: carne $9000/kg, sal $5/g.
    await http()
      .post('/compras')
      .send({
        items: [
          { productoId: carneId, cantidad: 100, costoUnitario: 9000 },
          { productoId: salId, cantidad: 2000, costoUnitario: 5 },
        ],
      })
      .expect(201);

    // Receta: 10 kg de salame = 10 kg carne + 200 g sal.
    await http()
      .put('/recetas')
      .send({
        productoTerminadoId: salameId,
        rindeCantidad: 10,
        ingredientes: [
          { productoId: carneId, cantidad: 10 },
          { productoId: salId, cantidad: 200 },
        ],
      })
      .expect(200);

    // (10×9000 + 200×5) / 10 = (90.000 + 1.000) / 10 = 9.100
    expect(await costoDe(salameId)).toBe(9100);
  });

  it('comprar un insumo más caro sube el costo del producto solo', async () => {
    // Sal ahora a $15/g.
    await http()
      .post('/compras')
      .send({ items: [{ productoId: salId, cantidad: 500, costoUnitario: 15 }] })
      .expect(201);
    // (10×9000 + 200×15) / 10 = (90.000 + 3.000) / 10 = 9.300
    expect(await costoDe(salameId)).toBe(9300);
  });

  it('editar el precio de un insumo y recalcular actualiza el costo', async () => {
    await http()
      .patch(`/productos/${carneId}`)
      .send({ costoUnitarioReferencia: 10000 })
      .expect(200);
    await http().post('/produccion/recalcular-costos').expect(200);
    // (10×10000 + 200×15) / 10 = (100.000 + 3.000) / 10 = 10.300
    expect(await costoDe(salameId)).toBe(10300);
  });

  it('resuelve una cadena: un producido usado como ingrediente de otro', async () => {
    // El salame premium lleva 1 kg del salame propio (10.300/kg) + 100 g sal.
    await http()
      .put('/recetas')
      .send({
        productoTerminadoId: embutidoPremiumId,
        rindeCantidad: 1,
        ingredientes: [
          { productoId: salameId, cantidad: 1 },
          { productoId: salId, cantidad: 100 },
        ],
      })
      .expect(200);
    // (1×10300 + 100×15) / 1 = 10.300 + 1.500 = 11.800
    expect(await costoDe(embutidoPremiumId)).toBe(11800);

    // Si sube la carne base, la cadena entera se actualiza.
    await http()
      .patch(`/productos/${carneId}`)
      .send({ costoUnitarioReferencia: 11000 })
      .expect(200);
    await http().post('/produccion/recalcular-costos').expect(200);
    // salame propio: (10×11000 + 200×15)/10 = 11.300 ; premium: 11.300 + 1.500 = 12.800
    expect(await costoDe(salameId)).toBe(11300);
    expect(await costoDe(embutidoPremiumId)).toBe(12800);
  });
});
