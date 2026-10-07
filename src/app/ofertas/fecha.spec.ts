import { formatearFecha } from './fecha';

describe('formatearFecha', () => {
  it('en español, DD/MM/AAAA', () => {
    expect(formatearFecha('2026-10-05', 'es')).toBe('05/10/2026');
  });

  it('en inglés, con el mes en letras: 05/10 se leería de dos maneras', () => {
    expect(formatearFecha('2026-10-05', 'en')).toBe('Oct 5, 2026');
  });

  it('corta la hora si la trae', () => {
    expect(formatearFecha('2026-10-05T23:30:00.000Z', 'es')).toBe('05/10/2026');
  });

  it('no mueve la fecha un día según la zona horaria de quien la abre', () => {
    expect(formatearFecha('2026-01-01', 'es')).toBe('01/01/2026');
    expect(formatearFecha('2026-12-31', 'en')).toBe('Dec 31, 2026');
  });

  it('sin fecha o con una que no lo es, no escribe nada', () => {
    expect(formatearFecha(undefined, 'es')).toBe('');
    expect(formatearFecha('', 'en')).toBe('');
    expect(formatearFecha('ayer', 'en')).toBe('');
  });
});
