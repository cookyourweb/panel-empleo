import { accionesPara, EnlacesDeAccion } from './acciones';
import { Candidatura } from './dominio';

const ENLACES: EnlacesDeAccion = {
  aprobar: 'https://n8n.test/webhook/A?id=',
  descartar: 'https://n8n.test/webhook/D?id=',
  enviarEmpresa: 'https://n8n.test/webhook/E?id=',
};

function una(estado: Candidatura['estado'], id = '3e611515-f4b2-8189-abb1-efee59dbeaaa', cv?: string): Candidatura {
  return { id, estado, ...(cv ? { cv } : {}), oferta: { id, empresa: 'bunch', puesto: 'Staff', idioma: 'en' } };
}

const CV = 'https://docs.google.com/document/d/x';

describe('accionesPara', () => {
  it('una pendiente se puede aprobar o descartar', () => {
    const acciones = accionesPara(una('Pendiente'), ENLACES);

    expect(acciones.map((a) => a.tipo)).toEqual(['aprobar', 'descartar']);
    expect(acciones[0].url).toBe('https://n8n.test/webhook/A?id=3e611515-f4b2-8189-abb1-efee59dbeaaa');
  });

  it('aprobada y con su CV hecho, solo falta enviarla a la empresa', () => {
    // n8n la marca Aprobado y al instante En proceso mientras genera el CV:
    // lo que dice que esta lista para enviar es que ya tenga el CV.
    for (const estado of ['En proceso', 'Aprobado'] as const) {
      const acciones = accionesPara(una(estado, undefined, CV), ENLACES);

      expect(acciones.map((a) => [a.tipo, a.etiqueta])).toEqual([['enviarEmpresa', 'Enviar a empresa']]);
    }
  });

  it('si ya tiene via de envio, se mando por otro canal: no se ofrece enviarla otra vez', () => {
    const enviadaPorPortal: Candidatura = { ...una('En proceso', undefined, CV), viaEnvio: 'Portal empresa' };

    expect(accionesPara(enviadaPorPortal, ENLACES)).toEqual([]);
  });

  it('sin CV todavia no se puede enviar: no habria nada que mandar', () => {
    expect(accionesPara(una('En proceso'), ENLACES)).toEqual([]);
    expect(accionesPara(una('Aprobado'), ENLACES)).toEqual([]);
  });

  it('en el resto de estados no hay nada que hacer desde aqui', () => {
    for (const estado of ['Enviado', 'Entrevista', 'Rechazado', 'Descartado', 'Caducada'] as const) {
      expect(accionesPara(una(estado, undefined, CV), ENLACES)).toEqual([]);
    }
  });

  it('sin enlaces configurados no ofrece acciones: es lo que pasa en la demo publica', () => {
    expect(accionesPara(una('Pendiente'), null)).toEqual([]);
  });

  it('una ficha que aun no existe en Notion no se puede aprobar: n8n no la encontraria', () => {
    expect(accionesPara(una('Pendiente', 'local-2026-10-05-x'), ENLACES)).toEqual([]);
  });

  it('el id va codificado en la URL', () => {
    const acciones = accionesPara(una('Pendiente', 'a b&c'), ENLACES);

    expect(acciones[0].url.endsWith('id=a%20b%26c')).toBe(true);
  });
});
