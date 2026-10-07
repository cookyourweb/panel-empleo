import { EstadoDeCandidatura } from './dominio';

/**
 * El estado tal como se lee en pantalla. La clave del dominio (la que viaja a
 * Notion y se guarda) no cambia con el idioma: solo lo que se enseña.
 */
const NOMBRES: Record<EstadoDeCandidatura, string> = {
  Pendiente: $localize`:Estado de una candidatura@@estado.pendiente:Pendiente`,
  Aprobado: $localize`:Estado de una candidatura@@estado.aprobado:Aprobado`,
  'En proceso': $localize`:Estado de una candidatura@@estado.enProceso:En proceso`,
  Enviado: $localize`:Estado de una candidatura@@estado.enviado:Enviado`,
  Entrevista: $localize`:Estado de una candidatura@@estado.entrevista:Entrevista`,
  Rechazado: $localize`:Estado de una candidatura, lo decide la empresa@@estado.rechazado:Rechazado`,
  Descartado: $localize`:Estado de una candidatura, lo decide quien busca@@estado.descartado:Descartado`,
  Caducada: $localize`:Estado de una candidatura@@estado.caducada:Caducada`,
  'Contactada directamente': $localize`:Estado de una candidatura@@estado.contactadaDirectamente:Contactada directamente`,
};

export function nombreDeEstado(estado: EstadoDeCandidatura): string {
  return NOMBRES[estado];
}
