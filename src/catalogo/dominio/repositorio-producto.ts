import { ContextoTransaccion } from '../../comun/dominio/contexto-transaccion';
import { Producto } from './producto';

// Puerto de persistencia del aggregate Producto (se implementa en infraestructura).
export abstract class RepositorioProducto {
  abstract obtenerPorId(
    id: string,
    ctx?: ContextoTransaccion,
  ): Promise<Producto | null>;

  abstract obtenerTodos(incluirInactivos: boolean): Promise<Producto[]>;

  // Busca un producto ACTIVO por nombre (sin distinguir mayúsculas).
  abstract buscarActivoPorNombre(nombre: string): Promise<Producto | null>;

  abstract guardar(
    producto: Producto,
    ctx?: ContextoTransaccion,
  ): Promise<void>;
}
