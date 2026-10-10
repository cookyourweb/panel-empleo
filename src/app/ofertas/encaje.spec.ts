import { Encaje, sinDatosParaEvaluar, totalDeRequisitos } from './encaje';

const BASE: Encaje = { cubiertos: [], huecos: [], noEvaluables: [], alcanzable: false, cobertura: 0 };

describe('sinDatosParaEvaluar', () => {
  it('sin requisitos tecnicos reconocidos no hay nada que evaluar', () => {
    expect(sinDatosParaEvaluar({ ...BASE, noEvaluables: ['excelente comunicacion'] })).toBe(true);
  });

  it('con algun cubierto o algun hueco si hay datos', () => {
    expect(sinDatosParaEvaluar({ ...BASE, cubiertos: [{ requisito: 'Angular', evidencia: 'x' }] })).toBe(false);
    expect(sinDatosParaEvaluar({ ...BASE, huecos: [{ requisito: 'Rust', eliminatorio: false }] })).toBe(false);
  });
});

describe('totalDeRequisitos', () => {
  it('suma los cubiertos y los huecos, no los que no se pueden evaluar', () => {
    const encaje: Encaje = {
      ...BASE,
      cubiertos: [{ requisito: 'Angular', evidencia: 'x' }],
      huecos: [{ requisito: 'Rust', eliminatorio: false }],
      noEvaluables: ['a', 'b'],
    };

    expect(totalDeRequisitos(encaje)).toBe(2);
  });
});
