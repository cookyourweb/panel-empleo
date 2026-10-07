import { Candidatura } from './dominio';
import { ETIQUETAS, IDIOMAS_DE_OFERTA, SI, TEXTOS_DE_ENLACE } from './etiquetas';
import { formatearFecha } from './fecha';

export type TipoDeColumna = 'empresa' | 'estado' | 'texto' | 'fecha' | 'enlace' | 'largo' | 'casilla';

export interface Columna {
  clave: string;
  titulo: string;
  grupo: 'Oferta' | 'Candidatura' | 'Documentos';
  tipo: TipoDeColumna;
  ancho: number;
  porDefecto: boolean;
  /** No se puede quitar. */
  fija?: boolean;
  leer: (una: Candidatura) => string | boolean | undefined;
  /** Lo que se lee en la celda de un enlace, en vez de la direccion. */
  textoEnlace?: string;
}

/**
 * Todas las columnas que puede tener la tabla, en el orden de la maqueta
 * aprobada. Las marcadas porDefecto son las que se ven al llegar; el resto se
 * añade desde el selector y aparece en su sitio, no al final.
 */
export const COLUMNAS: readonly Columna[] = [
  { clave: 'empresa', titulo: ETIQUETAS.empresa, grupo: 'Oferta', tipo: 'empresa', ancho: 190, porDefecto: true, fija: true, leer: (u) => u.oferta.empresa },
  { clave: 'puesto', titulo: ETIQUETAS.puesto, grupo: 'Oferta', tipo: 'texto', ancho: 280, porDefecto: true, leer: (u) => u.oferta.puesto },
  { clave: 'estado', titulo: ETIQUETAS.estado, grupo: 'Candidatura', tipo: 'estado', ancho: 170, porDefecto: true, leer: (u) => u.estado },
  { clave: 'fase', titulo: ETIQUETAS.fase, grupo: 'Candidatura', tipo: 'texto', ancho: 160, porDefecto: false, leer: (u) => u.fase },
  { clave: 'modalidad', titulo: ETIQUETAS.modalidad, grupo: 'Oferta', tipo: 'texto', ancho: 110, porDefecto: true, leer: (u) => u.oferta.modalidad },
  { clave: 'ubicacion', titulo: ETIQUETAS.ubicacion, grupo: 'Oferta', tipo: 'texto', ancho: 180, porDefecto: true, leer: (u) => u.oferta.ubicacion },
  { clave: 'salario', titulo: ETIQUETAS.salario, grupo: 'Oferta', tipo: 'texto', ancho: 170, porDefecto: true, leer: (u) => u.oferta.salario },
  { clave: 'viaEnvio', titulo: ETIQUETAS.viaEnvio, grupo: 'Candidatura', tipo: 'texto', ancho: 140, porDefecto: true, leer: (u) => u.viaEnvio },
  { clave: 'fechaEnvio', titulo: ETIQUETAS.fechaEnvio, grupo: 'Candidatura', tipo: 'fecha', ancho: 120, porDefecto: true, leer: (u) => u.fechaEnvio },
  { clave: 'fechaPublicacion', titulo: ETIQUETAS.fechaPublicacion, grupo: 'Oferta', tipo: 'fecha', ancho: 120, porDefecto: true, leer: (u) => u.oferta.fechaPublicacion },
  { clave: 'enlace', titulo: ETIQUETAS.enlaceDeOferta, grupo: 'Oferta', tipo: 'enlace', ancho: 80, porDefecto: true, leer: (u) => u.oferta.enlace, textoEnlace: TEXTOS_DE_ENLACE.abrir },
  { clave: 'seguimiento', titulo: ETIQUETAS.seguimiento, grupo: 'Candidatura', tipo: 'fecha', ancho: 120, porDefecto: false, leer: (u) => u.seguimiento },
  { clave: 'descripcion', titulo: ETIQUETAS.descripcion, grupo: 'Oferta', tipo: 'largo', ancho: 280, porDefecto: false, leer: (u) => u.oferta.descripcion },
  { clave: 'tipoContrato', titulo: ETIQUETAS.tipoContratoCorto, grupo: 'Oferta', tipo: 'texto', ancho: 140, porDefecto: false, leer: (u) => u.oferta.tipoContrato },
  { clave: 'modoContratacion', titulo: ETIQUETAS.modoContratacionCorto, grupo: 'Oferta', tipo: 'texto', ancho: 150, porDefecto: false, leer: (u) => u.oferta.modoContratacion },
  { clave: 'idioma', titulo: ETIQUETAS.idioma, grupo: 'Oferta', tipo: 'texto', ancho: 90, porDefecto: false, leer: (u) => IDIOMAS_DE_OFERTA[u.oferta.idioma] },
  { clave: 'palabrasClave', titulo: ETIQUETAS.palabrasClave, grupo: 'Oferta', tipo: 'largo', ancho: 240, porDefecto: false, leer: (u) => u.oferta.palabrasClave },
  { clave: 'verificada', titulo: ETIQUETAS.verificada, grupo: 'Oferta', tipo: 'casilla', ancho: 100, porDefecto: false, leer: (u) => u.oferta.verificada },
  { clave: 'tags', titulo: ETIQUETAS.tags, grupo: 'Oferta', tipo: 'texto', ancho: 160, porDefecto: false, leer: (u) => u.oferta.tags },
  { clave: 'fechaEntrevista', titulo: ETIQUETAS.fechaEntrevista, grupo: 'Candidatura', tipo: 'fecha', ancho: 130, porDefecto: false, leer: (u) => u.fechaEntrevista },
  { clave: 'formatoTecnico', titulo: ETIQUETAS.formatoTecnico, grupo: 'Candidatura', tipo: 'texto', ancho: 140, porDefecto: false, leer: (u) => u.formatoTecnico },
  { clave: 'nombreContacto', titulo: ETIQUETAS.nombreContacto, grupo: 'Candidatura', tipo: 'texto', ancho: 160, porDefecto: false, leer: (u) => u.nombreContacto },
  { clave: 'telefonoContacto', titulo: ETIQUETAS.telefonoContacto, grupo: 'Candidatura', tipo: 'texto', ancho: 150, porDefecto: false, leer: (u) => u.telefonoContacto },
  { clave: 'emailEmpresa', titulo: ETIQUETAS.emailEmpresa, grupo: 'Candidatura', tipo: 'texto', ancho: 200, porDefecto: false, leer: (u) => u.emailEmpresa },
  { clave: 'emailEnviado', titulo: ETIQUETAS.emailEnviado, grupo: 'Candidatura', tipo: 'texto', ancho: 200, porDefecto: false, leer: (u) => u.emailEnviado },
  { clave: 'notas', titulo: ETIQUETAS.notas, grupo: 'Candidatura', tipo: 'largo', ancho: 280, porDefecto: false, leer: (u) => u.notas },
  { clave: 'cvUsado', titulo: ETIQUETAS.cvUsado, grupo: 'Documentos', tipo: 'texto', ancho: 160, porDefecto: false, leer: (u) => u.cvUsado },
  { clave: 'cv', titulo: ETIQUETAS.cv, grupo: 'Documentos', tipo: 'enlace', ancho: 80, porDefecto: true, leer: (u) => u.cv, textoEnlace: TEXTOS_DE_ENLACE.ver },
  { clave: 'carta', titulo: ETIQUETAS.carta, grupo: 'Documentos', tipo: 'largo', ancho: 260, porDefecto: false, leer: (u) => u.carta },
  { clave: 'prep', titulo: ETIQUETAS.prep, grupo: 'Documentos', tipo: 'enlace', ancho: 80, porDefecto: false, leer: (u) => u.prep, textoEnlace: TEXTOS_DE_ENLACE.abrir },
  { clave: 'avisoAutonoma', titulo: ETIQUETAS.avisoAutonoma, grupo: 'Documentos', tipo: 'casilla', ancho: 130, porDefecto: false, leer: (u) => u.avisoAutonoma },
];

export const GRUPOS_DE_COLUMNAS = ['Oferta', 'Candidatura', 'Documentos'] as const;

export const CLAVES_POR_DEFECTO: readonly string[] = COLUMNAS.filter((c) => c.porDefecto).map((c) => c.clave);

const POR_CLAVE = new Map(COLUMNAS.map((c) => [c.clave, c]));

export function columnaPorClave(clave: string): Columna | undefined {
  return POR_CLAVE.get(clave);
}

/** El texto de la celda que no depende del idioma de la fecha: casillas como "Sí". */
function textoDeCelda(una: Candidatura, columna: Columna): string {
  const valor = columna.leer(una);
  if (columna.tipo === 'casilla') {
    return valor === true ? SI : '';
  }
  return typeof valor === 'string' ? valor : '';
}

/** El texto de la celda: fechas en el formato del idioma activo, casillas como "Sí". */
export function valorDeCelda(una: Candidatura, columna: Columna, locale: string): string {
  const texto = textoDeCelda(una, columna);
  return columna.tipo === 'fecha' ? formatearFecha(texto, locale) : texto;
}

/**
 * El valor por el que se ordena: las fechas en ISO, que ordenan bien como
 * texto; el resto, lo mismo que se lee en la celda.
 */
export function valorParaOrdenar(una: Candidatura, columna: Columna): string {
  return textoDeCelda(una, columna);
}

/** Cuantas fichas tienen algo en esa columna. Ayuda a decidir si merece la pena verla. */
export function conDato(candidaturas: readonly Candidatura[], columna: Columna): number {
  return candidaturas.filter((una) => {
    const valor = columna.leer(una);
    return valor === true || (typeof valor === 'string' && valor.trim() !== '');
  }).length;
}

/**
 * Lo guardado en el navegador, si se puede usar. Lo que no es una lista de
 * nombres no vale; los nombres que ya no existen se descartan, y la empresa
 * va siempre aunque alguien la haya quitado a mano.
 */
export function columnasGuardadas(crudo: unknown): string[] | null {
  if (!Array.isArray(crudo) || !crudo.every((c) => typeof c === 'string')) {
    return null;
  }
  const fijas = COLUMNAS.filter((c) => c.fija).map((c) => c.clave);
  const conocidas = (crudo as string[]).filter((c) => POR_CLAVE.has(c) && !fijas.includes(c));
  return [...fijas, ...conocidas];
}
