import { ResultadoExtraccion } from './dominio';

/** Subida del CV y propuesta de campos a partir de el. */
export abstract class ExtractorDeCv {
  /** Lanza SubidaRechazada si el servidor no acepta el archivo. */
  abstract subir(archivo: File): Promise<void>;

  /** Nunca lanza: cualquier fallo es un resultado manual, para no dejar a nadie sin salida. */
  abstract extraer(): Promise<ResultadoExtraccion>;
}
