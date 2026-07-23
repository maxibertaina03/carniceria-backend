// Test de integración de Proveedores (cuentas por pagar) + Gastos + ganancia real.
// ATENCIÓN: limpia las tablas de DATABASE_URL.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { FiltroExcepcionesDominio } from '../src/comun/infraestructura/filtro-excepciones-dominio';
import { PrismaService } from '../src/comun/infraestructura/prisma.service';

describe('Proveedores, Gastos y ganancia real (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let productoId: string;
  let proveedorId: string;

  const http = () => request(app.getHttpServer());

  async function deudaProveedor(id: string): Promise<number> {
    return (await http().get(`/proveedores/${id}`).expect(200)).body.saldoAdeudado;
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
      'TRUNCATE gastos, movimientos_proveedor, proveedores, items_pedido, pedidos, items_produccion, ordenes_produccion, ingredientes_receta, recetas, items_desposte, despostes, items_venta, ventas, movimientos_cuenta, items_compra, compras, clientes, productos CASCADE',
    );

    productoId = (
      await http()
        .post('/productos')
        .send({ nombre: 'Asado', categoria: 'VACUNO', precioVentaReferencia: 12000 })
        .expect(201)
    ).body.id;
    proveedorId = (
      await http()
        .post('/proveedores')
        .send({ nombre: 'Frigorífico San José' })
        .expect(201)
    ).body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('una compra a deber genera saldo en la cuenta del proveedor', async () => {
    await http()
      .post('/compras')
      .send({
        proveedorId,
        montoAdeudado: 100000,
        items: [{ productoId, cantidad: 10, costoUnitario: 10000 }],
      })
      .expect(201);
    expect(await deudaProveedor(proveedorId)).toBe(100000);
  });

  it('un pago parcial baja lo que le debo', async () => {
    await http()
      .post(`/proveedores/${proveedorId}/pagos`)
      .send({ monto: 40000 })
      .expect(201);
    expect(await deudaProveedor(proveedorId)).toBe(60000);
  });

  it('bloquea un pago mayor a la deuda', async () => {
    await http()
      .post(`/proveedores/${proveedorId}/pagos`)
      .send({ monto: 999999 })
      .expect(400);
  });

  it('compra mixta: paga una parte y deja otra a deber', async () => {
    // Total 60.000, deja 20.000 a deber.
    await http()
      .post('/compras')
      .send({
        proveedorId,
        montoAdeudado: 20000,
        items: [{ productoId, cantidad: 6, costoUnitario: 10000 }],
      })
      .expect(201);
    expect(await deudaProveedor(proveedorId)).toBe(80000); // 60.000 + 20.000
  });

  it('exige proveedor para dejar una compra a deber', async () => {
    await http()
      .post('/compras')
      .send({
        montoAdeudado: 5000,
        items: [{ productoId, cantidad: 1, costoUnitario: 5000 }],
      })
      .expect(400);
  });

  it('un gasto adeudado suma a la cuenta del proveedor; uno pagado no', async () => {
    const deudaPrevia = await deudaProveedor(proveedorId);
    await http()
      .post('/gastos')
      .send({ concepto: 'Bolsas', monto: 15000, adeudado: true, proveedorId })
      .expect(201);
    expect(await deudaProveedor(proveedorId)).toBe(deudaPrevia + 15000);

    // Gasto pagado no toca la deuda.
    await http()
      .post('/gastos')
      .send({ concepto: 'Luz', monto: 30000, categoria: 'Servicios' })
      .expect(201);
    expect(await deudaProveedor(proveedorId)).toBe(deudaPrevia + 15000);
  });

  it('el reporte muestra la ganancia real (ventas − gastos)', async () => {
    // Vender 3 kg a 12.000 con costo 10.000 → ganancia 2.000×3 = 6.000.
    await http()
      .post('/ventas')
      .send({ items: [{ productoId, cantidad: 3, precioUnitarioVenta: 12000 }] })
      .expect(201);

    const rep = await http().get('/reportes/ganancias').expect(200);
    expect(rep.body.gananciaTotal).toBe(6000);
    // Gastos cargados: 15.000 (bolsas) + 30.000 (luz) = 45.000.
    expect(rep.body.totalGastos).toBe(45000);
    // Resultado real: 6.000 − 45.000 = −39.000 (dio pérdida en el período).
    expect(rep.body.resultado).toBe(-39000);
  });

  it('borrar una compra a deber revierte la deuda del proveedor', async () => {
    const prov = (
      await http().post('/proveedores').send({ nombre: 'Otro prov' }).expect(201)
    ).body.id;
    const compra = (
      await http()
        .post('/compras')
        .send({
          proveedorId: prov,
          montoAdeudado: 25000,
          items: [{ productoId, cantidad: 2, costoUnitario: 12500 }],
        })
        .expect(201)
    ).body;
    expect(await deudaProveedor(prov)).toBe(25000);

    await http().delete(`/compras/${compra.id}`).expect(204);
    expect(await deudaProveedor(prov)).toBe(0);
  });
});
