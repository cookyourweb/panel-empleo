import { elegirListaDeEspera } from './elegir-lista-de-espera';
import { ListaDeEsperaDemo } from './lista-de-espera-demo';
import { ListaDeEsperaHttp } from './lista-de-espera-http';

describe('elegirListaDeEspera', () => {
  it('en desarrollo, la demo: no se apunta a nadie de verdad', () => {
    expect(elegirListaDeEspera(true)).toBe(ListaDeEsperaDemo);
  });

  it('en produccion, el adaptador http', () => {
    expect(elegirListaDeEspera(false)).toBe(ListaDeEsperaHttp);
  });
});

describe('ListaDeEsperaDemo', () => {
  it('apuntar no hace nada ni falla', async () => {
    await expect(new ListaDeEsperaDemo().apuntar({ nombre: 'Ana', email: 'a@b.test' })).resolves.toBeUndefined();
  });
});
