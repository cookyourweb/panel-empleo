import { Perfil, TipoDeConsentimiento } from './dominio';

/**
 * Donde vive el perfil de quien se da de alta, y su consentimiento.
 *
 * Mismo patron que RepositorioDeCandidaturas: la aplicacion depende del puerto
 * y la demo funciona sin backend.
 */
export abstract class RepositorioDePerfil {
  /** null cuando todavia no hay perfil. */
  abstract obtener(): Promise<Perfil | null>;
  abstract guardar(perfil: Perfil): Promise<void>;
  abstract consentir(tipo: TipoDeConsentimiento, version: string): Promise<void>;
}
