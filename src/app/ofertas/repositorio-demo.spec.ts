import { RepositorioDemo } from './repositorio-demo';

describe('RepositorioDemo', () => {
  it('trae ofertas de ejemplo sin salir a la red', async () => {
    const ofertas = await new RepositorioDemo().listar();

    expect(ofertas.length).toBeGreaterThan(0);
  });

  it('cubre los ocho estados, para que la demo enseñe el filtro entero', async () => {
    const ofertas = await new RepositorioDemo().listar();

    const estados = new Set(ofertas.map((oferta) => oferta.estado));

    expect(estados.size).toBe(8);
  });

  it('no lleva datos de ninguna persona real', async () => {
    const ofertas = await new RepositorioDemo().listar();

    const texto = JSON.stringify(ofertas);

    expect(texto).not.toMatch(/@|\+34|linkedin\.com\/in\//);
  });
});
