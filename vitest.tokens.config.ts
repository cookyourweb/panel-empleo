import { defineConfig } from 'vitest/config';

/**
 * Los tokens de color se comprueban leyendo la hoja de estilos del disco, asi
 * que corren en Node y no en el navegador. Por eso viven fuera de ng test, que
 * compila la aplicacion para el navegador y no tiene acceso al sistema de
 * ficheros. Son dos tipos de prueba distintos y conviene no mezclarlos.
 */
export default defineConfig({
  test: {
    name: 'design-system',
    environment: 'node',
    include: ['tools/**/*.test.ts'],
  },
});
