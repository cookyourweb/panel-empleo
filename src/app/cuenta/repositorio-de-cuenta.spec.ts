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

describe('elegirRepositorioDeCuenta', () => {
  it('con backend usa http y sin backend la demo', () => {
    expect(elegirRepositorioDeCuenta(true)).toBe(RepositorioDeCuentaHttp);
    expect(elegirRepositorioDeCuenta(false)).toBe(RepositorioDeCuentaDemo);
  });

  it('la demo borra sin fallar y sin red', async () => {
    await expect(new RepositorioDeCuentaDemo().borrar()).resolves.toBeUndefined();
  });
});
