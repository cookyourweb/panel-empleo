import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CONFIGURACION_DE_SESION } from './configuracion';
import { conToken } from './con-token';
import { Sesion } from './sesion';

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
});
