/** "1 oferta" o "3 ofertas": con el numero delante, que es lo primero que se lee. */
export function plural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
