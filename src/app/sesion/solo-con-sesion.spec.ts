import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { CONFIGURACION_DE_SESION } from './configuracion';
import { Sesion } from './sesion';
import { soloConSesion } from './solo-con-sesion';
import { tokenConPayload, tokenQueCaduca } from './token-de-prueba';

const URL_API = 'http://api.prueba';
const USUARIA = { sub: 'sub-1', email: 'invitada@ejemplo.test', nombre: 'Invitada' };

const ahoraEnSegundos = () => Math.floor(Date.now() / 1000);

describe('soloConSesion', () => {
  let sesion: Sesion;
  let router: Router;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CONFIGURACION_DE_SESION, useValue: { urlApi: URL_API, idCliente: 'cliente' } },
      ],
    });
    sesion = TestBed.inject(Sesion);
    router = TestBed.inject(Router);
    http = TestBed.inject(HttpTestingController);
  });

  async function entrarConToken(token: string) {
    const resultado = sesion.entrar(token);
    http.expectOne(`${URL_API}/yo`).flush(USUARIA);
    await resultado;
  }

  function ejecutar(url = '/candidatura/3') {
    return TestBed.runInInjectionContext(() =>
      soloConSesion({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
  }

  function aEntrar(volver: string): string {
    return router.serializeUrl(router.createUrlTree(['/entrar'], { queryParams: { volver } }));
  }

  it('deja pasar con sesion y token vigente', async () => {
    await entrarConToken(tokenQueCaduca(ahoraEnSegundos() + 600));

    expect(ejecutar()).toBe(true);
    expect(sesion.activa()).toBe(true);
  });

  it('sin sesion manda a entrar recordando a donde iba', () => {
    const resultado = ejecutar('/candidatura/3');

    expect(resultado).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(resultado as UrlTree)).toBe(aEntrar('/candidatura/3'));
  });

  it('con token caducado cierra la sesion y manda a entrar', async () => {
    await entrarConToken(tokenQueCaduca(ahoraEnSegundos() - 10));

    const resultado = ejecutar('/');

    expect(sesion.activa()).toBe(false);
    expect(sesion.token()).toBeNull();
    expect(router.serializeUrl(resultado as UrlTree)).toBe(aEntrar('/'));
  });

  it('con un token que no se puede decodificar cierra la sesion y manda a entrar', async () => {
    await entrarConToken('esto-no-es-un-jwt');

    const resultado = ejecutar('/');

    expect(sesion.activa()).toBe(false);
    expect(resultado).toBeInstanceOf(UrlTree);
  });

  it('con un payload sin exp numerico no cuenta como sesion valida', async () => {
    await entrarConToken(tokenConPayload({ exp: 'mañana' }));

    expect(ejecutar()).toBeInstanceOf(UrlTree);
    expect(sesion.activa()).toBe(false);
  });
});
