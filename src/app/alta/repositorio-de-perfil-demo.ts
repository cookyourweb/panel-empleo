import { Injectable } from '@angular/core';

import { Perfil, TipoDeConsentimiento } from './dominio';
import { RepositorioDePerfil } from './repositorio-de-perfil';

/** En memoria: la demo publica no guarda nada, ni siquiera en el navegador. */
@Injectable()
export class RepositorioDePerfilDemo implements RepositorioDePerfil {
  private perfil: Perfil | null = null;

  async obtener(): Promise<Perfil | null> {
    return this.perfil;
  }

  async guardar(perfil: Perfil): Promise<void> {
    this.perfil = perfil;
  }

  async consentir(_tipo: TipoDeConsentimiento, _version: string): Promise<void> {}
}
