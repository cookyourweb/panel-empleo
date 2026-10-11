import {
  agotada,
  candidaturasRestantes,
  cuotaDeCuerpo,
  esInteresValido,
  fechaDeRenovacion,
  MAXIMO_DE_ORGANIZACION,
  mensajeDeAgotada,
  textoDeRestantes,
} from './cuota';

const CUOTA = { usadas: 2.7, limite: 8, seRenueva: '2026-11-01' };

describe('candidaturasRestantes', () => {
  it.each([
    [2.7, 5],
    [0, 8],
    [7, 1],
    [7.3, 0],
    [8, 0],
    [9.1, 0],
    [4.1, 3],
    [2.9, 5],
  ])('con %s usadas de 8 quedan %s candidaturas enteras', (usadas, esperadas) => {
    expect(candidaturasRestantes({ ...CUOTA, usadas })).toBe(esperadas);
  });
});

describe('agotada', () => {
  it('lo esta cuando lo usado alcanza o pasa el limite', () => {
    expect(agotada({ ...CUOTA, usadas: 8 })).toBe(true);
    expect(agotada({ ...CUOTA, usadas: 8.4 })).toBe(true);
  });

  it('no lo esta mientras quede algo, aunque no llegue a una candidatura entera', () => {
    expect(agotada({ ...CUOTA, usadas: 7.7 })).toBe(false);
  });
});

describe('cuotaDeCuerpo', () => {
  it('lee cuota de /yo y pasa a camelCase', () => {
    expect(cuotaDeCuerpo({ cuota: { usadas: 2.7, limite: 8, se_renueva: '2026-11-01' } })).toEqual(CUOTA);
  });

  it.each([
    [{}],
    [{ cuota: null }],
    [{ cuota: 'x' }],
    [{ cuota: { usadas: '2', limite: 8, se_renueva: '2026-11-01' } }],
    [{ cuota: { usadas: 2, limite: 0, se_renueva: '2026-11-01' } }],
    [{ cuota: { usadas: -1, limite: 8, se_renueva: '2026-11-01' } }],
    [{ cuota: { usadas: 2, limite: 8, se_renueva: 'pronto' } }],
    [{ cuota: { usadas: 2, limite: 8 } }],
    [null],
    ['texto'],
  ])('un cuerpo sin cuota valida (%j) no da cuota', (cuerpo) => {
    expect(cuotaDeCuerpo(cuerpo)).toBeNull();
  });
});

describe('fechaDeRenovacion', () => {
  it('en español dice "1 de noviembre"', () => {
    expect(fechaDeRenovacion('2026-11-01', 'es')).toBe('1 de noviembre');
  });

  it('en ingles dice "November 1"', () => {
    expect(fechaDeRenovacion('2026-11-01', 'en')).toBe('November 1');
  });

  it('no se mueve de dia por la zona horaria de quien mira', () => {
    expect(fechaDeRenovacion('2027-01-01', 'es')).toBe('1 de enero');
  });

  it('una fecha rara no da nada', () => {
    expect(fechaDeRenovacion('pronto', 'es')).toBe('');
  });
});

describe('textos', () => {
  it('el medidor dice cuantas quedan y cuando se renueva', () => {
    expect(textoDeRestantes(CUOTA, 'es')).toBe('Te quedan 5 candidaturas este mes · se renueva el 1 de noviembre');
  });

  it('con una sola, en singular', () => {
    expect(textoDeRestantes({ ...CUOTA, usadas: 7 }, 'es')).toBe(
      'Te queda 1 candidatura este mes · se renueva el 1 de noviembre',
    );
  });

  it('con cero enteras pero algo de saldo, sigue en plural', () => {
    expect(textoDeRestantes({ ...CUOTA, usadas: 7.5 }, 'es')).toBe(
      'Te quedan 0 candidaturas este mes · se renueva el 1 de noviembre',
    );
  });

  it('agotada por cuota: lo dice sin rodeos y sin guiones largos ni flechas', () => {
    const texto = mensajeDeAgotada('cuota', '2026-11-01', 'es');

    expect(texto).toBe('Has usado tus candidaturas de este mes. Se renuevan el 1 de noviembre.');
    expect(texto).not.toMatch(/[—–→]/);
  });

  it('agotada por tope: explica que es de todo el mundo', () => {
    const texto = mensajeDeAgotada('tope', '2026-11-01', 'es');

    expect(texto).toBe('Este mes se ha agotado el cupo gratuito para todo el mundo. Se renueva el 1 de noviembre.');
    expect(texto).not.toMatch(/[—–→]/);
  });
});

describe('esInteresValido', () => {
  it('acepta paquetes y academia, con o sin organizacion', () => {
    expect(esInteresValido({ tipo: 'paquetes' })).toBe(true);
    expect(esInteresValido({ tipo: 'academia', organizacion: 'CLE' })).toBe(true);
  });

  it('rechaza un tipo desconocido y una organizacion de mas de 120 caracteres', () => {
    expect(esInteresValido({ tipo: 'otro' as never })).toBe(false);
    expect(esInteresValido({ tipo: 'academia', organizacion: 'a'.repeat(MAXIMO_DE_ORGANIZACION + 1) })).toBe(false);
    expect(esInteresValido({ tipo: 'academia', organizacion: 'a'.repeat(MAXIMO_DE_ORGANIZACION) })).toBe(true);
  });
});
