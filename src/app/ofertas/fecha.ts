/**
 * AAAA-MM-DD a DD/MM/AAAA, cortando la hora si la trae.
 *
 * A mano y no con DatePipe: la fecha llega sin zona horaria, y convertirla a
 * Date puede moverla un dia segun donde se abra el panel.
 */
export function fechaEspanola(iso: string | undefined): string {
  const partes = iso?.slice(0, 10).split('-');
  return partes?.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : '';
}
