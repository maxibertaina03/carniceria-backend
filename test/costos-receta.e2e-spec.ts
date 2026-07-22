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
    // La sal se compra y se stockea por KILO (así la carga el usuario),
    // pero en las recetas se usa en gramos.
    salId = await crearProducto({
      nombre: 'Sal fina',
      categoria: 'INSUMOS',
      unidadMedida: 'KG',
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
          // Ambos se compran por KILO, con precio por kilo.
          { productoId: carneId, cantidad: 100, costoUnitario: 9000 },
          { productoId: salId, cantidad: 5, costoUnitario: 1500 },
        ],
      })
      .expect(201);

    // Receta: 10 kg de salame = 10 kg carne + 200 GRAMOS de sal
    // (la sal se compra por kilo pero en la receta se usa en gramos).
    await http()
      .put('/recetas')
      .send({
        productoTerminadoId: salameId,
        rindeCantidad: 10,
        ingredientes: [
          { productoId: carneId, cantidad: 10, unidad: 'KG' },
          { productoId: salId, cantidad: 200, unidad: 'GRAMO' },
        ],
      })
      .expect(200);

    // (10×9000 + 0,2 kg×1500) / 10 = (90.000 + 300) / 10 = 9.030
    expect(await costoDe(salameId)).toBe(9030);
  });

  it('los gramos de la receta no se cuentan como kilos', async () => {
    // El bug original: 28 g de una sal de $1.500 el kilo daban $42.000.
    const soloSal = await crearProducto({
      nombre: 'Chorizo de prueba',
      categoria: 'CHACINADOS',
    });
    await http()
      .put('/recetas')
      .send({
        productoTerminadoId: soloSal,
        rindeCantidad: 1,
        ingredientes: [{ productoId: salId, cantidad: 28, unidad: 'GRAMO' }],
      })
      .expect(200);
    // 28 g = 0,028 kg × $1.500 = $42 (no $42.000)
    expect(await costoDe(soloSal)).toBe(42);
  });

  it('comprar un insumo más caro sube el costo del producto solo', async () => {
    // La sal pasa a $3.000 el kilo.
    await http()
      .post('/compras')
      .send({ items: [{ productoId: salId, cantidad: 2, costoUnitario: 3000 }] })
      .expect(201);
    // (10×9000 + 0,2×3000) / 10 = (90.000 + 600) / 10 = 9.060
    expect(await costoDe(salameId)).toBe(9060);
  });

  it('editar el precio de un insumo y recalcular actualiza el costo', async () => {
    await http()
      .patch(`/productos/${carneId}`)
      .send({ costoUnitarioReferencia: 10000 })
      .expect(200);
    await http().post('/produccion/recalcular-costos').expect(200);
    // (10×10000 + 0,2×3000) / 10 = (100.000 + 600) / 10 = 10.060
    expect(await costoDe(salameId)).toBe(10060);
  });

  it('resuelve una cadena: un producido usado como ingrediente de otro', async () => {
    // El salame premium lleva 1 kg del salame propio (10.060/kg) + 100 g sal.
    await http()
      .put('/recetas')
      .send({
        productoTerminadoId: embutidoPremiumId,
        rindeCantidad: 1,
        ingredientes: [
          { productoId: salameId, cantidad: 1, unidad: 'KG' },
          { productoId: salId, cantidad: 100, unidad: 'GRAMO' },
        ],
      })
      .expect(200);
    // (1×10060 + 0,1 kg×3000) / 1 = 10.060 + 300 = 10.360
    expect(await costoDe(embutidoPremiumId)).toBe(10360);

    // Si sube la carne base, la cadena entera se actualiza.
    await http()
      .patch(`/productos/${carneId}`)
      .send({ costoUnitarioReferencia: 11000 })
      .expect(200);
    await http().post('/produccion/recalcular-costos').expect(200);
    // salame propio: (10×11000 + 0,2×3000)/10 = 11.060 ; premium: 11.060 + 300 = 11.360
    expect(await costoDe(salameId)).toBe(11060);
    expect(await costoDe(embutidoPremiumId)).toBe(11360);
  });
});
