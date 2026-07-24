import { SetMetadata } from '@nestjs/common';

// Marca una ruta como pública: la clave de la API no se le exige.
// Se usa para el chequeo de salud que consulta el servidor de hosting.
export const ES_PUBLICO = 'es_publico';
export const Publico = () => SetMetadata(ES_PUBLICO, true);
