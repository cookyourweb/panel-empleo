import { routes } from './app.routes';
import { EntradaPage } from './entrada/entrada.page';

describe('routes', () => {
  const entrar = routes.find((ruta) => ruta.path === 'entrar');

  it('tiene la ruta entrar con titulo', () => {
    expect(entrar?.title).toBe('Entrar');
  });

  it('carga EntradaPage de forma diferida', async () => {
    expect(entrar?.component).toBeUndefined();
    expect(await (entrar?.loadComponent as () => Promise<unknown>)()).toBe(EntradaPage);
  });

  it('no tapa la ruta de candidaturas', () => {
    expect(routes.indexOf(entrar!)).toBeLessThan(routes.findIndex((ruta) => ruta.path === ''));
  });
});
