// Test de integración de Pedidos. ATENCIÓN: limpia las tablas de DATABASE_URL.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { FiltroExcepcionesDominio } from '../src/comun/infraestructura/filtro-excepciones-dominio';
import { PrismaService } from '../src/comun/infraestructura/prisma.service';

describe('Pedidos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let productoId: string;
  let clienteId: string;

  const http = () => request(app.getHttpServer());

  async function stockDe(id: string): Promise<number> {
    return (await http().get(`/productos/${id}`).expect(200)).body.stockActual;
  }
  async function saldoDe(id: string): Promise<number> {
    return (await http().get(`/clientes/${id}`).expect(200)).body.saldoDeudor;
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
      'TRUNCATE items_pedido, pedidos, items_produccion, ordenes_produccion, ingredientes_receta, recetas, items_desposte, despostes, items_venta, ventas, movimientos_cuenta, items_compra, compras, clientes, productos CASCADE',
    );

    productoId = (
      await http()
        .post('/productos')
        .send({
          nombre: 'Matambre',
          categoria: 'VACUNO',
          stockInicial: 10,
          precioVentaReferencia: 14000,
        })
        .expect(201)
    ).body.id;
    clienteId = (
      await http().post('/clientes').send({ nombre: 'Doña Rosa' }).expect(201)
    ).body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('anotar un pedido no mueve el stock', async () => {
    const res = await http()
      .post('/pedidos')
      .send({
        nombreContacto: 'Juan',
        fechaEntrega: '2026-07-25',
        items: [{ productoId, cantidad: 1, precioUnitario: 14000 }],
      })
      .expect(201);
    expect(res.body.estado).toBe('PENDIENTE');
    expect(res.body.total).toBe(14000);
    // El stock sigue intacto: el pedido es solo un compromiso.
    expect(await stockDe(productoId)).toBe(10);
  });

  it('entregar al contado descuenta stock y genera la venta', async () => {
    const pedido = (
      await http()
        .post('/pedidos')
        .send({
          nombreContacto: 'Pedro',
          items: [{ productoId, cantidad: 2, precioUnitario: 14000 }],
        })
        .expect(201)
    ).body;

    // Se confirma el peso real (2,3 kg) al entregar.
    const entregado = await http()
      .post(`/pedidos/${pedido.id}/entregar`)
      .send({
        items: [{ productoId, cantidad: 2.3, precioUnitarioVenta: 14000 }],
      })
      .expect(201);
    expect(entregado.body.estado).toBe('ENTREGADO');
    expect(entregado.body.ventaId).toBeTruthy();

    expect(await stockDe(productoId)).toBe(7.7); // 10 - 2,3

    // Quedó registrada como venta.
    const ventas = await http().get('/ventas').expect(200);
    expect(ventas.body.some((v: { id: string }) => v.id === entregado.body.ventaId)).toBe(
      true,
    );
  });

  it('entregar fiado a un cliente genera su deuda', async () => {
    const pedido = (
      await http()
        .post('/pedidos')
        .send({
          clienteId,
          items: [{ productoId, cantidad: 1, precioUnitario: 14000 }],
        })
        .expect(201)
    ).body;

    await http()
      .post(`/pedidos/${pedido.id}/entregar`)
      .send({
        montoFiado: 14000,
        items: [{ productoId, cantidad: 1, precioUnitarioVenta: 14000 }],
      })
      .expect(201);

    expect(await saldoDe(clienteId)).toBe(14000);
  });

  it('cancelar un pedido no toca nada', async () => {
    const stockPrevio = await stockDe(productoId);
    const pedido = (
      await http()
        .post('/pedidos')
        .send({
          nombreContacto: 'Ana',
          items: [{ productoId, cantidad: 1 }],
        })
        .expect(201)
    ).body;
    const res = await http().post(`/pedidos/${pedido.id}/cancelar`).expect(201);
    expect(res.body.estado).toBe('CANCELADO');
    expect(await stockDe(productoId)).toBe(stockPrevio);
  });

  it('bloquea la entrega si no hay stock suficiente (y el pedido sigue pendiente)', async () => {
    const pedido = (
      await http()
        .post('/pedidos')
        .send({
          nombreContacto: 'Luis',
          items: [{ productoId, cantidad: 100, precioUnitario: 14000 }],
        })
        .expect(201)
    ).body;

    const res = await http()
      .post(`/pedidos/${pedido.id}/entregar`)
      .send({ items: [{ productoId, cantidad: 100, precioUnitarioVenta: 14000 }] })
      .expect(400);
    expect(res.body.mensaje).toContain('Stock insuficiente');

    const sigue = await http().get(`/pedidos/${pedido.id}`).expect(200);
    expect(sigue.body.estado).toBe('PENDIENTE');
  });

  it('no se puede entregar dos veces el mismo pedido', async () => {
    const pedido = (
      await http()
        .post('/pedidos')
        .send({
          nombreContacto: 'Marta',
          items: [{ productoId, cantidad: 1, precioUnitario: 14000 }],
        })
        .expect(201)
    ).body;
    await http()
      .post(`/pedidos/${pedido.id}/entregar`)
      .send({ items: [{ productoId, cantidad: 1, precioUnitarioVenta: 14000 }] })
      .expect(201);
    await http()
      .post(`/pedidos/${pedido.id}/entregar`)
      .send({ items: [{ productoId, cantidad: 1, precioUnitarioVenta: 14000 }] })
      .expect(400);
  });
});
