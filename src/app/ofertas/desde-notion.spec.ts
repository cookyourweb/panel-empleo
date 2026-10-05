import { candidaturaDesdeRegistro, estadoDesdeNotion, RegistroLocal } from './desde-notion';

describe('estadoDesdeNotion', () => {
  it('deja igual los estados que el dominio ya conoce', () => {
    expect(estadoDesdeNotion('Pendiente')).toBe('Pendiente');
    expect(estadoDesdeNotion('Entrevista')).toBe('Entrevista');
    expect(estadoDesdeNotion('Contactada directamente')).toBe('Contactada directamente');
  });

  it('cuenta "Enviado a empresa" como Enviado: para quien busca es el mismo paso', () => {
    expect(estadoDesdeNotion('Enviado a empresa')).toBe('Enviado');
  });

  it('"Aprobado" es un estado propio: el CV esta hecho pero aun no ha salido', () => {
    expect(estadoDesdeNotion('Aprobado')).toBe('Aprobado');
  });

  it('cuenta "Oferta recibida" como Entrevista, el estado mas avanzado del dominio', () => {
    expect(estadoDesdeNotion('Oferta recibida')).toBe('Entrevista');
  });

  it('devuelve null ante un estado que no conoce, en vez de inventarse uno', () => {
    expect(estadoDesdeNotion('Algo nuevo')).toBeNull();
    expect(estadoDesdeNotion('')).toBeNull();
  });
});

describe('candidaturaDesdeRegistro', () => {
  const base: RegistroLocal = {
    id: 'n1',
    empresa: 'bunch',
    puesto: 'Staff Frontend Engineer',
    estado: 'Enviado a empresa',
  };

  it('arma la candidatura con su oferta y el estado traducido', () => {
    const una = candidaturaDesdeRegistro(base);

    expect(una).toEqual({
      id: 'n1',
      estado: 'Enviado',
      oferta: { id: 'n1', empresa: 'bunch', puesto: 'Staff Frontend Engineer', idioma: 'es' },
    });
  });

  it('respeta el idioma ingles y descarta cualquier otro valor', () => {
    expect(candidaturaDesdeRegistro({ ...base, idioma: 'en' })?.oferta.idioma).toBe('en');
    expect(candidaturaDesdeRegistro({ ...base, idioma: 'fr' })?.oferta.idioma).toBe('es');
  });

  it('solo copia una modalidad que el dominio conoce', () => {
    expect(candidaturaDesdeRegistro({ ...base, modalidad: 'Remoto' })?.oferta.modalidad).toBe('Remoto');
    expect(candidaturaDesdeRegistro({ ...base, modalidad: 'Teletrabajo' })?.oferta.modalidad).toBeUndefined();
  });

  it('no inventa campos opcionales vacios', () => {
    const una = candidaturaDesdeRegistro({ ...base, salario: '', enlace: '  ' });

    expect(una?.oferta).not.toHaveProperty('salario');
    expect(una?.oferta).not.toHaveProperty('enlace');
  });

  it('descarta el registro sin empresa o con estado desconocido', () => {
    expect(candidaturaDesdeRegistro({ ...base, empresa: '' })).toBeNull();
    expect(candidaturaDesdeRegistro({ ...base, estado: 'Algo nuevo' })).toBeNull();
  });

  it('descarta las fichas marcadas para borrar en Notion', () => {
    expect(candidaturaDesdeRegistro({ ...base, empresa: 'ZZZ BORRAR - duplicado de Joppy' })).toBeNull();
  });

  it('trae el seguimiento a la candidatura y la fecha de publicacion a la oferta', () => {
    const una = candidaturaDesdeRegistro({
      ...base,
      viaEnvio: 'LinkedIn',
      fechaEnvio: '2026-10-05',
      fechaPublicacion: '2026-10-01',
      cv: 'https://docs.google.com/document/d/x',
      carta: 'Dear Hiring Team,\n\nI am...',
    });

    expect(una?.viaEnvio).toBe('LinkedIn');
    expect(una?.fechaEnvio).toBe('2026-10-05');
    expect(una?.cv).toBe('https://docs.google.com/document/d/x');
    expect(una?.carta).toBe('Dear Hiring Team,\n\nI am...');
    expect(una?.oferta.fechaPublicacion).toBe('2026-10-01');
  });

  it('no inventa campos de seguimiento vacios', () => {
    const una = candidaturaDesdeRegistro({ ...base, viaEnvio: '', fechaEnvio: ' ' });

    expect(una).not.toHaveProperty('viaEnvio');
    expect(una).not.toHaveProperty('fechaEnvio');
  });
});
