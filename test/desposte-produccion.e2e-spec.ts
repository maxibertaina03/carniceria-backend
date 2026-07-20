// Test de integración de los módulos Desposte y Producción.
// ATENCIÓN: limpia las tablas de la base configurada en DATABASE_URL
// (usar solo contra la base local de desarrollo).
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { FiltroExcepcionesDominio } from '../src/comun/infraestructura/filtro-excepciones-dominio';
import { PrismaService } from '../src/comun/infraestructura/prisma.service';

describe('Desposte y Producción (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Productos usados en el circuito.
  let carneSalameId: string;
  let salId: string;
  let tripaId: string;
  let salameId: string;

  async function crearProducto(datos: Record<string, unknown>): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/productos')
      .send(datos)
      .expect(201);
    return res.body.id;
  }

  async function stockDe(id: string): Promise<number> {
    const res = await request(app.getHttpServer())
      .get(`/productos/${id}`)
      .expect(200);
    return res.body.stockActual;
  }

  async function costoDe(id: string): Promise<number> {
    const res = await request(app.getHttpServer())
      .get(`/productos/${id}`)
      .expect(200);
    return res.body.costoUnitarioReferencia;
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

    // Corte intermedio (no se vende), insumos y el producto terminado.
    carneSalameId = await crearProducto({
      nombre: 'Carne para salame',
      categoria: 'VACUNO',
      seVende: false,
    });
    salId = await crearProducto({
      nombre: 'Sal',
      categoria: 'INSUMOS',
      unidadMedida: 'GRAMO',
      seVende: false,
    });
    tripaId = await crearProducto({
      nombre: 'Tripa',
      categoria: 'INSUMOS',
      unidadMedida: 'METRO',
      seVende: false,
    });
    salameId = await crearProducto({
      nombre: 'Salame casero',
      categoria: 'CHACINADOS',
      seVende: true,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('un producto puede marcarse como que no se vende (insumo/corte)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/productos/${salId}`)
      .expect(200);
    expect(res.body.seVende).toBe(false);
    expect(res.body.unidadMedida).toBe('GRAMO');
  });

  it('desposte: los cortes entran al stock con el costo repartido por valor', async () => {
    // Res de 30 kg a $300.000. Sale carne para salame (30 kg, único corte),
    // así que se lleva todo el costo: $10.000/kg.
    await request(app.getHttpServer())
      .post('/despostes')
      .send({
        proveedor: 'Frigorífico Test',
        pesoRes: 30,
        costoTotal: 300000,
        cortes: [
          { productoId: carneSalameId, cantidad: 30, valorReferencia: 12000 },
        ],
      })
      .expect(201);

    expect(await stockDe(carneSalameId)).toBe(30);
    expect(await costoDe(carneSalameId)).toBe(10000);
  });

  it('se compran los insumos (sal y tripa)', async () => {
    await request(app.getHttpServer())
      .post('/compras')
      .send({
        proveedor: 'Distribuidora',
        items: [
          { productoId: salId, cantidad: 1000, costoUnitario: 5 }, // sal $5/g
          { productoId: tripaId, cantidad: 100, costoUnitario: 200 }, // tripa $200/m
        ],
      })
      .expect(201);
    expect(await stockDe(salId)).toBe(1000);
    expect(await stockDe(tripaId)).toBe(100);
  });

  it('se carga la receta del salame', async () => {
    // Por cada 10 kg de salame: 10 kg carne, 100 g sal, 10 m tripa.
    await request(app.getHttpServer())
      .put('/recetas')
      .send({
        productoTerminadoId: salameId,
        rindeCantidad: 10,
        ingredientes: [
          { productoId: carneSalameId, cantidad: 10 },
          { productoId: salId, cantidad: 100 },
          { productoId: tripaId, cantidad: 10 },
        ],
      })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/recetas/producto/${salameId}`)
      .expect(200);
    expect(res.body.ingredientes).toHaveLength(3);
    expect(res.body.rindeCantidad).toBe(10);
  });

  it('producir salame descuenta ingredientes, calcula costo y suma al stock', async () => {
    // Producir 20 kg (×2): consume 20 kg carne, 200 g sal, 20 m tripa.
    // Costo: 20×10.000 + 200×5 + 20×200 = 200.000 + 1.000 + 4.000 = 205.000
    // Costo unitario del salame: 205.000 / 20 = 10.250/kg.
    const res = await request(app.getHttpServer())
      .post('/produccion')
      .send({ productoTerminadoId: salameId, cantidadProducida: 20 })
      .expect(201);

    expect(res.body.costoTotal).toBe(205000);
    expect(res.body.costoUnitario).toBe(10250);

    expect(await stockDe(carneSalameId)).toBe(10); // 30 - 20
    expect(await stockDe(salId)).toBe(800); // 1000 - 200
    expect(await stockDe(tripaId)).toBe(80); // 100 - 20
    expect(await stockDe(salameId)).toBe(20);
    expect(await costoDe(salameId)).toBe(10250);
  });

  it('bloquea la producción si falta stock de un ingrediente (y no cambia nada)', async () => {
    // Quedan 10 kg de carne; producir 20 kg más necesita 20 kg → debe fallar.
    const res = await request(app.getHttpServer())
      .post('/produccion')
      .send({ productoTerminadoId: salameId, cantidadProducida: 20 })
      .expect(400);
    expect(res.body.mensaje).toContain('Stock insuficiente');

    // Nada se movió: los stocks siguen como estaban.
    expect(await stockDe(carneSalameId)).toBe(10);
    expect(await stockDe(salId)).toBe(800);
    expect(await stockDe(salameId)).toBe(20);
  });

  it('bloquea producir un producto sin receta', async () => {
    const sinReceta = await crearProducto({
      nombre: 'Producto sin receta',
      categoria: 'CHACINADOS',
    });
    await request(app.getHttpServer())
      .post('/produccion')
      .send({ productoTerminadoId: sinReceta, cantidadProducida: 5 })
      .expect(404);
  });

  it('el salame producido ya se puede vender', async () => {
    const res = await request(app.getHttpServer())
      .post('/ventas')
      .send({
        items: [{ productoId: salameId, cantidad: 5, precioUnitarioVenta: 15000 }],
      })
      .expect(201);
    // Ganancia: (15.000 - 10.250) × 5 = 23.750
    expect(res.body.gananciaTotal).toBe(23750);
    expect(await stockDe(salameId)).toBe(15);
  });
});
