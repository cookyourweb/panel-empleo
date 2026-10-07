import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { appConfig } from './app.config';
import { CONFIGURACION_DE_SESION } from './sesion/configuracion';
import { IdentidadGoogle } from './sesion/identidad-google';
import { ProveedorDeIdentidad } from './sesion/proveedor-de-identidad';
import { Sesion } from './sesion/sesion';

describe('appConfig', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
  });

  it('registra HttpClient para la sesion', () => {
    expect(TestBed.inject(HttpClient)).toBeInstanceOf(HttpClient);
  });

  it('registra la configuracion de sesion con la url del servidor y el id de cliente', () => {
    const configuracion = TestBed.inject(CONFIGURACION_DE_SESION);

    expect(configuracion.urlApi).toMatch(/^https?:\/\//);
    expect(configuracion.idCliente).toMatch(/\.apps\.googleusercontent\.com$/);
  });

  it('resuelve el proveedor de identidad a Google', () => {
    expect(TestBed.inject(ProveedorDeIdentidad)).toBeInstanceOf(IdentidadGoogle);
  });

  describe('interceptor de token', () => {
    async function conSesionYPeticiones() {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [...appConfig.providers, provideHttpClientTesting()] });
      const { urlApi } = TestBed.inject(CONFIGURACION_DE_SESION);
      const http = TestBed.inject(HttpTestingController);
      const resultado = TestBed.inject(Sesion).entrar('credencial-1');
      http
        .expectOne(`${urlApi}/yo`)
        .flush({ sub: 's', email: 'invitada@ejemplo.test', nombre: 'Invitada' });
      await resultado;
      return { urlApi, http, cliente: TestBed.inject(HttpClient) };
    }

    it('el HttpClient real adjunta el token a cv-server y no al puente /api', async () => {
      const { urlApi, http, cliente } = await conSesionYPeticiones();

      cliente.get(`${urlApi}/candidaturas`).subscribe();
      cliente.get('/api/x').subscribe();

      const aCvServer = http.expectOne(`${urlApi}/candidaturas`);
      const alPuente = http.expectOne('/api/x');
      expect(aCvServer.request.headers.get('Authorization')).toBe('Bearer credencial-1');
      expect(alPuente.request.headers.has('Authorization')).toBe(false);
      aCvServer.flush([]);
      alPuente.flush([]);
      http.verify();
    });
  });
});
