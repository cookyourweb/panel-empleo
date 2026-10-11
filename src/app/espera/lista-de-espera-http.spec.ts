import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';
import { conToken } from '../sesion/con-token';
import { Sesion } from '../sesion/sesion';
import { URL_DEL_WEBHOOK_DE_LEADS } from './lista-de-espera';
import { ListaDeEsperaHttp } from './lista-de-espera-http';

const URL_API = 'http://api.prueba';
const SOLICITUD = { nombre: 'Ana', email: 'ana@ejemplo.test' };

describe('ListaDeEsperaHttp', () => {
  let lista: ListaDeEsperaHttp;
  let http: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-11T12:00:00.000Z'));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([conToken])),
        provideHttpClientTesting(),
        ListaDeEsperaHttp,
        { provide: CONFIGURACION_DE_SESION, useValue: { urlApi: URL_API, idCliente: 'cliente' } },
      ],
    });
    lista = TestBed.inject(ListaDeEsperaHttp);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('el webhook es el de leads de n8n que ya usa la web', () => {
    expect(URL_DEL_WEBHOOK_DE_LEADS).toBe('https://n8n-asistente-correo.onrender.com/webhook/leads-web');
  });

  it('envia formulario empleo con nombre, email, origen web y la hora, y no envia telefono', async () => {
    const resultado = lista.apuntar(SOLICITUD);

    const peticion = http.expectOne(URL_DEL_WEBHOOK_DE_LEADS);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      formulario: 'empleo',
      nombre: 'Ana',
      email: 'ana@ejemplo.test',
      origen: 'web',
      timestamp: '2026-10-11T12:00:00.000Z',
    });
    expect(peticion.request.body).not.toHaveProperty('telefono');
    peticion.flush({ ok: true });
    await expect(resultado).resolves.toBeUndefined();
  });

  it('con 200 y ok distinto de true no da por apuntada a la persona', async () => {
    const resultado = lista.apuntar(SOLICITUD);
    http.expectOne(URL_DEL_WEBHOOK_DE_LEADS).flush({ ok: false });

    await expect(resultado).rejects.toBeDefined();
  });

  it('con 200 y sin cuerpo no da por apuntada a la persona', async () => {
    const resultado = lista.apuntar(SOLICITUD);
    http.expectOne(URL_DEL_WEBHOOK_DE_LEADS).flush(null);

    await expect(resultado).rejects.toBeDefined();
  });

  it('con 202 aunque diga ok no da por apuntada a la persona: solo vale el 200', async () => {
    const resultado = lista.apuntar(SOLICITUD);
    http.expectOne(URL_DEL_WEBHOOK_DE_LEADS).flush({ ok: true }, { status: 202, statusText: 'Accepted' });

    await expect(resultado).rejects.toBeDefined();
  });

  it('un 500 rechaza', async () => {
    const resultado = lista.apuntar(SOLICITUD);
    http.expectOne(URL_DEL_WEBHOOK_DE_LEADS).flush({ ok: true }, { status: 500, statusText: 'Error' });

    await expect(resultado).rejects.toBeDefined();
  });

  it('un error de red rechaza', async () => {
    const resultado = lista.apuntar(SOLICITUD);
    http.expectOne(URL_DEL_WEBHOOK_DE_LEADS).error(new ProgressEvent('error'));

    await expect(resultado).rejects.toBeDefined();
  });

  it('el interceptor no manda el token de Google al webhook, ni con sesion abierta', async () => {
    const sesion = TestBed.inject(Sesion);
    const entrada = sesion.entrar('credencial-1');
    http.expectOne(`${URL_API}/yo`).flush({ sub: 's', email: 'a@b.test', nombre: 'A' });
    await entrada;

    const resultado = lista.apuntar(SOLICITUD);

    const peticion = http.expectOne(URL_DEL_WEBHOOK_DE_LEADS);
    expect(peticion.request.headers.has('Authorization')).toBe(false);
    peticion.flush({ ok: true });
    await resultado;
  });
});
