import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';
import { Perfil } from './dominio';
import { RepositorioDePerfilHttp } from './repositorio-de-perfil-http';

const URL_API = 'http://api.prueba';

const PERFIL: Perfil = {
  rol: 'Frontend',
  aniosExperiencia: 20,
  stack: ['Angular', 'TypeScript'],
  idiomas: ['es', 'en'],
  ubicacion: 'Madrid',
  modalidad: ['remoto', 'hibrido'],
  salarioMin: 55000,
  salarioMoneda: 'EUR',
};

const CUERPO: Record<string, unknown> = {
  rol: 'Frontend',
  anios_experiencia: 20,
  stack: ['Angular', 'TypeScript'],
  idiomas: ['es', 'en'],
  ubicacion: 'Madrid',
  modalidad: ['remoto', 'hibrido'],
  salario_min: 55000,
  salario_moneda: 'EUR',
};

describe('RepositorioDePerfilHttp', () => {
  let repositorio: RepositorioDePerfilHttp;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RepositorioDePerfilHttp,
        { provide: CONFIGURACION_DE_SESION, useValue: { urlApi: URL_API, idCliente: 'cliente' } },
      ],
    });
    repositorio = TestBed.inject(RepositorioDePerfilHttp);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtener lee GET /perfil y pasa de snake_case al dominio', async () => {
    const resultado = repositorio.obtener();
    const peticion = http.expectOne(`${URL_API}/perfil`);

    expect(peticion.request.method).toBe('GET');
    peticion.flush(CUERPO);

    expect(await resultado).toEqual(PERFIL);
  });

  it('obtener devuelve null cuando no hay perfil (404)', async () => {
    const resultado = repositorio.obtener();
    http.expectOne(`${URL_API}/perfil`).flush(null, { status: 404, statusText: 'Not Found' });

    expect(await resultado).toBeNull();
  });

  it('obtener propaga los demas errores: un 500 no es "sin perfil"', async () => {
    const resultado = repositorio.obtener();
    http.expectOne(`${URL_API}/perfil`).flush(null, { status: 500, statusText: 'Server Error' });

    await expect(resultado).rejects.toBeDefined();
  });

  it('guardar manda PUT /perfil en snake_case', async () => {
    const resultado = repositorio.guardar(PERFIL);
    const peticion = http.expectOne(`${URL_API}/perfil`);

    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual(CUERPO);
    peticion.flush(CUERPO);

    await resultado;
  });

  it('guardar propaga un 422', async () => {
    const resultado = repositorio.guardar(PERFIL);
    http.expectOne(`${URL_API}/perfil`).flush(null, { status: 422, statusText: 'Unprocessable' });

    await expect(resultado).rejects.toBeDefined();
  });

  it('consentir manda POST /consentimientos con tipo y version', async () => {
    const resultado = repositorio.consentir('enviar_cv_a_ia', 'v1');
    const peticion = http.expectOne(`${URL_API}/consentimientos`);

    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ tipo: 'enviar_cv_a_ia', version: 'v1' });
    peticion.flush(null, { status: 201, statusText: 'Created' });

    await resultado;
  });
});
