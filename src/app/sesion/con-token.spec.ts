import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { CONFIGURACION_DE_SESION } from './configuracion';
import { conToken } from './con-token';
import { RESULTADO_DE_ENTRADA, Sesion } from './sesion';

const URL_API = 'http://api.prueba';
const USUARIA = { sub: 'sub-1', email: 'invitada@ejemplo.test', nombre: 'Invitada' };

describe('conToken', () => {
  let sesion: Sesion;
  let cliente: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([conToken])),
        provideHttpClientTesting(),
        { provide: CONFIGURACION_DE_SESION, useValue: { urlApi: URL_API, idCliente: 'cliente' } },
      ],
    });
    sesion = TestBed.inject(Sesion);
    cliente = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function conSesion(token = 'credencial-1') {
    const resultado = sesion.entrar(token);
    http.expectOne(`${URL_API}/yo`).flush(USUARIA);
    await resultado;
  }

  describe('adjuntar el token', () => {
    it('lo adjunta a las peticiones a cv-server cuando hay sesion', async () => {
      await conSesion();

      cliente.get(`${URL_API}/candidaturas`).subscribe();

      const peticion = http.expectOne(`${URL_API}/candidaturas`);
      expect(peticion.request.headers.get('Authorization')).toBe('Bearer credencial-1');
      peticion.flush([]);
    });

    it('no adjunta nada a cv-server si no hay sesion', () => {
      cliente.get(`${URL_API}/candidaturas`).subscribe();

      const peticion = http.expectOne(`${URL_API}/candidaturas`);
      expect(peticion.request.headers.has('Authorization')).toBe(false);
      peticion.flush([]);
    });

    it('no lo adjunta a rutas relativas del mismo origen que el panel, como /api', async () => {
      await conSesion();

      cliente.get('/api/candidaturas').subscribe();

      const peticion = http.expectOne('/api/candidaturas');
      expect(peticion.request.headers.has('Authorization')).toBe(false);
      peticion.flush([]);
    });

    it('no lo adjunta a otros origenes', async () => {
      await conSesion();

      cliente.get('https://otro.ejemplo.test/datos').subscribe();

      const peticion = http.expectOne('https://otro.ejemplo.test/datos');
      expect(peticion.request.headers.has('Authorization')).toBe(false);
      peticion.flush([]);
    });

    it('no confunde un host que solo empieza igual que cv-server', async () => {
      await conSesion();

      cliente.get(`${URL_API}.malvado.test/datos`).subscribe();

      const peticion = http.expectOne(`${URL_API}.malvado.test/datos`);
      expect(peticion.request.headers.has('Authorization')).toBe(false);
      peticion.flush([]);
    });

    it('respeta la cabecera Authorization que ya traiga la peticion', async () => {
      await conSesion();

      cliente
        .get(`${URL_API}/yo`, { headers: { Authorization: 'Bearer a-mano' } })
        .subscribe();

      const peticion = http.expectOne(`${URL_API}/yo`);
      expect(peticion.request.headers.get('Authorization')).toBe('Bearer a-mano');
      peticion.flush(USUARIA);
    });
  });

  describe('ante un error', () => {
    let navegar: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    });

    function fallar(url: string, status: number, statusText: string) {
      let error: unknown;
      cliente.get(url).subscribe({ error: (e: unknown) => (error = e) });
      http.expectOne(url).flush(null, { status, statusText });
      return error;
    }

    it('un 401 de cv-server cierra la sesion, vuelve a entrar y el error llega a quien llamo', async () => {
      await conSesion();

      const error = fallar(`${URL_API}/candidaturas`, 401, 'Unauthorized');

      expect(error).toBeInstanceOf(HttpErrorResponse);
      expect((error as HttpErrorResponse).status).toBe(401);
      expect(sesion.activa()).toBe(false);
      expect(sesion.token()).toBeNull();
      expect(navegar).toHaveBeenCalledWith(['/entrar'], {
        queryParams: { volver: TestBed.inject(Router).url },
      });
    });

    it('un 401 de otro origen no toca la sesion ni navega', async () => {
      await conSesion();

      const error = fallar('https://otro.ejemplo.test/datos', 401, 'Unauthorized');

      expect(error).toBeInstanceOf(HttpErrorResponse);
      expect(sesion.activa()).toBe(true);
      expect(navegar).not.toHaveBeenCalled();
    });

    it('un 401 del puente local /api no toca la sesion ni navega', async () => {
      await conSesion();

      fallar('/api/candidaturas', 401, 'Unauthorized');

      expect(sesion.activa()).toBe(true);
      expect(navegar).not.toHaveBeenCalled();
    });

    it.each([403, 500, 503])('un %i de cv-server no cierra la sesion', async (status) => {
      await conSesion();

      const error = fallar(`${URL_API}/candidaturas`, status, 'Error');

      expect((error as HttpErrorResponse).status).toBe(status);
      expect(sesion.activa()).toBe(true);
      expect(navegar).not.toHaveBeenCalled();
    });

    it('un 401 en /yo durante entrar no navega: entrar ya devuelve rechazada', async () => {
      const resultado = sesion.entrar('credencial-mala');
      http
        .expectOne(`${URL_API}/yo`)
        .flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(await resultado).toBe(RESULTADO_DE_ENTRADA.rechazada);
      expect(navegar).not.toHaveBeenCalled();
    });
  });
});
