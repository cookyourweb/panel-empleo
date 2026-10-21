import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CONFIGURACION_DE_SESION } from './configuracion';
import { Sesion, VIGENCIA_DE_PERFIL_MS } from './sesion';

const URL_API = 'http://api.prueba';
const USUARIA = { sub: 'sub-1', email: 'invitada@ejemplo.test', nombre: 'Invitada', tiene_perfil: true };

describe('Sesion: consentimientos (lo que /yo dice)', () => {
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

  it('empieza sin saber nada', () => {
    expect(sesion.consentimientos()).toBeNull();
    expect(sesion.consentimientosRecientes()).toBeNull();
  });

  it('guarda lo que trae /yo al entrar', async () => {
    await entrar({ ...USUARIA, consentimientos: { almacenar_cv: false, enviar_cv_a_ia: true } });

    expect(sesion.consentimientos()).toEqual({ almacenarCv: false, enviarCvAIa: true });
    expect(sesion.consentimientosRecientes()).toEqual({ almacenarCv: false, enviarCvAIa: true });
  });

  it.each([
    ['ausente', undefined],
    ['nulo', null],
    ['una cadena', 'si'],
    ['sin una de las claves', { almacenar_cv: true }],
    ['con un valor que no es booleano', { almacenar_cv: 'false', enviar_cv_a_ia: 0 }],
  ])('si /yo lo trae %s, es desconocido y nunca se trata como falso', async (_caso, valor) => {
    await entrar({ ...USUARIA, consentimientos: valor });

    expect(sesion.consentimientos()).toBeNull();
  });

  it('pasada la vigencia no se reutiliza, aunque el ultimo valor se conserva', async () => {
    vi.useFakeTimers();
    await entrar({ ...USUARIA, consentimientos: { almacenar_cv: true, enviar_cv_a_ia: true } });

    vi.advanceTimersByTime(VIGENCIA_DE_PERFIL_MS + 1);

    expect(sesion.consentimientosRecientes()).toBeNull();
    expect(sesion.consentimientos()).not.toBeNull();
  });

  it('refrescar actualiza los consentimientos', async () => {
    await entrar({ ...USUARIA, consentimientos: { almacenar_cv: false, enviar_cv_a_ia: false } });

    const refresco = sesion.refrescar();
    http.expectOne(`${URL_API}/yo`).flush({
      ...USUARIA,
      consentimientos: { almacenar_cv: true, enviar_cv_a_ia: false },
    });
    await refresco;

    expect(sesion.consentimientos()).toEqual({ almacenarCv: true, enviarCvAIa: false });
  });

  it('si el refresco ya no los trae (sin base de datos), pasan a desconocidos', async () => {
    await entrar({ ...USUARIA, consentimientos: { almacenar_cv: true, enviar_cv_a_ia: true } });

    const refresco = sesion.refrescar();
    http.expectOne(`${URL_API}/yo`).flush(USUARIA);
    await refresco;

    expect(sesion.consentimientos()).toBeNull();
  });

  it('si el refresco falla, se conserva lo que se sabia', async () => {
    await entrar({ ...USUARIA, consentimientos: { almacenar_cv: false, enviar_cv_a_ia: true } });

    const refresco = sesion.refrescar();
    http.expectOne(`${URL_API}/yo`).flush('x', { status: 500, statusText: 'Error' });
    await expect(refresco).rejects.toBeTruthy();

    expect(sesion.consentimientos()).toEqual({ almacenarCv: false, enviarCvAIa: true });
  });

  it('consentimientosDados corrige el /yo de antes del alta', async () => {
    await entrar({ ...USUARIA, consentimientos: { almacenar_cv: false, enviar_cv_a_ia: false } });

    sesion.consentimientosDados();

    expect(sesion.consentimientos()).toEqual({ almacenarCv: true, enviarCvAIa: true });
    expect(sesion.consentimientosRecientes()).toEqual({ almacenarCv: true, enviarCvAIa: true });
  });

  it('cerrar la sesion los olvida', async () => {
    await entrar({ ...USUARIA, consentimientos: { almacenar_cv: true, enviar_cv_a_ia: true } });

    sesion.cerrar();

    expect(sesion.consentimientos()).toBeNull();
    expect(sesion.consentimientosRecientes()).toBeNull();
  });
});
