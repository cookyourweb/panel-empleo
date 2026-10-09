import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';
import { LOTE_MAXIMO_DE_ENCAJES } from './encaje';
import { FuenteDeEncajeHttp } from './fuente-de-encaje-http';

const URL_API = 'http://api.prueba';

describe('FuenteDeEncajeHttp', () => {
  let fuente: FuenteDeEncajeHttp;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        FuenteDeEncajeHttp,
        { provide: CONFIGURACION_DE_SESION, useValue: { urlApi: URL_API, idCliente: 'cliente' } },
      ],
    });
    fuente = TestBed.inject(FuenteDeEncajeHttp);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtener lee GET /ofertas/{id}/encaje y pasa de snake_case al dominio', async () => {
    const resultado = fuente.obtener('o 1');
    const peticion = http.expectOne(`${URL_API}/ofertas/o%201/encaje`);

    expect(peticion.request.method).toBe('GET');
    peticion.flush({
      cubiertos: [{ requisito: 'Angular', evidencia: 'Angular 17 en Acme' }],
      huecos: [{ requisito: 'Rust', eliminatorio: false }],
      no_evaluables: ['buena comunicacion'],
      alcanzable: true,
      cobertura: 0.5,
    });

    expect(await resultado).toEqual({
      estado: 'listo',
      encaje: {
        cubiertos: [{ requisito: 'Angular', evidencia: 'Angular 17 en Acme' }],
        huecos: [{ requisito: 'Rust', eliminatorio: false }],
        noEvaluables: ['buena comunicacion'],
        alcanzable: true,
        cobertura: 0.5,
      },
    });
  });

  it.each([409, 422])('un %s es "sin perfil", no un fallo', async (status) => {
    const resultado = fuente.obtener('o1');
    http.expectOne(`${URL_API}/ofertas/o1/encaje`).flush(null, { status, statusText: 'x' });

    expect(await resultado).toEqual({ estado: 'sin-perfil' });
  });

  it.each([404, 500])('un %s se propaga: no se disfraza de otra cosa', async (status) => {
    const resultado = fuente.obtener('o1');
    http.expectOne(`${URL_API}/ofertas/o1/encaje`).flush(null, { status, statusText: 'x' });

    await expect(resultado).rejects.toBeDefined();
  });

  it('resumen manda POST /encajes con los ids y devuelve alcanzable y cobertura', async () => {
    const resultado = fuente.resumen(['o1', 'o2']);
    const peticion = http.expectOne(`${URL_API}/encajes`);

    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ ids: ['o1', 'o2'] });
    peticion.flush({ o1: { alcanzable: true, cobertura: 0.8 }, o2: { alcanzable: false, cobertura: 0 } });

    expect(await resultado).toEqual({
      o1: { alcanzable: true, cobertura: 0.8 },
      o2: { alcanzable: false, cobertura: 0 },
    });
  });

  it('resumen parte la lista en lotes de 50 y junta las respuestas', async () => {
    const ids = Array.from({ length: LOTE_MAXIMO_DE_ENCAJES + 5 }, (_, i) => `o${i}`);

    const resultado = fuente.resumen(ids);
    const peticiones = http.match(`${URL_API}/encajes`);

    expect(peticiones.map((p) => p.request.body.ids.length)).toEqual([50, 5]);
    for (const p of peticiones) {
      p.flush(Object.fromEntries((p.request.body.ids as string[]).map((id) => [id, { alcanzable: true, cobertura: 1 }])));
    }

    expect(Object.keys(await resultado)).toHaveLength(55);
  });

  it('resumen sin ids no llama al servidor', async () => {
    expect(await fuente.resumen([])).toEqual({});
  });

  it('si un lote falla, resumen falla entero: no se enseña un filtro a medias', async () => {
    const ids = Array.from({ length: 60 }, (_, i) => `o${i}`);

    const resultado = fuente.resumen(ids);
    const [primero, segundo] = http.match(`${URL_API}/encajes`);
    primero.flush({});
    segundo.flush(null, { status: 500, statusText: 'x' });

    await expect(resultado).rejects.toBeDefined();
  });
});
