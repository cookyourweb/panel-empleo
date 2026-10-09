import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';
import { Perfil, TipoDeConsentimiento } from './dominio';
import { RepositorioDePerfil } from './repositorio-de-perfil';

/** El perfil tal como viaja: snake_case, como el resto de la API. */
interface PerfilDeApi {
  rol: string;
  anios_experiencia: number;
  stack: string[];
  idiomas: string[];
  ubicacion: string;
  modalidad: Perfil['modalidad'];
  salario_min: number;
  salario_moneda: string;
}

function aApi(perfil: Perfil): PerfilDeApi {
  return {
    rol: perfil.rol,
    anios_experiencia: perfil.aniosExperiencia,
    stack: perfil.stack,
    idiomas: perfil.idiomas,
    ubicacion: perfil.ubicacion,
    modalidad: perfil.modalidad,
    salario_min: perfil.salarioMin,
    salario_moneda: perfil.salarioMoneda,
  };
}

function aDominio(api: PerfilDeApi): Perfil {
  return {
    rol: api.rol,
    aniosExperiencia: api.anios_experiencia,
    stack: api.stack,
    idiomas: api.idiomas,
    ubicacion: api.ubicacion,
    modalidad: api.modalidad,
    salarioMin: api.salario_min,
    salarioMoneda: api.salario_moneda,
  };
}

/** El token lo pone el interceptor conToken: aqui solo se conoce la ruta. */
@Injectable()
export class RepositorioDePerfilHttp implements RepositorioDePerfil {
  private readonly http = inject(HttpClient);
  private readonly configuracion = inject(CONFIGURACION_DE_SESION);

  async obtener(): Promise<Perfil | null> {
    try {
      const api = await firstValueFrom(this.http.get<PerfilDeApi>(`${this.configuracion.urlApi}/perfil`));
      return aDominio(api);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async guardar(perfil: Perfil): Promise<void> {
    await firstValueFrom(this.http.put(`${this.configuracion.urlApi}/perfil`, aApi(perfil)));
  }

  async consentir(tipo: TipoDeConsentimiento, version: string): Promise<void> {
    await firstValueFrom(this.http.post(`${this.configuracion.urlApi}/consentimientos`, { tipo, version }));
  }
}
