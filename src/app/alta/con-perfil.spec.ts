import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';
import { conPerfil, ESPERA_MAXIMA_DE_PERFIL, sinPerfil } from './con-perfil';

const URL_API = 'http://api.prueba';
const USUARIA = { sub: 'sub-1', email: 'invitada@ejemplo.test', nombre: 'Invitada' };

describe('guardas de perfil', () => {
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
    router = TestBed.inject(Router);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => vi.useRealTimers());

  function ejecutar(guarda: CanActivateFn) {
    return TestBed.runInInjectionContext(() =>
      guarda({} as ActivatedRouteSnapshot, { url: '/panel' } as RouterStateSnapshot),
    ) as Promise<boolean | UrlTree>;
  }

  async function responder(guarda: CanActivateFn, respuesta: (peticion: ReturnType<HttpTestingController['expectOne']>) => void) {
    const resultado = ejecutar(guarda);
    respuesta(http.expectOne(`${URL_API}/yo`));
    return resultado;
  }

  function a(ruta: string): string {
    return router.serializeUrl(router.createUrlTree([ruta]));
  }

  describe('conPerfil (S5.1)', () => {
    it('sin perfil (tiene_perfil=false) manda al alta', async () => {
      const resultado = await responder(conPerfil, (p) => p.flush({ ...USUARIA, tiene_perfil: false }));

      expect(resultado).toBeInstanceOf(UrlTree);
      expect(router.serializeUrl(resultado as UrlTree)).toBe(a('/alta'));
    });

    it('un 404 tambien es "no hay perfil" y manda al alta', async () => {
      const resultado = await responder(conPerfil, (p) => p.flush('no', { status: 404, statusText: 'Not Found' }));

      expect(router.serializeUrl(resultado as UrlTree)).toBe(a('/alta'));
    });

    it('con perfil (tiene_perfil=true) deja pasar (S5.2)', async () => {
      const resultado = await responder(conPerfil, (p) => p.flush({ ...USUARIA, tiene_perfil: true }));

      expect(resultado).toBe(true);
    });

    it('si el servidor aun no informa de tiene_perfil, deja pasar', async () => {
      const resultado = await responder(conPerfil, (p) => p.flush(USUARIA));

      expect(resultado).toBe(true);
    });

    it('con un error de red deja pasar: un arranque en frio no la manda al alta', async () => {
      const resultado = await responder(conPerfil, (p) => p.error(new ProgressEvent('error')));

      expect(resultado).toBe(true);
    });

    it.each([500, 502, 503])('con un %i deja pasar', async (status) => {
      const resultado = await responder(conPerfil, (p) => p.flush('x', { status, statusText: 'Error' }));

      expect(resultado).toBe(true);
    });

    it('si el servidor tarda demasiado, deja pasar', async () => {
      vi.useFakeTimers();
      const resultado = ejecutar(conPerfil);
      http.expectOne(`${URL_API}/yo`);

      await vi.advanceTimersByTimeAsync(ESPERA_MAXIMA_DE_PERFIL + 1);

      expect(await resultado).toBe(true);
    });

    it('una respuesta con forma rara no cuenta como "sin perfil"', async () => {
      const resultado = await responder(conPerfil, (p) => p.flush({ ...USUARIA, tiene_perfil: 'no' }));

      expect(resultado).toBe(true);
    });
  });

  describe('sinPerfil (S5.2)', () => {
    it('con perfil manda al panel', async () => {
      const resultado = await responder(sinPerfil, (p) => p.flush({ ...USUARIA, tiene_perfil: true }));

      expect(router.serializeUrl(resultado as UrlTree)).toBe(a('/panel'));
    });

    it('sin perfil (false o 404) deja entrar al alta', async () => {
      expect(await responder(sinPerfil, (p) => p.flush({ ...USUARIA, tiene_perfil: false }))).toBe(true);
      expect(await responder(sinPerfil, (p) => p.flush('no', { status: 404, statusText: 'Not Found' }))).toBe(true);
    });

    it('con un error de red o un 5xx deja entrar al alta', async () => {
      expect(await responder(sinPerfil, (p) => p.error(new ProgressEvent('error')))).toBe(true);
      expect(await responder(sinPerfil, (p) => p.flush('x', { status: 503, statusText: 'Error' }))).toBe(true);
    });
  });
});
