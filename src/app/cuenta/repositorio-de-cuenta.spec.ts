import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';
import { elegirRepositorioDeCuenta } from './elegir-repositorio-de-cuenta';
import { RepositorioDeCuentaDemo } from './repositorio-de-cuenta-demo';
import { RepositorioDeCuentaHttp } from './repositorio-de-cuenta-http';

const URL_API = 'http://api.prueba';

describe('RepositorioDeCuentaHttp', () => {
  let repositorio: RepositorioDeCuentaHttp;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RepositorioDeCuentaHttp,
        { provide: CONFIGURACION_DE_SESION, useValue: { urlApi: URL_API, idCliente: 'cliente' } },
      ],
    });
    repositorio = TestBed.inject(RepositorioDeCuentaHttp);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('borra con DELETE /cuenta', async () => {
    const borrado = repositorio.borrar();

    const peticion = http.expectOne(`${URL_API}/cuenta`);
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null, { status: 204, statusText: 'No Content' });

    await expect(borrado).resolves.toBeUndefined();
  });

  it('propaga el error del servidor: no se da por borrada la cuenta', async () => {
    const borrado = repositorio.borrar();

    http.expectOne(`${URL_API}/cuenta`).flush({}, { status: 500, statusText: 'Server Error' });

    await expect(borrado).rejects.toBeDefined();
  });
});

describe('RepositorioDeCuentaHttp, CV y consentimientos', () => {
  let repositorio: RepositorioDeCuentaHttp;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RepositorioDeCuentaHttp,
        { provide: CONFIGURACION_DE_SESION, useValue: { urlApi: URL_API, idCliente: 'cliente' } },
      ],
    });
    repositorio = TestBed.inject(RepositorioDeCuentaHttp);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista sus CV con GET /cv: solo metadatos, en camelCase y solo es o en', async () => {
    const lista = repositorio.listarCvs();

    const peticion = http.expectOne(`${URL_API}/cv`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush([
      { idioma: 'es', formato: 'pdf', subido_en: '2026-10-01T10:00:00+00:00' },
      { idioma: 'fr', formato: 'pdf', subido_en: '2026-10-01T10:00:00+00:00' },
      { idioma: 'en', formato: 'docx', subido_en: '2026-10-02T10:00:00+00:00' },
    ]);

    await expect(lista).resolves.toEqual([
      { idioma: 'es', formato: 'pdf', subidoEn: '2026-10-01T10:00:00+00:00' },
      { idioma: 'en', formato: 'docx', subidoEn: '2026-10-02T10:00:00+00:00' },
    ]);
  });

  it('una respuesta que no es una lista se trata como error, no como "sin CV"', async () => {
    const lista = repositorio.listarCvs();

    http.expectOne(`${URL_API}/cv`).flush({ ok: false });

    await expect(lista).rejects.toBeDefined();
  });

  it('borra un CV con DELETE /cv/{idioma}', async () => {
    const borrado = repositorio.borrarCv('es');

    const peticion = http.expectOne(`${URL_API}/cv/es`);
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null, { status: 204, statusText: 'No Content' });

    await expect(borrado).resolves.toBeUndefined();
  });

  it('un 404 al borrar un CV es que ya no estaba: no es un fallo', async () => {
    const borrado = repositorio.borrarCv('en');

    http.expectOne(`${URL_API}/cv/en`).flush({}, { status: 404, statusText: 'Not Found' });

    await expect(borrado).resolves.toBeUndefined();
  });

  it('un fallo del servidor al borrar un CV se propaga', async () => {
    const borrado = repositorio.borrarCv('es');

    http.expectOne(`${URL_API}/cv/es`).flush({}, { status: 500, statusText: 'Server Error' });

    await expect(borrado).rejects.toBeDefined();
  });

  it.each(['almacenar_cv', 'enviar_cv_a_ia'] as const)('retira el consentimiento %s con DELETE /consentimientos/{tipo}', async (tipo) => {
    const retirado = repositorio.retirarConsentimiento(tipo);

    const peticion = http.expectOne(`${URL_API}/consentimientos/${tipo}`);
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null, { status: 204, statusText: 'No Content' });

    await expect(retirado).resolves.toBeUndefined();
  });

  it('si el servidor rechaza o falla al retirar, se propaga: no se da por retirado', async () => {
    const retirado = repositorio.retirarConsentimiento('almacenar_cv');

    http
      .expectOne(`${URL_API}/consentimientos/almacenar_cv`)
      .flush({ ok: false, error: 'x', campos: ['tipo'] }, { status: 422, statusText: 'Unprocessable' });

    await expect(retirado).rejects.toBeDefined();
  });
});

describe('RepositorioDeCuentaDemo', () => {
  it('empieza sin CV, porque la demo no guarda nada', async () => {
    await expect(new RepositorioDeCuentaDemo().listarCvs()).resolves.toEqual([]);
  });

  it('borrar un CV o retirar un consentimiento no falla y no necesita red', async () => {
    const demo = new RepositorioDeCuentaDemo();

    await expect(demo.borrarCv('es')).resolves.toBeUndefined();
    await expect(demo.retirarConsentimiento('enviar_cv_a_ia')).resolves.toBeUndefined();
  });
});

describe('elegirRepositorioDeCuenta', () => {
  it('con backend usa http y sin backend la demo', () => {
    expect(elegirRepositorioDeCuenta(true)).toBe(RepositorioDeCuentaHttp);
    expect(elegirRepositorioDeCuenta(false)).toBe(RepositorioDeCuentaDemo);
  });

  it('la demo borra sin fallar y sin red', async () => {
    await expect(new RepositorioDeCuentaDemo().borrar()).resolves.toBeUndefined();
  });
});
