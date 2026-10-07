import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CONFIGURACION_DE_SESION } from './configuracion';
import { RESULTADO_DE_ENTRADA, Sesion } from './sesion';

const URL_API = 'http://api.prueba';
const USUARIA = { sub: 'sub-1', email: 'invitada@ejemplo.test', nombre: 'Invitada' };

describe('Sesion', () => {
  let sesion: Sesion;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CONFIGURACION_DE_SESION, useValue: { urlApi: URL_API, idCliente: 'cliente' } },
      ],
    });
    sesion = TestBed.inject(Sesion);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function entrarRespondiendo(
    cuerpo: object | null,
    opciones: { status: number; statusText: string },
  ) {
    const resultado = sesion.entrar('credencial-1');
    const peticion = http.expectOne(`${URL_API}/yo`);
    peticion.flush(cuerpo, opciones);
    return resultado;
  }

  describe('entrar', () => {
    it('empieza sin sesion', () => {
      expect(sesion.usuaria()).toBeNull();
      expect(sesion.activa()).toBe(false);
      expect(sesion.token()).toBeNull();
    });

    it('pide /yo con la credencial en la cabecera Authorization, puesta a mano', async () => {
      const resultado = sesion.entrar('credencial-1');
      const peticion = http.expectOne(`${URL_API}/yo`);

      expect(peticion.request.method).toBe('GET');
      expect(peticion.request.headers.get('Authorization')).toBe('Bearer credencial-1');
      peticion.flush(USUARIA);
      await resultado;
    });

    it('con 200 y cuerpo valido entra y guarda a la usuaria y el token', async () => {
      const resultado = await entrarRespondiendo(USUARIA, { status: 200, statusText: 'OK' });

      expect(resultado).toBe(RESULTADO_DE_ENTRADA.dentro);
      expect(sesion.usuaria()).toEqual(USUARIA);
      expect(sesion.activa()).toBe(true);
      expect(sesion.token()).toBe('credencial-1');
    });

    it('con 200 y cuerpo que no es una usuaria devuelve sin-servidor y no guarda nada', async () => {
      const resultado = await entrarRespondiendo(
        { sub: 'x', email: 3 },
        { status: 200, statusText: 'OK' },
      );

      expect(resultado).toBe(RESULTADO_DE_ENTRADA.sinServidor);
      expect(sesion.usuaria()).toBeNull();
      expect(sesion.token()).toBeNull();
    });

    it('con 200 y cuerpo vacio devuelve sin-servidor y no guarda nada', async () => {
      const resultado = await entrarRespondiendo(null, { status: 200, statusText: 'OK' });

      expect(resultado).toBe(RESULTADO_DE_ENTRADA.sinServidor);
      expect(sesion.activa()).toBe(false);
    });

    it.each([
      [401, 'Unauthorized', RESULTADO_DE_ENTRADA.rechazada],
      [403, 'Forbidden', RESULTADO_DE_ENTRADA.noInvitada],
      [503, 'Service Unavailable', RESULTADO_DE_ENTRADA.sinServidor],
      [500, 'Server Error', RESULTADO_DE_ENTRADA.rechazada],
      [404, 'Not Found', RESULTADO_DE_ENTRADA.rechazada],
    ])('con %i devuelve %s -> %s y no guarda nada', async (status, statusText, esperado) => {
      const resultado = await entrarRespondiendo(null, { status, statusText });

      expect(resultado).toBe(esperado);
      expect(sesion.usuaria()).toBeNull();
      expect(sesion.token()).toBeNull();
    });

    it('con un error de red devuelve sin-servidor y no guarda nada', async () => {
      const resultado = sesion.entrar('credencial-1');
      http.expectOne(`${URL_API}/yo`).error(new ProgressEvent('error'));

      expect(await resultado).toBe(RESULTADO_DE_ENTRADA.sinServidor);
      expect(sesion.activa()).toBe(false);
    });

    it('vive solo en memoria: no escribe en localStorage ni en sessionStorage', async () => {
      localStorage.clear();
      sessionStorage.clear();

      await entrarRespondiendo(USUARIA, { status: 200, statusText: 'OK' });

      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
    });
  });
});
