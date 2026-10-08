import { routes } from './app.routes';
import { BienvenidaPage } from './bienvenida/bienvenida.page';
import { EntradaPage } from './entrada/entrada.page';
import { soloConSesion } from './sesion/solo-con-sesion';

describe('routes', () => {
  const entrar = routes.find((ruta) => ruta.path === 'entrar');
  const bienvenida = routes.find((ruta) => ruta.path === '');
  const panel = routes.find((ruta) => ruta.path === 'panel');
  const comodin = routes.find((ruta) => ruta.path === '**');

  it('tiene la ruta entrar con titulo', () => {
    expect(entrar?.title).toBe('Entrar');
  });

  it('carga EntradaPage de forma diferida', async () => {
    expect(entrar?.component).toBeUndefined();
    expect(await (entrar?.loadComponent as () => Promise<unknown>)()).toBe(EntradaPage);
  });

  it('la raiz es la bienvenida publica, cargada de forma diferida', async () => {
    expect(bienvenida?.title).toBe('Bienvenida');
    expect(bienvenida?.pathMatch).toBe('full');
    expect(bienvenida?.canActivate).toBeUndefined();
    expect(await (bienvenida?.loadComponent as () => Promise<unknown>)()).toBe(BienvenidaPage);
  });

  it('el panel cuelga de /panel con la lista y la ficha', () => {
    expect(panel?.children?.map((hija) => hija.path)).toEqual(['', 'candidatura/:id']);
  });

  it('el panel exige sesion en cualquier entorno', () => {
    expect(panel?.canActivate).toEqual([soloConSesion]);
  });

  it('solo entrar y la bienvenida son publicas', () => {
    const publicas = routes.filter((ruta) => !ruta.canActivate?.length).map((ruta) => ruta.path);

    expect(publicas.sort()).toEqual(['', '**', 'entrar']);
  });

  it('una ruta desconocida lleva a la bienvenida, no al panel', () => {
    expect(comodin?.redirectTo).toBe('');
  });
});
