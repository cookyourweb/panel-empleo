import { Candidatura } from './dominio';
import { agruparBloques, seccionesDeFicha, vistaPreviaDeCv } from './ficha-campos';

const UNA: Candidatura = {
  id: 'n1',
  estado: 'Enviado',
  viaEnvio: 'LinkedIn',
  fechaEnvio: '2026-10-05',
  cv: 'https://docs.test/cv',
  cvUsado: 'CV base frontend',
  carta: 'Dear team,\n\nHello',
  notion: 'https://www.notion.so/n1',
  oferta: {
    id: 'o1',
    empresa: 'Acme',
    puesto: 'Frontend',
    idioma: 'en',
    salario: '60.000 €',
    enlace: 'https://ofertas.test/1',
    verificada: true,
  },
};

const etiquetas = (seccion: { campos: { etiqueta: string }[] }) => seccion.campos.map((c) => c.etiqueta);

describe('seccionesDeFicha', () => {
  it('reparte los campos en Oferta, Candidatura y Documentos, en ese orden', () => {
    expect(seccionesDeFicha(UNA, 'es').secciones.map((s) => s.titulo)).toEqual(['Oferta', 'Candidatura', 'Documentos']);
  });

  it('solo pinta los campos con dato y cuenta aparte los vacios', () => {
    const { secciones, vacios } = seccionesDeFicha(UNA, 'es');

    expect(etiquetas(secciones[0])).toContain('Salario');
    expect(etiquetas(secciones[0])).not.toContain('Modalidad');
    expect(vacios).toContain('Modalidad');
    expect(vacios).toContain('Fase');
  });

  it('empresa, puesto, estado y enlace no se repiten: ya van en la cabecera', () => {
    const todas = seccionesDeFicha(UNA, 'es').secciones.flatMap(etiquetas);

    for (const cabecera of ['Empresa', 'Puesto', 'Estado', 'Link oferta']) {
      expect(todas).not.toContain(cabecera);
    }
  });

  it('las fechas, como se leen en Espana', () => {
    const envio = seccionesDeFicha(UNA, 'es').secciones[1].campos.find((c) => c.clave === 'fechaEnvio');

    expect(envio?.valor).toBe('05/10/2026');
  });

  it('las fechas siguen el idioma activo, no uno fijo', () => {
    const envio = seccionesDeFicha(UNA, 'en').secciones[1].campos.find((c) => c.clave === 'fechaEnvio');

    expect(envio?.valor).toBe('Oct 5, 2026');
  });

  it('los textos largos ocupan todo el ancho', () => {
    const carta = seccionesDeFicha(UNA, 'es').secciones[2].campos.find((c) => c.clave === 'carta');

    expect(carta?.tipo).toBe('largo');
    expect(carta?.completo).toBe(true);
  });

  it('un enlace se ofrece con un texto que dice que abre', () => {
    const cv = seccionesDeFicha(UNA, 'es').secciones[2].campos.find((c) => c.clave === 'cv');

    expect(cv).toMatchObject({ tipo: 'enlace', valor: 'https://docs.test/cv', textoEnlace: 'Abrir CV' });
  });

  it('el CV usado que no es una direccion se queda como texto', () => {
    const usado = seccionesDeFicha(UNA, 'es').secciones[2].campos.find((c) => c.clave === 'cvUsado');

    expect(usado?.tipo).toBe('texto');
  });

  it('una casilla marcada se lee Si, y el idioma con su nombre', () => {
    const oferta = seccionesDeFicha(UNA, 'es').secciones[0].campos;

    expect(oferta.find((c) => c.clave === 'verificada')?.valor).toBe('Sí');
    expect(oferta.find((c) => c.clave === 'idioma')?.valor).toBe('Inglés');
  });
});

describe('agruparBloques', () => {
  it('junta las vinetas seguidas en una lista, y las numeradas en otra ordenada', () => {
    const grupos = agruparBloques([
      { tipo: 'subtitulo', texto: 'Entorno' },
      { tipo: 'vineta', texto: 'React' },
      { tipo: 'vineta', texto: 'Vue' },
      { tipo: 'numerado', texto: 'Uno' },
      { tipo: 'parrafo', texto: 'Fin' },
    ]);

    expect(grupos).toEqual([
      { tipo: 'subtitulo', texto: 'Entorno' },
      { tipo: 'lista', ordenada: false, elementos: [{ tipo: 'vineta', texto: 'React' }, { tipo: 'vineta', texto: 'Vue' }] },
      { tipo: 'lista', ordenada: true, elementos: [{ tipo: 'numerado', texto: 'Uno' }] },
      { tipo: 'parrafo', texto: 'Fin' },
    ]);
  });
});

describe('vistaPreviaDeCv', () => {
  it('un Google Docs se ve en su modo de vista previa', () => {
    expect(vistaPreviaDeCv('https://docs.google.com/document/d/1BzW6g-l_X/edit?usp=sharing')).toBe(
      'https://docs.google.com/document/d/1BzW6g-l_X/preview',
    );
  });

  it('un PDF de Drive tambien', () => {
    expect(vistaPreviaDeCv('https://drive.google.com/file/d/1aB_c-D/view')).toBe(
      'https://drive.google.com/file/d/1aB_c-D/preview',
    );
  });

  it('cualquier otra direccion no se incrusta: solo se enlaza', () => {
    expect(vistaPreviaDeCv('https://ejemplo.test/cv/lumen-grid')).toBeNull();
    expect(vistaPreviaDeCv('https://docs.google.com.malo.test/document/d/x/edit')).toBeNull();
    expect(vistaPreviaDeCv('http://docs.google.com/document/d/x/edit')).toBeNull();
    expect(vistaPreviaDeCv('javascript:alert(1)')).toBeNull();
  });
});

describe('Documentos de la ficha', () => {
  it('el CV de Google trae su vista previa y ocupa todo el ancho', () => {
    const cv = seccionesDeFicha({ ...UNA, cv: 'https://docs.google.com/document/d/abc/edit' }, 'es').secciones[2].campos.find(
      (c) => c.clave === 'cv',
    );

    expect(cv?.vistaPrevia).toBe('https://docs.google.com/document/d/abc/preview');
    expect(cv?.completo).toBe(true);
  });

  it('el CV y la carta van primero: es lo que se revisa antes de enviar', () => {
    const claves = seccionesDeFicha(UNA, 'es').secciones[2].campos.map((c) => c.clave);

    expect(claves.slice(0, 2)).toEqual(['cv', 'carta']);
  });

  it('la carta se llama por su nombre', () => {
    const carta = seccionesDeFicha(UNA, 'es').secciones[2].campos.find((c) => c.clave === 'carta');

    expect(carta?.etiqueta).toBe('Carta de presentación');
  });
});
