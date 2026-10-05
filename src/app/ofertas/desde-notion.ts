import { Candidatura, EstadoDeCandidatura, ESTADOS, Modalidad, MODALIDADES, Oferta } from './dominio';

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

  const opcionales = ['descripcion', 'enlace', 'ubicacion', 'salario', 'fechaPublicacion'] as const;
  for (const campo of opcionales) {
    const valor = registro[campo]?.trim();
    if (valor) {
      oferta[campo] = valor;
    }
  }

  if ((MODALIDADES as readonly string[]).includes(registro.modalidad ?? '')) {
    oferta.modalidad = registro.modalidad as Modalidad;
  }

  const candidatura: Candidatura = { id: registro.id, oferta, estado };
  const seguimiento = ['viaEnvio', 'fechaEnvio', 'cv', 'carta'] as const;
  for (const campo of seguimiento) {
    const valor = registro[campo]?.trim();
    if (valor) {
      candidatura[campo] = valor;
    }
  }

  return candidatura;
}
