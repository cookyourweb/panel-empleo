import { RUTA_DATOS_LOCALES, RepositorioLocal } from './repositorio-local';

function respuesta(cuerpo: unknown, ok = true): Response {
  return { ok, status: ok ? 200 : 404, json: async () => cuerpo } as Response;
}

describe('RepositorioLocal', () => {
  afterEach(() => vi.restoreAllMocks());

  it('lee el fichero local y lo traduce al dominio', async () => {
    const fetchFalso = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      respuesta([
        { id: 'n1', empresa: 'bunch', puesto: 'Staff Frontend Engineer', estado: 'Enviado a empresa' },
        { id: 'n2', empresa: 'Heymondo', puesto: 'Senior Frontend Developer', estado: 'Pendiente', idioma: 'en' },
      ]),
    );

    const candidaturas = await new RepositorioLocal().listar();

    expect(fetchFalso).toHaveBeenCalledWith(RUTA_DATOS_LOCALES);
    expect(candidaturas.map((una) => [una.oferta.empresa, una.estado])).toEqual([
      ['bunch', 'Enviado'],
      ['Heymondo', 'Pendiente'],
    ]);
  });

  it('se salta las fichas que no se pueden traducir, sin romper la lista', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      respuesta([
        { id: 'n1', empresa: 'bunch', puesto: 'Staff', estado: 'Enviado' },
        { id: 'n2', empresa: 'ZZZ BORRAR', puesto: 'x', estado: 'Caducada' },
        { id: 'n3', empresa: 'Rara', puesto: 'x', estado: 'Estado nuevo' },
      ]),
    );

    const candidaturas = await new RepositorioLocal().listar();

    expect(candidaturas.map((una) => una.id)).toEqual(['n1']);
  });

  it('sin fichero local devuelve una lista vacia y avisa de como generarlo', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(respuesta(null, false));
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const candidaturas = await new RepositorioLocal().listar();

    expect(candidaturas).toEqual([]);
    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('generar'));
  });

  it('si el fichero no es una lista, no se inventa candidaturas', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(respuesta({ no: 'es una lista' }));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(await new RepositorioLocal().listar()).toEqual([]);
  });
});
