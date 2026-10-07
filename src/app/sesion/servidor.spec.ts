import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CONFIGURACION_DE_SESION } from './configuracion';
import { Servidor } from './servidor';

const URL_API = 'http://api.prueba';

describe('Servidor', () => {
  let servidor: Servidor;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CONFIGURACION_DE_SESION, useValue: { urlApi: URL_API, idCliente: 'cliente' } },
      ],
    });
    servidor = TestBed.inject(Servidor);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('es true cuando /health responde 2xx', async () => {
    const resultado = servidor.comprobar();
    const peticion = http.expectOne(`${URL_API}/health`);

    expect(peticion.request.method).toBe('GET');
    peticion.flush({ ok: true });

    expect(await resultado).toBe(true);
  });

  it('es false cuando el servidor responde con error', async () => {
    const resultado = servidor.comprobar();
    http.expectOne(`${URL_API}/health`).flush(null, { status: 503, statusText: 'Unavailable' });

    expect(await resultado).toBe(false);
  });

  it('es false cuando no hay red', async () => {
    const resultado = servidor.comprobar();
    http.expectOne(`${URL_API}/health`).error(new ProgressEvent('error'));

    expect(await resultado).toBe(false);
  });
});
