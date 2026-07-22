// Test de integración del flujo completo de la carnicería.
// ATENCIÓN: limpia todas las tablas de la base configurada en DATABASE_URL
// (usar solo contra la base local de desarrollo).
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { FiltroExcepcionesDominio } from '../src/comun/infraestructura/filtro-excepciones-dominio';
import { PrismaService } from '../src/comun/infraestructura/prisma.service';

describe('Flujo completo de la carnicería (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let productoId: string;
  let clienteId: string;

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
      'TRUNCATE items_venta, ventas, movimientos_cuenta, items_compra, compras, clientes, productos CASCADE',
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('crea un producto nuevo', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/productos')
      .send({ nombre: 'Bondiola', categoria: 'CERDO' })
      .expect(201);
    productoId = respuesta.body.id;
    expect(respuesta.body.stockActual).toBe(0);
    expect(respuesta.body.unidadMedida).toBe('KG');
  });

  it('se puede crear un producto con stock inicial y ajustarlo después', async () => {
    // Al empezar a usar el sistema ya hay mercadería en la heladera.
    const creado = await request(app.getHttpServer())
      .post('/productos')
      .send({
        nombre: 'Costeleta',
        categoria: 'CERDO',
        stockInicial: 15,
        costoUnitarioReferencia: 7000,
      })
      .expect(201);
    expect(creado.body.stockActual).toBe(15);

    // Después de contar, se corrige a la cantidad real (reemplaza, no suma).
    const ajustado = await request(app.getHttpServer())
      .post(`/productos/${creado.body.id}/ajustar-stock`)
      .send({ cantidad: 12.5 })
      .expect(201);
    expect(ajustado.body.stockActual).toBe(12.5);

    // No se puede dejar el stock en negativo.
    await request(app.getHttpServer())
      .post(`/productos/${creado.body.id}/ajustar-stock`)
      .send({ cantidad: -2 })
      .expect(400);
  });

  it('rechaza un producto con nombre duplicado', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/productos')
      .send({ nombre: 'bondiola', categoria: 'CERDO' })
      .expect(400);
    expect(respuesta.body.mensaje).toContain('Ya existe un producto');
  });

  it('registra una compra: suma stock y actualiza el costo de referencia', async () => {
    await request(app.getHttpServer())
      .post('/compras')
      .send({
        proveedor: 'Frigorífico San José',
        items: [{ productoId, cantidad: 10, costoUnitario: 1000 }],
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.total).toBe(10000);
      });

    const producto = await request(app.getHttpServer())
      .get(`/productos/${productoId}`)
      .expect(200);
    expect(producto.body.stockActual).toBe(10);
    expect(producto.body.costoUnitarioReferencia).toBe(1000);
  });

  it('crea un cliente', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/clientes')
      .send({ nombre: 'Doña Rosa', telefono: '3564-111222' })
      .expect(201);
    clienteId = respuesta.body.id;
    expect(respuesta.body.saldoDeudor).toBe(0);
  });

  it('venta al contado: descuenta stock y calcula ganancia', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/ventas')
      .send({
        items: [{ productoId, cantidad: 2, precioUnitarioVenta: 1500 }],
      })
      .expect(201);
    expect(respuesta.body.formaPago).toBe('CONTADO');
    expect(respuesta.body.total).toBe(3000);
    expect(respuesta.body.gananciaTotal).toBe(1000);

    const producto = await request(app.getHttpServer())
      .get(`/productos/${productoId}`)
      .expect(200);
    expect(producto.body.stockActual).toBe(8);
  });

  it('venta toda fiada: genera la deuda del cliente', async () => {
    await request(app.getHttpServer())
      .post('/ventas')
      .send({
        clienteId,
        montoFiado: 4500,
        items: [{ productoId, cantidad: 3, precioUnitarioVenta: 1500 }],
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.formaPago).toBe('FIADO');
      });

    const cliente = await request(app.getHttpServer())
      .get(`/clientes/${clienteId}`)
      .expect(200);
    expect(cliente.body.saldoDeudor).toBe(4500);
  });

  it('venta mixta: parte contado, parte fiado', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/ventas')
      .send({
        clienteId,
        montoFiado: 500,
        items: [{ productoId, cantidad: 1, precioUnitarioVenta: 1500 }],
      })
      .expect(201);
    expect(respuesta.body.formaPago).toBe('MIXTO');
    expect(respuesta.body.montoContado).toBe(1000);

    const cliente = await request(app.getHttpServer())
      .get(`/clientes/${clienteId}`)
      .expect(200);
    expect(cliente.body.saldoDeudor).toBe(5000);
  });

  it('rechaza fiar sin indicar cliente', async () => {
    await request(app.getHttpServer())
      .post('/ventas')
      .send({
        montoFiado: 100,
        items: [{ productoId, cantidad: 1, precioUnitarioVenta: 1500 }],
      })
      .expect(400);
  });

  it('bloquea la venta si no hay stock suficiente (y no cambia nada)', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/ventas')
      .send({
        clienteId,
        montoFiado: 150000,
        items: [{ productoId, cantidad: 100, precioUnitarioVenta: 1500 }],
      })
      .expect(400);
    expect(respuesta.body.mensaje).toContain('Stock insuficiente');

    const producto = await request(app.getHttpServer())
      .get(`/productos/${productoId}`)
      .expect(200);
    expect(producto.body.stockActual).toBe(4);

    const cliente = await request(app.getHttpServer())
      .get(`/clientes/${clienteId}`)
      .expect(200);
    expect(cliente.body.saldoDeudor).toBe(5000);
  });

  it('registra un pago parcial y actualiza el saldo', async () => {
    const respuesta = await request(app.getHttpServer())
      .post(`/clientes/${clienteId}/pagos`)
      .send({ monto: 2000, observaciones: 'Pago parcial' })
      .expect(201);
    expect(respuesta.body.cliente.saldoDeudor).toBe(3000);
  });

  it('rechaza un pago mayor a la deuda', async () => {
    await request(app.getHttpServer())
      .post(`/clientes/${clienteId}/pagos`)
      .send({ monto: 99999 })
      .expect(400);
  });

  it('muestra el historial completo de movimientos', async () => {
    const respuesta = await request(app.getHttpServer())
      .get(`/clientes/${clienteId}/movimientos`)
      .expect(200);
    const tipos = respuesta.body.movimientos.map((m: { tipo: string }) => m.tipo);
    expect(tipos.filter((t: string) => t === 'CARGO')).toHaveLength(2);
    expect(tipos.filter((t: string) => t === 'PAGO')).toHaveLength(1);
  });

  it('no permite desactivar un cliente con deuda', async () => {
    await request(app.getHttpServer())
      .delete(`/clientes/${clienteId}`)
      .expect(400);
  });

  it('reporte de ganancias del período', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/reportes/ganancias')
      .expect(200);
    expect(respuesta.body.cantidadVentas).toBe(3);
    expect(respuesta.body.totalVendido).toBe(9000);
    // Ganancia: 6 kg vendidos con $500 de margen por kg.
    expect(respuesta.body.gananciaTotal).toBe(3000);
    expect(respuesta.body.totalFiado).toBe(5000);
  });

  it('reporte de productos más vendidos', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/reportes/productos-mas-vendidos')
      .expect(200);
    expect(respuesta.body[0].nombre).toBe('Bondiola');
    expect(respuesta.body[0].cantidadVendida).toBe(6);
    expect(respuesta.body[0].gananciaGenerada).toBe(3000);
  });

  it('reporte de deudas pendientes', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/reportes/deudas')
      .expect(200);
    expect(respuesta.body).toHaveLength(1);
    expect(respuesta.body[0].nombre).toBe('Doña Rosa');
    expect(respuesta.body[0].saldoDeudor).toBe(3000);
  });

  it('reporte de stock actual', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/reportes/stock')
      .expect(200);
    const bondiola = respuesta.body.find(
      (p: { nombre: string }) => p.nombre === 'Bondiola',
    );
    expect(bondiola.stockActual).toBe(4);
  });
});
