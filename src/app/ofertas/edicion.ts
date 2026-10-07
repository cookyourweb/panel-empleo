import { Candidatura, Modalidad, MODALIDADES, Oferta } from './dominio';
import { ETIQUETAS } from './etiquetas';

/** Lo que se cambia al editar: el campo y su valor nuevo. Vacio o false lo borra. */
export type CambiosDeCandidatura = Record<string, string | boolean>;

/** Las opciones de cada desplegable, tal como estan en Notion. */
export type OpcionesDeEdicion = Record<string, string[]>;

export type TipoDeEntrada = 'texto' | 'largo' | 'fecha' | 'email' | 'tel' | 'enlace' | 'casilla' | 'opcion';

export interface CampoEditable {
  clave: string;
  etiqueta: string;
  tipo: TipoDeEntrada;
  seccion: 'Cabecera' | 'Oferta' | 'Candidatura' | 'Documentos';
  /** Si vive en la oferta; si no, en la candidatura. */
  enOferta: boolean;
}

const campo = (
  clave: string,
  etiqueta: string,
  tipo: TipoDeEntrada,
  seccion: CampoEditable['seccion'],
  enOferta = seccion === 'Oferta' || seccion === 'Cabecera',
): CampoEditable => ({ clave, etiqueta, tipo, seccion, enOferta });

/**
 * Lo que se puede cambiar desde la ficha, en el orden en que se ve.
 *
 * Tiene que coincidir con CAMPOS de puente.py: lo que no esta alli, el puente
 * lo rechaza. No estan el estado (va por las acciones de n8n), el idioma y los
 * tags (deciden el CV y la captacion), ni la fecha de envio (en Notion son dos).
 */
export const CAMPOS_EDITABLES: readonly CampoEditable[] = [
  campo('empresa', ETIQUETAS.empresa, 'texto', 'Cabecera'),
  campo('puesto', ETIQUETAS.puesto, 'texto', 'Cabecera'),
  campo('enlace', ETIQUETAS.linkOferta, 'enlace', 'Cabecera'),
  campo('modalidad', ETIQUETAS.modalidad, 'opcion', 'Oferta'),
  campo('ubicacion', ETIQUETAS.ubicacion, 'texto', 'Oferta'),
  campo('salario', ETIQUETAS.salario, 'texto', 'Oferta'),
  campo('fechaPublicacion', ETIQUETAS.fechaPublicacion, 'fecha', 'Oferta'),
  campo('tipoContrato', ETIQUETAS.tipoContrato, 'texto', 'Oferta'),
  campo('modoContratacion', ETIQUETAS.modoContratacion, 'opcion', 'Oferta'),
  campo('verificada', ETIQUETAS.verificada, 'casilla', 'Oferta'),
  campo('palabrasClave', ETIQUETAS.palabrasClave, 'largo', 'Oferta'),
  campo('descripcion', ETIQUETAS.descripcion, 'largo', 'Oferta'),
  campo('fase', ETIQUETAS.fase, 'opcion', 'Candidatura'),
  campo('viaEnvio', ETIQUETAS.viaEnvio, 'opcion', 'Candidatura'),
  campo('seguimiento', ETIQUETAS.seguimiento, 'fecha', 'Candidatura'),
  campo('fechaEntrevista', ETIQUETAS.fechaEntrevista, 'fecha', 'Candidatura'),
  campo('formatoTecnico', ETIQUETAS.formatoTecnico, 'opcion', 'Candidatura'),
  campo('nombreContacto', ETIQUETAS.nombreContacto, 'texto', 'Candidatura'),
  campo('telefonoContacto', ETIQUETAS.telefonoContacto, 'tel', 'Candidatura'),
  campo('emailEmpresa', ETIQUETAS.emailEmpresa, 'email', 'Candidatura'),
  campo('emailEnviado', ETIQUETAS.emailEnviado, 'email', 'Candidatura'),
  campo('notas', ETIQUETAS.notas, 'largo', 'Candidatura'),
  campo('cv', ETIQUETAS.cvGeneradoEnlace, 'enlace', 'Documentos'),
  campo('carta', ETIQUETAS.cartaDePresentacion, 'largo', 'Documentos'),
  campo('cvUsado', ETIQUETAS.cvUsado, 'texto', 'Documentos'),
  campo('prep', ETIQUETAS.preparacionEnlace, 'enlace', 'Documentos'),
  campo('avisoAutonoma', ETIQUETAS.avisoAutonomaEnCarta, 'casilla', 'Documentos'),
];

/** Modalidad es del dominio, no de Notion: sus opciones son las que el panel entiende. */
export const OPCIONES_FIJAS: OpcionesDeEdicion = { modalidad: [...MODALIDADES] };

type Lugar = Record<string, unknown>;

function lugarDe(una: Candidatura | { oferta: Oferta }, def: CampoEditable): Lugar {
  return (def.enOferta ? una.oferta : una) as unknown as Lugar;
}

/** Un valor por campo editable, con los vacios en blanco para poder rellenarlos. */
export function valoresEditables(una: Candidatura): CambiosDeCandidatura {
  const valores: CambiosDeCandidatura = {};
  for (const def of CAMPOS_EDITABLES) {
    const valor = lugarDe(una, def)[def.clave];
    valores[def.clave] = def.tipo === 'casilla' ? valor === true : typeof valor === 'string' ? valor : '';
  }
  return valores;
}

const normal = (valor: string | boolean | undefined) => (typeof valor === 'string' ? valor.trim() : valor);

/** Solo lo que cambio. Espacios sobrantes en los extremos no son un cambio. */
export function cambiosEntre(antes: CambiosDeCandidatura, despues: CambiosDeCandidatura): CambiosDeCandidatura {
  const cambios: CambiosDeCandidatura = {};
  for (const [clave, valor] of Object.entries(despues)) {
    if (normal(valor) !== normal(antes[clave])) {
      cambios[clave] = normal(valor) as string | boolean;
    }
  }
  return cambios;
}

/**
 * La candidatura con los cambios ya puestos, sin tocar la original.
 *
 * Deja el mismo dato que dejaria volver a leerla de Notion: lo vaciado
 * desaparece, y una modalidad que el dominio no conoce no entra.
 */
export function aplicarCambios(una: Candidatura, cambios: CambiosDeCandidatura): Candidatura {
  const copia: Candidatura = { ...una, oferta: { ...una.oferta } };
  for (const [clave, valor] of Object.entries(cambios)) {
    const def = CAMPOS_EDITABLES.find((c) => c.clave === clave);
    if (!def) {
      continue;
    }
    const lugar = lugarDe(copia, def);
    const vacio = valor === '' || valor === false;
    const desconocida = clave === 'modalidad' && !(MODALIDADES as readonly unknown[]).includes(valor);
    if (vacio || desconocida) {
      delete lugar[clave];
    } else {
      lugar[clave] = clave === 'modalidad' ? (valor as Modalidad) : valor;
    }
  }
  return copia;
}
