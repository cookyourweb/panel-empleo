import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { appConfig } from './app.config';
import { CONFIGURACION_DE_SESION } from './sesion/configuracion';
import { IdentidadGoogle } from './sesion/identidad-google';
import { ProveedorDeIdentidad } from './sesion/proveedor-de-identidad';

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
});
