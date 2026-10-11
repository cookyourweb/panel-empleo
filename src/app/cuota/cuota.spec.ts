import {
  agotada,
  COSTE_DE_UN_CV,
  COSTE_DE_UNA_CARTA,
  motivoDeAgotada,
  candidaturasRestantes,
  cuotaDeCuerpo,
  esInteresValido,
  fechaDeRenovacion,
  MAXIMO_DE_ORGANIZACION,
  mensajeDeAgotada,
  textoDeRestantes,
} from './cuota';

const CUOTA = { usadas: 2.7, limite: 8, seRenueva: '2026-11-01', topeAgotado: false };

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

  it('el CV cuesta 0,7 y la carta 0,3: una candidatura entera es 1', () => {
    expect(COSTE_DE_UN_CV).toBe(0.7);
    expect(COSTE_DE_UNA_CARTA).toBe(0.3);
  });

  it('lo esta cuando lo que queda no paga un CV, aunque aun de para una carta', () => {
    expect(agotada({ ...CUOTA, usadas: 7.4 })).toBe(true);
    expect(agotada({ ...CUOTA, usadas: 7.7 })).toBe(true);
  });

  it('no lo esta mientras quede para un CV, sin que el redondeo de decimales lo estropee', () => {
    expect(agotada({ ...CUOTA, usadas: 7.3 })).toBe(false);
    expect(agotada({ ...CUOTA, usadas: 7.1 })).toBe(false);
  });

  it('lo esta si el servidor dice que el tope global se ha agotado, aunque le sobre saldo', () => {
    expect(agotada({ ...CUOTA, topeAgotado: true })).toBe(true);
  });

  it('el motivo es el tope si lo dice el servidor, y si no, su cuota', () => {
    expect(motivoDeAgotada({ ...CUOTA, usadas: 8, topeAgotado: true })).toBe('tope');
    expect(motivoDeAgotada({ ...CUOTA, usadas: 8 })).toBe('cuota');
  });
});

describe('cuotaDeCuerpo', () => {
  it('lee cuota de /yo y pasa a camelCase', () => {
    expect(cuotaDeCuerpo({ cuota: { usadas: 2.7, limite: 8, se_renueva: '2026-11-01' } })).toEqual(CUOTA);
  });

  it('lee tope_agotado, y si falta o no es booleano lo toma como falso', () => {
    const cruda = { usadas: 2.7, limite: 8, se_renueva: '2026-11-01' };

    expect(cuotaDeCuerpo({ cuota: { ...cruda, tope_agotado: true } })?.topeAgotado).toBe(true);
    expect(cuotaDeCuerpo({ cuota: { ...cruda, tope_agotado: false } })?.topeAgotado).toBe(false);
    expect(cuotaDeCuerpo({ cuota: cruda })?.topeAgotado).toBe(false);
    expect(cuotaDeCuerpo({ cuota: { ...cruda, tope_agotado: 'si' } })?.topeAgotado).toBe(false);
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
    const texto = mensajeDeAgotada({ ...CUOTA, usadas: 8 }, 'es');

    expect(texto).toBe('Has usado tus candidaturas de este mes. Se renuevan el 1 de noviembre.');
    expect(texto).not.toMatch(/[—–→]/);
  });

  it('agotada con saldo para una carta: lo dice con honestidad y ofrece renovarse', () => {
    const texto = mensajeDeAgotada({ ...CUOTA, usadas: 7.5 }, 'es');

    expect(texto).toBe(
      'Te queda para una carta, pero no para otro CV este mes. Se renueva el 1 de noviembre.',
    );
    expect(texto).not.toMatch(/[—–→]/);
  });

  it('con 0,3 justos todavia da para una carta; con menos, no', () => {
    expect(mensajeDeAgotada({ ...CUOTA, usadas: 7.7 }, 'es')).toContain('para una carta');
    expect(mensajeDeAgotada({ ...CUOTA, usadas: 7.8 }, 'es')).toBe(
      'Has usado tus candidaturas de este mes. Se renuevan el 1 de noviembre.',
    );
  });

  it('el tope manda sobre la cuota personal, tenga o no saldo', () => {
    expect(mensajeDeAgotada({ ...CUOTA, usadas: 7.5, topeAgotado: true }, 'es')).toContain('para todo el mundo');
  });

  it('agotada por tope: explica que es de todo el mundo', () => {
    const texto = mensajeDeAgotada({ ...CUOTA, usadas: 8, topeAgotado: true }, 'es');

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
