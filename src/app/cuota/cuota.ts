/**
 * La cuota mensual de generacion de quien ha entrado (ADR-010 de cv-server).
 * Las unidades son las del servidor: un CV cuesta 0,7 y una carta 0,3, asi
 * que un CV con su carta es exactamente una candidatura.
 */
export interface Cuota {
  readonly usadas: number;
  readonly limite: number;
  /** Primer dia del mes que viene, AAAA-MM-DD en UTC. */
  readonly seRenueva: string;
}

/** Por que no se puede generar: su cuota o el tope global del mes. */
export type MotivoDeAgotada = 'cuota' | 'tope';

export type TipoDeInteres = 'paquetes' | 'academia';

export interface Interes {
  readonly tipo: TipoDeInteres;
  readonly organizacion?: string;
}

export const TIPOS_DE_INTERES: readonly TipoDeInteres[] = ['paquetes', 'academia'];

/** El servidor rechaza una organizacion de mas de 120 caracteres. */
export const MAXIMO_DE_ORGANIZACION = 120;

const FECHA_DE_RENOVACION = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Una decima basta: asi 8 - 7,1 no sale 0,9000000000000004. */
function aDecimas(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Candidaturas enteras que quedan. Se redondea hacia abajo: decir "5" cuando
 * quedan 5,3 no promete nada que luego falte; los 0,3 sobrantes dan para una
 * carta suelta y no merecen un numero propio.
 */
export function candidaturasRestantes(cuota: Cuota): number {
  return Math.max(0, Math.floor(aDecimas(cuota.limite - cuota.usadas)));
}

/** La regla es la del servidor: se rechaza cuando lo usado alcanza el limite. */
export function agotada(cuota: Cuota): boolean {
  return cuota.usadas >= cuota.limite;
}

/** Lee `cuota` de la respuesta de /yo. Cualquier cosa rara es "no hay cuota": el medidor se esconde. */
export function cuotaDeCuerpo(cuerpo: unknown): Cuota | null {
  if (typeof cuerpo !== 'object' || cuerpo === null) return null;
  const cruda = (cuerpo as Record<string, unknown>)['cuota'];
  if (typeof cruda !== 'object' || cruda === null) return null;
  const { usadas, limite, se_renueva: seRenueva } = cruda as Record<string, unknown>;
  if (
    typeof usadas !== 'number' ||
    typeof limite !== 'number' ||
    !Number.isFinite(usadas) ||
    !Number.isFinite(limite) ||
    usadas < 0 ||
    limite <= 0 ||
    typeof seRenueva !== 'string' ||
    !FECHA_DE_RENOVACION.test(seRenueva)
  ) {
    return null;
  }
  return { usadas, limite, seRenueva };
}

/**
 * "1 de noviembre" o "November 1". Con el dia fijado en UTC: la fecha llega
 * sin zona horaria y leerla en la de quien mira podria moverla un dia.
 */
export function fechaDeRenovacion(iso: string, locale: string): string {
  const partes = FECHA_DE_RENOVACION.exec(iso);
  if (!partes) return '';
  const [, anio, mes, dia] = partes;
  const fecha = new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia)));
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(fecha);
}

export function textoDeRestantes(cuota: Cuota, locale: string): string {
  const restantes = candidaturasRestantes(cuota);
  const fecha = fechaDeRenovacion(cuota.seRenueva, locale);
  return restantes === 1
    ? $localize`:Cuantas candidaturas le queda a quien genera, una sola@@cuota.restantes.una:Te queda 1 candidatura este mes · se renueva el ${fecha}:fecha:`
    : $localize`:Cuantas candidaturas le quedan a quien genera, mas de una o ninguna entera@@cuota.restantes.varias:Te quedan ${restantes}:restantes: candidaturas este mes · se renueva el ${fecha}:fecha:`;
}

export function mensajeDeAgotada(motivo: MotivoDeAgotada, seRenueva: string, locale: string): string {
  const fecha = fechaDeRenovacion(seRenueva, locale);
  return motivo === 'tope'
    ? $localize`:Aviso de que el cupo gratuito de todo el mundo se ha agotado@@cuota.agotada.tope:Este mes se ha agotado el cupo gratuito para todo el mundo. Se renueva el ${fecha}:fecha:.`
    : $localize`:Aviso de que ha gastado sus candidaturas del mes@@cuota.agotada.cuota:Has usado tus candidaturas de este mes. Se renuevan el ${fecha}:fecha:.`;
}

/** Lo mismo que valida el servidor, para no mandar lo que va a rechazar. */
export function esInteresValido(interes: Interes): boolean {
  return (
    TIPOS_DE_INTERES.includes(interes.tipo) && (interes.organizacion ?? '').length <= MAXIMO_DE_ORGANIZACION
  );
}
