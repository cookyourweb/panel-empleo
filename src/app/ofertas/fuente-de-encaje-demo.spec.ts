import { sinDatosParaEvaluar } from './encaje';
import { FuenteDeEncajeDemo } from './fuente-de-encaje-demo';

describe('FuenteDeEncajeDemo', () => {
  const fuente = new FuenteDeEncajeDemo();

  it('da un encaje con evidencias para una oferta de la demo', async () => {
    const resultado = await fuente.obtener('o1');

    expect(resultado.estado).toBe('listo');
    if (resultado.estado === 'listo') {
      expect(resultado.encaje.cubiertos.length).toBeGreaterThan(0);
      expect(resultado.encaje.cubiertos.every((c) => c.evidencia.length > 0)).toBe(true);
      expect(resultado.encaje.alcanzable).toBe(true);
    }
  });

  it('hay ofertas con un hueco eliminatorio que no son alcanzables', async () => {
    const resultado = await fuente.obtener('o3');

    expect(resultado.estado === 'listo' && resultado.encaje.huecos.some((h) => h.eliminatorio)).toBe(true);
    expect(resultado.estado === 'listo' && resultado.encaje.alcanzable).toBe(false);
  });

  it('una oferta sin tecnologias reconocidas sale sin datos y sin alcanzable, no inventada', async () => {
    const resultado = await fuente.obtener('no-existe');

    expect(resultado.estado === 'listo' && sinDatosParaEvaluar(resultado.encaje)).toBe(true);
    expect(resultado.estado === 'listo' && resultado.encaje.alcanzable).toBe(false);
  });

  it('el resumen es coherente con el detalle', async () => {
    const resumen = await fuente.resumen(['o1', 'o3', 'no-existe']);
    const detalle = await fuente.obtener('o1');

    expect(Object.keys(resumen)).toEqual(['o1', 'o3', 'no-existe']);
    expect(detalle.estado === 'listo' && resumen['o1']).toEqual(
      detalle.estado === 'listo' ? { alcanzable: detalle.encaje.alcanzable, cobertura: detalle.encaje.cobertura } : null,
    );
  });
});
