// Test de integración del borrado con reversión (compras, ventas, producción,
// desposte y clientes). ATENCIÓN: limpia las tablas de DATABASE_URL.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { FiltroExcepcionesDominio } from '../src/comun/infraestructura/filtro-excepciones-dominio';
import { PrismaService } from '../src/comun/infraestructura/prisma.service';

describe('Eliminar con reversión (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let productoId: string;
  let insumoId: string;
  let terminadoId: string;

  const http = () => request(app.getHttpServer());

  async function crearProducto(datos: Record<string, unknown>): Promise<string> {
    const res = await http().post('/productos').send(datos).expect(201);
    return res.body.id;
  }
  async function stockDe(id: string): Promise<number> {
    const res = await http().get(`/productos/${id}`).expect(200);
    return res.body.stockActual;
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

    productoId = await crearProducto({ nombre: 'Asado', categoria: 'VACUNO' });
    insumoId = await crearProducto({
      nombre: 'Carne para hamburguesa',
      categoria: 'INSUMOS',
      seVende: false,
    });
    terminadoId = await crearProducto({
      nombre: 'Hamburguesa',
      categoria: 'HAMBURGUESAS',
      subcategoria: 'Vaca',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('borrar una compra revierte el stock que había sumado', async () => {
    const compra = await http()
      .post('/compras')
      .send({ items: [{ productoId, cantidad: 10, costoUnitario: 8000 }] })
      .expect(201);
    expect(await stockDe(productoId)).toBe(10);

    await http().delete(`/compras/${compra.body.id}`).expect(204);
    expect(await stockDe(productoId)).toBe(0);
  });

  it('bloquea borrar una compra si el stock ya se usó', async () => {
    const compra = await http()
      .post('/compras')
      .send({ items: [{ productoId, cantidad: 5, costoUnitario: 8000 }] })
      .expect(201);
    // Vendo 3 de los 5 → ya no se puede revertir la compra entera.
    await http()
      .post('/ventas')
      .send({ items: [{ productoId, cantidad: 3, precioUnitarioVenta: 12000 }] })
      .expect(201);

    const res = await http().delete(`/compras/${compra.body.id}`).expect(400);
    expect(res.body.mensaje).toContain('Stock insuficiente');
    // El stock no cambió por el intento fallido.
    expect(await stockDe(productoId)).toBe(2);
  });

  it('borrar una venta fiada devuelve stock y revierte la deuda del cliente', async () => {
    // Reponer stock.
    await http()
      .post('/compras')
      .send({ items: [{ productoId, cantidad: 10, costoUnitario: 8000 }] })
      .expect(201);
    const stockPrevio = await stockDe(productoId);

    const clienteId = (
      await http().post('/clientes').send({ nombre: 'Deudor' }).expect(201)
    ).body.id;

    const venta = await http()
      .post('/ventas')
      .send({
        clienteId,
        montoFiado: 24000,
        items: [{ productoId, cantidad: 2, precioUnitarioVenta: 12000 }],
      })
      .expect(201);
    expect((await http().get(`/clientes/${clienteId}`)).body.saldoDeudor).toBe(24000);

    await http().delete(`/ventas/${venta.body.id}`).expect(204);
    // Al borrar la venta, el stock vuelve al valor previo a esa venta.
    expect(await stockDe(productoId)).toBe(stockPrevio);
    expect((await http().get(`/clientes/${clienteId}`)).body.saldoDeudor).toBe(0);
    // El historial de movimientos quedó vacío.
    const mov = await http().get(`/clientes/${clienteId}/movimientos`).expect(200);
    expect(mov.body.movimientos).toHaveLength(0);
  });

  it('bloquea borrar una venta fiada si el cliente ya pagó parte', async () => {
    const clienteId = (
      await http().post('/clientes').send({ nombre: 'Pagador' }).expect(201)
    ).body.id;
    await http()
      .post('/compras')
      .send({ items: [{ productoId, cantidad: 5, costoUnitario: 8000 }] })
      .expect(201);
    const venta = await http()
      .post('/ventas')
      .send({
        clienteId,
        montoFiado: 12000,
        items: [{ productoId, cantidad: 1, precioUnitarioVenta: 12000 }],
      })
      .expect(201);
    await http().post(`/clientes/${clienteId}/pagos`).send({ monto: 5000 }).expect(201);

    const res = await http().delete(`/ventas/${venta.body.id}`).expect(400);
    expect(res.body.mensaje).toContain('ya pagó parte');
  });

  it('borrar una producción devuelve los ingredientes y quita el terminado', async () => {
    // Stock de insumo y receta.
    await http()
      .post('/compras')
      .send({ items: [{ productoId: insumoId, cantidad: 20, costoUnitario: 6000 }] })
      .expect(201);
    await http()
      .put('/recetas')
      .send({
        productoTerminadoId: terminadoId,
        rindeCantidad: 10,
        ingredientes: [{ productoId: insumoId, cantidad: 10 }],
      })
      .expect(200);

    const orden = await http()
      .post('/produccion')
      .send({ productoTerminadoId: terminadoId, cantidadProducida: 10 })
      .expect(201);
    expect(await stockDe(insumoId)).toBe(10); // 20 - 10
    expect(await stockDe(terminadoId)).toBe(10);

    await http().delete(`/produccion/${orden.body.id}`).expect(204);
    expect(await stockDe(insumoId)).toBe(20); // devuelto
    expect(await stockDe(terminadoId)).toBe(0); // quitado
  });

  it('borrar un desposte revierte el stock de los cortes', async () => {
    const desposte = await http()
      .post('/despostes')
      .send({
        pesoRes: 20,
        costoTotal: 100000,
        cortes: [{ productoId: insumoId, cantidad: 20, valorReferencia: 5000 }],
      })
      .expect(201);
    const conDesposte = await stockDe(insumoId);

    await http().delete(`/despostes/${desposte.body.id}`).expect(204);
    expect(await stockDe(insumoId)).toBe(conDesposte - 20);
  });

  it('cliente sin historial se puede borrar; con historial se bloquea', async () => {
    const limpio = (
      await http().post('/clientes').send({ nombre: 'Sin historial' }).expect(201)
    ).body.id;
    await http().delete(`/clientes/${limpio}/definitivo`).expect(204);
    await http().get(`/clientes/${limpio}`).expect(404);

    // Un cliente con ventas asociadas no se puede borrar definitivamente.
    const conVenta = (
      await http().post('/clientes').send({ nombre: 'Con venta' }).expect(201)
    ).body.id;
    await http()
      .post('/compras')
      .send({ items: [{ productoId, cantidad: 3, costoUnitario: 8000 }] })
      .expect(201);
    await http()
      .post('/ventas')
      .send({
        clienteId: conVenta,
        items: [{ productoId, cantidad: 1, precioUnitarioVenta: 12000 }],
      })
      .expect(201);
    await http().delete(`/clientes/${conVenta}/definitivo`).expect(400);
  });
});
