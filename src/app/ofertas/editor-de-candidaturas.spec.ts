import { EditorDemo, EditorLocal } from './editor-de-candidaturas';

describe('EditorLocal', () => {
  afterEach(() => vi.restoreAllMocks());

  function respuesta(estado: number, cuerpo: unknown): Response {
    return new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json' } });
  }

  it('manda solo los cambios al puente local, como JSON', async () => {
    const llamada = vi.spyOn(globalThis, 'fetch').mockResolvedValue(respuesta(200, { ok: true }));

    await new EditorLocal().guardar('3f01-ab', { notas: 'Hola' });

    const [url, opciones] = llamada.mock.calls[0];
    expect(url).toBe('/api/candidaturas/3f01-ab');
    expect(opciones?.method).toBe('PATCH');
    expect(new Headers(opciones?.headers).get('Content-Type')).toBe('application/json');
    expect(JSON.parse(String(opciones?.body))).toEqual({ notas: 'Hola' });
  });

  it('si el puente dice que no, el error lleva su motivo', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(respuesta(400, { error: 'seguimiento: la fecha va como AAAA-MM-DD' }));

    await expect(new EditorLocal().guardar('3f01', { seguimiento: 'x' })).rejects.toThrow('AAAA-MM-DD');
  });

  it('sin puente arrancado no hay opciones, y la ficha no ofrece editar', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    expect(await new EditorLocal().opciones()).toBeNull();
  });

  it('con puente, trae las opciones de cada desplegable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(respuesta(200, { fase: ['CV enviado'], viaEnvio: ['LinkedIn'] }));

    expect(await new EditorLocal().opciones()).toEqual({ fase: ['CV enviado'], viaEnvio: ['LinkedIn'] });
  });
});

describe('EditorLocal, papelera', () => {
  afterEach(() => vi.restoreAllMocks());

  const respuesta = (cuerpo: unknown, estado = 200) =>
    new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json' } });

  it('eliminar manda los ids y devuelve los que de verdad fueron a la papelera', async () => {
    const llamada = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(respuesta({ hechas: ['a'], fallidas: [{ id: 'b', error: 502 }] }, 207));

    expect(await new EditorLocal().eliminar(['a', 'b'])).toEqual(['a']);
    const [url, opciones] = llamada.mock.calls[0];
    expect(url).toBe('/api/candidaturas/eliminar');
    expect(opciones?.method).toBe('POST');
    expect(JSON.parse(String(opciones?.body))).toEqual({ ids: ['a', 'b'] });
  });

  it('restaurar hace lo mismo hacia el otro lado', async () => {
    const llamada = vi.spyOn(globalThis, 'fetch').mockResolvedValue(respuesta({ hechas: ['a'], fallidas: [] }));

    expect(await new EditorLocal().restaurar(['a'])).toEqual(['a']);
    expect(llamada.mock.calls[0][0]).toBe('/api/candidaturas/restaurar');
  });

  it('trae la lista de eliminadas; sin puente, vacia', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      respuesta([{ cuando: '2026-10-06T08:00:00', registro: { id: 'a', empresa: 'Acme', puesto: 'Front', estado: 'Pendiente' } }]),
    );
    expect(await new EditorLocal().eliminadas()).toHaveLength(1);

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));
    expect(await new EditorLocal().eliminadas()).toEqual([]);
  });
});

describe('EditorDemo', () => {
  it('la demo publica no edita nada', async () => {
    expect(await new EditorDemo().opciones()).toBeNull();
  });
});
