import { FuenteDeAccionesDemo, FuenteDeAccionesLocal, RUTA_ACCIONES_LOCALES } from './fuente-de-acciones';

function respuesta(cuerpo: unknown, ok = true): Response {
  return { ok, status: ok ? 200 : 404, json: async () => cuerpo } as Response;
}

describe('FuenteDeAccionesLocal', () => {
  afterEach(() => vi.restoreAllMocks());

  it('lee los enlaces del fichero local', async () => {
    const fetchFalso = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      respuesta({ aprobar: 'https://a?id=', descartar: 'https://d?id=', enviarEmpresa: 'https://e?id=' }),
    );

    const enlaces = await new FuenteDeAccionesLocal().enlaces();

    expect(fetchFalso).toHaveBeenCalledWith(RUTA_ACCIONES_LOCALES);
    expect(enlaces?.aprobar).toBe('https://a?id=');
  });

  it('sin fichero no hay acciones, y la tabla sigue funcionando', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(respuesta(null, false));

    expect(await new FuenteDeAccionesLocal().enlaces()).toBeNull();
  });

  it('un fichero incompleto no da acciones a medias', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(respuesta({ aprobar: 'https://a?id=' }));

    expect(await new FuenteDeAccionesLocal().enlaces()).toBeNull();
  });

  it('solo acepta direcciones https: un enlace raro no se convierte en boton', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      respuesta({ aprobar: 'javascript:alert(1)', descartar: 'https://d?id=', enviarEmpresa: 'https://e?id=' }),
    );

    expect(await new FuenteDeAccionesLocal().enlaces()).toBeNull();
  });
});

describe('FuenteDeAccionesDemo', () => {
  it('la demo publica no tiene acciones', async () => {
    expect(await new FuenteDeAccionesDemo().enlaces()).toBeNull();
  });
});
