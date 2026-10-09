import { AltaPage } from './alta/alta.page';
import { conPerfil, sinPerfil } from './alta/con-perfil';
import { ExtractorDeCv } from './alta/extractor-de-cv';
import { RepositorioDePerfil } from './alta/repositorio-de-perfil';
import { routes } from './app.routes';
import { BienvenidaPage } from './bienvenida/bienvenida.page';
import { CuentaPage } from './cuenta/cuenta.page';
import { RepositorioDeCuenta } from './cuenta/repositorio-de-cuenta';
import { EntradaPage } from './entrada/entrada.page';
import { soloConSesion } from './sesion/solo-con-sesion';

describe('routes', () => {
  const entrar = routes.find((ruta) => ruta.path === 'entrar');
  const bienvenida = routes.find((ruta) => ruta.path === '');
  const panel = routes.find((ruta) => ruta.path === 'panel');
  const alta = routes.find((ruta) => ruta.path === 'alta');
  const cuenta = routes.find((ruta) => ruta.path === 'cuenta');
  const comodin = routes.find((ruta) => ruta.path === '**');

  it('tiene la ruta entrar con titulo', () => {
    expect(entrar?.title).toBe('Entrar');
  });

  it('carga EntradaPage de forma diferida', async () => {
    expect(entrar?.component).toBeUndefined();
    expect(await (entrar?.loadComponent as () => Promise<unknown>)()).toBe(EntradaPage);
  });

  it('la raiz es la bienvenida publica, cargada de forma diferida', async () => {
    expect(bienvenida?.title).toBe('Empleo | CookYourWebAI');
    expect(bienvenida?.pathMatch).toBe('full');
    expect(bienvenida?.canActivate).toBeUndefined();
    expect(await (bienvenida?.loadComponent as () => Promise<unknown>)()).toBe(BienvenidaPage);
  });

  it('el panel cuelga de /panel con la lista y la ficha', () => {
    expect(panel?.children?.map((hija) => hija.path)).toEqual(['', 'candidatura/:id']);
  });

  it('el panel exige sesion en cualquier entorno', () => {
    expect(panel?.canActivate?.[0]).toBe(soloConSesion);
  });

  it('S5.1: el panel sin perfil lleva al alta, tras comprobar la sesion', () => {
    expect(panel?.canActivate).toEqual([soloConSesion, conPerfil]);
  });

  it('S5.2: el alta exige sesion y no se repite con perfil', () => {
    expect(alta?.canActivate).toEqual([soloConSesion, sinPerfil]);
  });

  it('el alta carga AltaPage de forma diferida con sus puertos', async () => {
    expect(alta?.component).toBeUndefined();
    expect(await (alta?.loadComponent as () => Promise<unknown>)()).toBe(AltaPage);
    const tokens = (alta?.providers as { provide: unknown }[]).map((p) => p.provide);
    expect(tokens).toEqual(expect.arrayContaining([RepositorioDePerfil, ExtractorDeCv]));
  });

  it('la cuenta exige sesion y carga CuentaPage de forma diferida con su puerto', async () => {
    expect(cuenta?.canActivate).toEqual([soloConSesion]);
    expect(cuenta?.component).toBeUndefined();
    expect(await (cuenta?.loadComponent as () => Promise<unknown>)()).toBe(CuentaPage);
    const tokens = (cuenta?.providers as { provide: unknown }[]).map((p) => p.provide);
    expect(tokens).toEqual([RepositorioDeCuenta]);
  });

  it('solo entrar y la bienvenida son publicas', () => {
    const publicas = routes.filter((ruta) => !ruta.canActivate?.length).map((ruta) => ruta.path);

    expect(publicas.sort()).toEqual(['', '**', 'entrar']);
  });

  it('una ruta desconocida lleva a la bienvenida, no al panel', () => {
    expect(comodin?.redirectTo).toBe('');
  });
});
