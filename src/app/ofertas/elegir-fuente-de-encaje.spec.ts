import { elegirFuenteDeEncaje } from './elegir-fuente-de-encaje';
import { FuenteDeEncajeDemo } from './fuente-de-encaje-demo';
import { FuenteDeEncajeHttp } from './fuente-de-encaje-http';

describe('elegirFuenteDeEncaje', () => {
  it('con backend usa el adaptador http', () => {
    expect(elegirFuenteDeEncaje(true)).toBe(FuenteDeEncajeHttp);
  });

  it('sin backend usa la demo: ningun dato sale del navegador', () => {
    expect(elegirFuenteDeEncaje(false)).toBe(FuenteDeEncajeDemo);
  });
});
