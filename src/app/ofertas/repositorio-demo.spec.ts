import { ESTADOS } from './dominio';
import { RepositorioDemo } from './repositorio-demo';

describe('RepositorioDemo', () => {
  it('trae candidaturas de ejemplo sin salir a la red', async () => {
    const candidaturas = await new RepositorioDemo().listar();

    expect(candidaturas.length).toBeGreaterThan(0);
  });

  it('cubre todos los estados, para que la demo enseñe el filtro entero', async () => {
    const candidaturas = await new RepositorioDemo().listar();

    const estados = new Set(candidaturas.map((una) => una.estado));

    expect(estados.size).toBe(ESTADOS.length);
  });

  it('no lleva datos de ninguna persona real', async () => {
    const candidaturas = await new RepositorioDemo().listar();

    const texto = JSON.stringify(candidaturas);

    expect(texto).not.toMatch(/@|\+34|linkedin\.com\/in\//);
  });
});
