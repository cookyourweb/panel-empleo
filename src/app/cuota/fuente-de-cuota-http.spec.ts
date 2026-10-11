import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';
import { Sesion } from '../sesion/sesion';
import { FuenteDeCuotaHttp } from './fuente-de-cuota-http';

const URL_API = 'http://api.prueba';
const USUARIA = { sub: 's', email: 'a@b.test', nombre: 'A' };
const CON_CUOTA = { ...USUARIA, cuota: { usadas: 2.7, limite: 8, se_renueva: '2026-11-01' } };

describe('FuenteDeCuotaHttp', () => {
  let fuente: FuenteDeCuotaHttp;
  let http: HttpTestingController;
  let sesion: Sesion;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        FuenteDeCuotaHttp,
        { provide: CONFIGURACION_DE_SESION, useValue: { urlApi: URL_API, idCliente: 'cliente' } },
      ],
    });
    fuente = TestBed.inject(FuenteDeCuotaHttp);
    http = TestBed.inject(HttpTestingController);
    sesion = TestBed.inject(Sesion);
    const entrada = sesion.entrar('credencial');
    http.expectOne(`${URL_API}/yo`).flush(CON_CUOTA);
    await entrada;
  });

  afterEach(() => http.verify());

  it('actual reutiliza lo que /yo dijo al entrar: sin otra peticion', async () => {
    expect(await fuente.actual()).toEqual({ usadas: 2.7, limite: 8, seRenueva: '2026-11-01' });
  });

  it('actual vuelve a preguntar a /yo cuando lo sabido ya no es reciente', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 31_000);

    const resultado = fuente.actual();
    http.expectOne(`${URL_API}/yo`).flush({ ...USUARIA, cuota: { usadas: 3.4, limite: 8, se_renueva: '2026-11-01' } });

    expect(await resultado).toEqual({ usadas: 3.4, limite: 8, seRenueva: '2026-11-01' });
    vi.useRealTimers();
  });

  it('refrescar fuerza /yo aunque lo sabido sea reciente', async () => {
    const resultado = fuente.refrescar();
    http.expectOne(`${URL_API}/yo`).flush({ ...USUARIA, cuota: { usadas: 3.4, limite: 8, se_renueva: '2026-11-01' } });

    expect(await resultado).toMatchObject({ usadas: 3.4 });
  });

  it('refrescar deja de dar cuota si /yo ya no la trae (dueña, exenta o libro caido)', async () => {
    const resultado = fuente.refrescar();
    http.expectOne(`${URL_API}/yo`).flush(USUARIA);

    expect(await resultado).toBeNull();
  });

  it('si /yo falla al refrescar, conserva lo ultimo que sabia en vez de esconder el medidor', async () => {
    const resultado = fuente.refrescar();
    http.expectOne(`${URL_API}/yo`).flush(null, { status: 503, statusText: 'Service Unavailable' });

    expect(await resultado).toEqual({ usadas: 2.7, limite: 8, seRenueva: '2026-11-01' });
  });

  it('registrarInteres hace POST /interes con tipo y organizacion', async () => {
    const resultado = fuente.registrarInteres({ tipo: 'academia', organizacion: 'CLE Formacion' });
    const peticion = http.expectOne(`${URL_API}/interes`);

    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ tipo: 'academia', organizacion: 'CLE Formacion' });
    peticion.flush({ tipo: 'academia', organizacion: 'CLE Formacion' }, { status: 201, statusText: 'Created' });
    await resultado;
  });

  it('sin organizacion, o en blanco, no la manda', async () => {
    const resultado = fuente.registrarInteres({ tipo: 'paquetes', organizacion: '   ' });
    const peticion = http.expectOne(`${URL_API}/interes`);

    expect(peticion.request.body).toEqual({ tipo: 'paquetes' });
    peticion.flush({ tipo: 'paquetes', organizacion: null }, { status: 201, statusText: 'Created' });
    await resultado;
  });

  it('rechaza si el servidor falla, para que la pantalla lo cuente', async () => {
    const resultado = fuente.registrarInteres({ tipo: 'paquetes' });
    http.expectOne(`${URL_API}/interes`).flush(null, { status: 500, statusText: 'Server Error' });

    await expect(resultado).rejects.toBeDefined();
  });
});
