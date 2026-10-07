import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { CONFIGURACION_DE_SESION, elegirConfiguracion } from './sesion/configuracion';
import { IdentidadGoogle } from './sesion/identidad-google';
import { ProveedorDeIdentidad } from './sesion/proveedor-de-identidad';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    { provide: CONFIGURACION_DE_SESION, useValue: elegirConfiguracion(isDevMode()) },
    { provide: ProveedorDeIdentidad, useClass: IdentidadGoogle }
  ]
};
