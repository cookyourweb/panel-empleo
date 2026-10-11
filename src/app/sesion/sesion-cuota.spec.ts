import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CONFIGURACION_DE_SESION } from './configuracion';
import { Sesion, VIGENCIA_DE_PERFIL_MS } from './sesion';

const URL_API = 'http://api.prueba';
const USUARIA = { sub: 'sub-1', email: 'invitada@ejemplo.test', nombre: 'Invitada' };
const CUOTA_API = { usadas: 2.7, limite: 8, se_renueva: '2026-11-01' };

describe('Sesion: cuota de generacion (lo que /yo dice)', () => {
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

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  async function entrar(cuerpo: object) {
    const resultado = sesion.entrar('credencial-1');
    http.expectOne(`${URL_API}/yo`).flush(cuerpo);
    await resultado;
  }

  it('empieza sin saber nada de la cuota', () => {
    expect(sesion.cuota()).toBeNull();
    expect(sesion.cuotaReciente()).toBeNull();
  });

  it('guarda la cuota que trae /yo al entrar', async () => {
    await entrar({ ...USUARIA, cuota: CUOTA_API });

    expect(sesion.cuota()).toEqual({ usadas: 2.7, limite: 8, seRenueva: '2026-11-01' });
    expect(sesion.cuotaReciente()).toEqual({ cuota: sesion.cuota() });
  });

  it('sin cuota en /yo (dueña, exenta, libro caido) la respuesta es reciente y vacia', async () => {
    await entrar(USUARIA);

    expect(sesion.cuota()).toBeNull();
    expect(sesion.cuotaReciente()).toEqual({ cuota: null });
  });

  it('deja de ser reciente pasados 30 segundos', async () => {
    await entrar({ ...USUARIA, cuota: CUOTA_API });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + VIGENCIA_DE_PERFIL_MS + 1);

    expect(sesion.cuotaReciente()).toBeNull();
    expect(sesion.cuota()).not.toBeNull();
  });

  it('refrescar vuelve a pedir /yo (con el token puesto por el interceptor) y actualiza cuota', async () => {
    await entrar({ ...USUARIA, cuota: CUOTA_API });

    const refresco = sesion.refrescar();
    const peticion = http.expectOne(`${URL_API}/yo`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush({ ...USUARIA, tiene_perfil: true, cuota: { ...CUOTA_API, usadas: 3.7 } });
    await refresco;

    expect(sesion.cuota()?.usadas).toBe(3.7);
    expect(sesion.perfil()).toMatchObject({ tienePerfil: true });
  });

  it('refrescar rechaza si /yo falla y no toca lo sabido', async () => {
    await entrar({ ...USUARIA, cuota: CUOTA_API });

    const refresco = sesion.refrescar();
    http.expectOne(`${URL_API}/yo`).flush(null, { status: 503, statusText: 'Service Unavailable' });

    await expect(refresco).rejects.toBeDefined();
    expect(sesion.cuota()?.usadas).toBe(2.7);
  });

  it('cerrar la sesion olvida la cuota', async () => {
    await entrar({ ...USUARIA, cuota: CUOTA_API });

    sesion.cerrar();

    expect(sesion.cuota()).toBeNull();
    expect(sesion.cuotaReciente()).toBeNull();
  });
});
