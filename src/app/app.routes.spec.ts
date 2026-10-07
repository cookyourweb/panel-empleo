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

  describe('guardas', () => {
    afterEach(() => {
      vi.resetModules();
      vi.doUnmock('@angular/core');
    });

    async function rutasConModo(esDesarrollo: boolean) {
      vi.resetModules();
      vi.doMock('@angular/core', async (importOriginal) => ({
        ...(await importOriginal<typeof import('@angular/core')>()),
        isDevMode: () => esDesarrollo,
      }));
      // Tras resetModules, la guarda debe salir del mismo grafo que las rutas.
      const { soloConSesion } = await import('./sesion/solo-con-sesion');
      return { rutas: (await import('./app.routes')).routes, soloConSesion };
    }

    it('con datos reales las rutas protegidas llevan soloConSesion y entrar ninguna', async () => {
      const { rutas, soloConSesion } = await rutasConModo(true);

      const protegidas = rutas.filter((ruta) => ruta.path !== 'entrar');
      expect(protegidas.length).toBeGreaterThan(0);
      for (const ruta of protegidas) expect(ruta.canActivate).toEqual([soloConSesion]);
      expect(rutas.find((ruta) => ruta.path === 'entrar')?.canActivate).toBeUndefined();
    });

    it('en demo ninguna ruta lleva guardas', async () => {
      const { rutas } = await rutasConModo(false);

      for (const ruta of rutas) expect(ruta.canActivate ?? []).toEqual([]);
    });
  });
});
