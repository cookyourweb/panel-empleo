import { TipoDeConsentimiento } from '../alta/dominio';

/** Los idiomas en los que el servidor guarda un CV: uno por idioma (DELETE /cv/{idioma}). */
export const IDIOMAS_DE_CV = ['es', 'en'] as const;

export type IdiomaDeCv = (typeof IDIOMAS_DE_CV)[number];

export function esIdiomaDeCv(valor: unknown): valor is IdiomaDeCv {
  return typeof valor === 'string' && (IDIOMAS_DE_CV as readonly string[]).includes(valor);
}

/** Lo que se sabe de un CV guardado: nunca su contenido, ni cifrado. */
export interface CvGuardado {
  readonly idioma: IdiomaDeCv;
  readonly formato: string;
  /** Fecha ISO de la subida. */
  readonly subidoEn: string;
}

/**
 * La cuenta de quien ha entrado. Mismo patron que RepositorioDePerfil: la
 * aplicacion depende del puerto y la demo funciona sin backend.
 */
export abstract class RepositorioDeCuenta {
  /** Borra perfil, CV cifrado y consentimientos. Rechaza si el servidor no lo hizo. */
  abstract borrar(): Promise<void>;

  /** Sus CV guardados, uno por idioma. Rechaza si no se pudo consultar: no es lo mismo que "no hay". */
  abstract listarCvs(): Promise<CvGuardado[]>;

  /** Borra su CV en ese idioma. Que ya no estuviera cuenta como borrado. Rechaza si el servidor falla. */
  abstract borrarCv(idioma: IdiomaDeCv): Promise<void>;

  /**
   * Retira un consentimiento (idempotente en el servidor). Retirar almacenar_cv
   * borra tambien sus CV guardados. Rechaza si el servidor no lo hizo.
   */
  abstract retirarConsentimiento(tipo: TipoDeConsentimiento): Promise<void>;
}
