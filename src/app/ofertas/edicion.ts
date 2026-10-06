import { Candidatura, Modalidad, MODALIDADES, Oferta } from './dominio';

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
  campo('empresa', 'Empresa', 'texto', 'Cabecera'),
  campo('puesto', 'Puesto', 'texto', 'Cabecera'),
  campo('enlace', 'Link oferta', 'enlace', 'Cabecera'),
  campo('modalidad', 'Modalidad', 'opcion', 'Oferta'),
  campo('ubicacion', 'Ubicación', 'texto', 'Oferta'),
  campo('salario', 'Salario', 'texto', 'Oferta'),
  campo('fechaPublicacion', 'Publicada', 'fecha', 'Oferta'),
  campo('tipoContrato', 'Tipo de contrato', 'texto', 'Oferta'),
  campo('modoContratacion', 'Modo de contratación', 'opcion', 'Oferta'),
  campo('verificada', 'Verificada', 'casilla', 'Oferta'),
  campo('palabrasClave', 'Palabras clave', 'largo', 'Oferta'),
  campo('descripcion', 'Descripción', 'largo', 'Oferta'),
  campo('fase', 'Fase', 'opcion', 'Candidatura'),
  campo('viaEnvio', 'Vía envío', 'opcion', 'Candidatura'),
  campo('seguimiento', 'Seguimiento', 'fecha', 'Candidatura'),
  campo('fechaEntrevista', 'Fecha entrevista', 'fecha', 'Candidatura'),
  campo('formatoTecnico', 'Formato técnico', 'opcion', 'Candidatura'),
  campo('nombreContacto', 'Nombre contacto', 'texto', 'Candidatura'),
  campo('telefonoContacto', 'Teléfono contacto', 'tel', 'Candidatura'),
  campo('emailEmpresa', 'Email empresa', 'email', 'Candidatura'),
  campo('emailEnviado', 'Email enviado', 'email', 'Candidatura'),
  campo('notas', 'Notas', 'largo', 'Candidatura'),
  campo('cv', 'CV generado (enlace)', 'enlace', 'Documentos'),
  campo('carta', 'Carta de presentación', 'largo', 'Documentos'),
  campo('cvUsado', 'CV usado', 'texto', 'Documentos'),
  campo('prep', 'Preparación (enlace)', 'enlace', 'Documentos'),
  campo('avisoAutonoma', 'Aviso autónoma en carta', 'casilla', 'Documentos'),
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
