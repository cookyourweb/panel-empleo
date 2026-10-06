import {
  Bloque,
  Candidatura,
  EstadoDeCandidatura,
  ESTADOS,
  Modalidad,
  MODALIDADES,
  Oferta,
  TIPOS_DE_BLOQUE,
} from './dominio';

/**
 * Una ficha tal como sale del seguimiento en Notion, ya aplanada.
 *
 * Es la forma del fichero local que lee el panel en desarrollo. Los valores
 * llegan como texto libre porque Notion no garantiza nada: la traduccion al
 * dominio decide que se acepta y que no.
 */
export interface RegistroLocal {
  id: string;
  empresa: string;
  puesto: string;
  estado: string;
  idioma?: string;
  descripcion?: string;
  enlace?: string;
  ubicacion?: string;
  modalidad?: string;
  salario?: string;
  fechaPublicacion?: string;
  viaEnvio?: string;
  fechaEnvio?: string;
  cv?: string;
  carta?: string;
  tipoContrato?: string;
  modoContratacion?: string;
  palabrasClave?: string;
  tags?: string;
  verificada?: boolean;
  fase?: string;
  seguimiento?: string;
  fechaEntrevista?: string;
  formatoTecnico?: string;
  nombreContacto?: string;
  telefonoContacto?: string;
  emailEmpresa?: string;
  emailEnviado?: string;
  notas?: string;
  cvUsado?: string;
  prep?: string;
  avisoAutonoma?: boolean;
  notion?: string;
  creada?: string;
  /** Sin tipo a proposito: se valida bloque a bloque al traducirlo. */
  cuerpo?: unknown;
}

/**
 * Notion tiene estados que el dominio no tiene, y se traducen aqui y en ningun
 * otro sitio. Si el dominio adoptara los nombres de Notion, cambiar de
 * herramienta de seguimiento obligaria a tocar el panel entero.
 */
const EQUIVALENCIAS: Record<string, EstadoDeCandidatura> = {
  'Enviado a empresa': 'Enviado',
  'Oferta recibida': 'Entrevista',
};

export function estadoDesdeNotion(estado: string): EstadoDeCandidatura | null {
  if ((ESTADOS as readonly string[]).includes(estado)) {
    return estado as EstadoDeCandidatura;
  }
  return EQUIVALENCIAS[estado] ?? null;
}

/** Las fichas que en Notion se marcaron para borrar no son candidaturas. */
const MARCA_DE_BORRADO = /^ZZZ/;

export function candidaturaDesdeRegistro(registro: RegistroLocal): Candidatura | null {
  const empresa = registro.empresa?.trim();
  const estado = estadoDesdeNotion(registro.estado ?? '');
  if (!empresa || MARCA_DE_BORRADO.test(empresa) || estado === null) {
    return null;
  }

  const oferta: Oferta = {
    id: registro.id,
    empresa,
    puesto: registro.puesto?.trim() ?? '',
    idioma: registro.idioma === 'en' ? 'en' : 'es',
  };

  const opcionales = [
    'descripcion',
    'enlace',
    'ubicacion',
    'salario',
    'fechaPublicacion',
    'tipoContrato',
    'modoContratacion',
    'palabrasClave',
    'tags',
  ] as const;
  for (const campo of opcionales) {
    const valor = registro[campo]?.trim();
    if (valor) {
      oferta[campo] = valor;
    }
  }

  // Una casilla sin marcar no se copia: no dice nada que no diga su ausencia.
  if (registro.verificada === true) {
    oferta.verificada = true;
  }

  if ((MODALIDADES as readonly string[]).includes(registro.modalidad ?? '')) {
    oferta.modalidad = registro.modalidad as Modalidad;
  }

  const candidatura: Candidatura = { id: registro.id, oferta, estado };
  const seguimiento = [
    'viaEnvio',
    'fechaEnvio',
    'cv',
    'carta',
    'fase',
    'seguimiento',
    'fechaEntrevista',
    'formatoTecnico',
    'nombreContacto',
    'telefonoContacto',
    'emailEmpresa',
    'emailEnviado',
    'notas',
    'cvUsado',
    'prep',
    'notion',
    'creada',
  ] as const;
  for (const campo of seguimiento) {
    const valor = registro[campo]?.trim();
    if (valor) {
      candidatura[campo] = valor;
    }
  }

  if (registro.avisoAutonoma === true) {
    candidatura.avisoAutonoma = true;
  }

  const cuerpo = bloquesDesde(registro.cuerpo);
  if (cuerpo.length) {
    candidatura.cuerpo = cuerpo;
  }

  return candidatura;
}

/** Se queda con los bloques que sabe pintar y deja fuera el resto sin romper. */
function bloquesDesde(cuerpo: unknown): Bloque[] {
  if (!Array.isArray(cuerpo)) {
    return [];
  }
  const bloques: Bloque[] = [];
  for (const crudo of cuerpo) {
    if (typeof crudo !== 'object' || crudo === null) {
      continue;
    }
    const { tipo, texto, nivel, hecho } = crudo as Record<string, unknown>;
    if (!(TIPOS_DE_BLOQUE as readonly unknown[]).includes(tipo)) {
      continue;
    }
    const bloque: Bloque = { tipo: tipo as Bloque['tipo'], texto: typeof texto === 'string' ? texto : '' };
    if (typeof nivel === 'number' && nivel > 0) {
      bloque.nivel = nivel;
    }
    if (bloque.tipo === 'tarea' && typeof hecho === 'boolean') {
      bloque.hecho = hecho;
    }
    bloques.push(bloque);
  }
  return bloques;
}
