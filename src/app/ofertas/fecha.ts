const ISO = /^(\d{4})-(\d{2})-(\d{2})/;

/** En español, DD/MM/AAAA. */
const NUMERICA: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' };

/**
 * Con el mes en letras. Fuera del español, 05/10 se lee 5 de octubre o 10 de
 * mayo segun el pais, y una fecha ambigua en una tabla de plazos es un riesgo.
 */
const CON_MES: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' };

/**
 * AAAA-MM-DD en el formato del idioma activo, cortando la hora si la trae.
 *
 * Sin DatePipe y con la hora fijada en UTC: la fecha llega sin zona horaria, y
 * leerla en la zona de quien abre el panel puede moverla un dia.
 */
export function formatearFecha(iso: string | undefined, locale: string): string {
  const partes = ISO.exec(iso ?? '');
  if (!partes) {
    return '';
  }
  const [, anio, mes, dia] = partes;
  const fecha = new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia)));
  const opciones = new Intl.Locale(locale).language === 'es' ? NUMERICA : CON_MES;
  return new Intl.DateTimeFormat(locale, opciones).format(fecha);
}
