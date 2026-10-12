import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';
import { Sesion, VIGENCIA_DE_PERFIL_MS } from '../sesion/sesion';
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
      // The first answer is remembered: forget it so the 404 is asked for real.
      TestBed.inject(Sesion).cerrar();
      expect(await responder(sinPerfil, (p) => p.flush('no', { status: 404, statusText: 'Not Found' }))).toBe(true);
    });

    it('con un error de red o un 5xx deja entrar al alta', async () => {
      expect(await responder(sinPerfil, (p) => p.error(new ProgressEvent('error')))).toBe(true);
      expect(await responder(sinPerfil, (p) => p.flush('x', { status: 503, statusText: 'Error' }))).toBe(true);
    });
  });

  describe('reutilizar la respuesta de /yo (una sola peticion al entrar)', () => {
    async function entrarCon(cuerpo: object) {
      const sesion = TestBed.inject(Sesion);
      const entrada = sesion.entrar('credencial-1');
      http.expectOne(`${URL_API}/yo`).flush(cuerpo);
      await entrada;
      return sesion;
    }

    it('tras entrar con perfil, conPerfil y sinPerfil no vuelven a pedir /yo', async () => {
      await entrarCon({ ...USUARIA, tiene_perfil: true, origen_master: 'neon' });

      expect(await ejecutar(conPerfil)).toBe(true);
      expect(router.serializeUrl((await ejecutar(sinPerfil)) as UrlTree)).toBe(a('/panel'));
      http.expectNone(`${URL_API}/yo`);
    });

    it('tras entrar sin perfil, conPerfil manda al alta sin pedir /yo', async () => {
      await entrarCon({ ...USUARIA, tiene_perfil: false });

      expect(router.serializeUrl((await ejecutar(conPerfil)) as UrlTree)).toBe(a('/alta'));
      expect(await ejecutar(sinPerfil)).toBe(true);
      http.expectNone(`${URL_API}/yo`);
    });

    it('si /yo no informo de tiene_perfil, la guarda pregunta', async () => {
      await entrarCon(USUARIA);

      const resultado = responder(conPerfil, (p) => p.flush({ ...USUARIA, tiene_perfil: true }));

      expect(await resultado).toBe(true);
    });

    it('pasado el plazo de vigencia vuelve a preguntar', async () => {
      vi.useFakeTimers();
      await entrarCon({ ...USUARIA, tiene_perfil: false });
      vi.advanceTimersByTime(VIGENCIA_DE_PERFIL_MS + 1);

      const resultado = await responder(conPerfil, (p) => p.flush({ ...USUARIA, tiene_perfil: true }));

      expect(resultado).toBe(true);
    });

    it('lo que averigua la guarda lo recuerda la sesion: la siguiente no pregunta', async () => {
      await responder(conPerfil, (p) => p.flush({ ...USUARIA, tiene_perfil: true }));

      expect(await ejecutar(sinPerfil)).not.toBe(true);
      http.expectNone(`${URL_API}/yo`);
      expect(TestBed.inject(Sesion).perfil()?.tienePerfil).toBe(true);
    });

    it('un 404 se recuerda como "sin perfil"', async () => {
      await responder(conPerfil, (p) => p.flush('no', { status: 404, statusText: 'Not Found' }));

      expect(TestBed.inject(Sesion).perfil()?.tienePerfil).toBe(false);
    });

    it('un error de red o un 5xx no se recuerda: la proxima vez se pregunta', async () => {
      await responder(conPerfil, (p) => p.error(new ProgressEvent('error')));
      expect(TestBed.inject(Sesion).perfil()).toBeNull();

      await responder(conPerfil, (p) => p.flush('x', { status: 503, statusText: 'Error' }));
      expect(TestBed.inject(Sesion).perfil()).toBeNull();
    });

    it('tras guardar el perfil la guarda deja pasar y no rebota al alta', async () => {
      const sesion = await entrarCon({ ...USUARIA, tiene_perfil: false });

      sesion.perfilGuardado();

      expect(await ejecutar(conPerfil)).toBe(true);
      http.expectNone(`${URL_API}/yo`);
    });
  });
});
