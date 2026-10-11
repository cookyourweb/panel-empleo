import { POLITICA_DE_PRIVACIDAD_DE_LA_AGENCIA, urlDePrivacidadDeLaLista } from './enlaces-de-marca';

describe('urlDePrivacidadDeLaLista', () => {
  it('mientras no hay seccion de Empleo Tech, la politica base sin ancla', () => {
    expect(POLITICA_DE_PRIVACIDAD_DE_LA_AGENCIA).toBe('https://www.cookyourwebai.es/politicadeprivacidad');
    expect(urlDePrivacidadDeLaLista('')).toBe('https://www.cookyourwebai.es/politicadeprivacidad');
  });

  it('cuando la seccion de Empleo Tech esta publicada, usa esa URL', () => {
    expect(urlDePrivacidadDeLaLista('https://www.cookyourwebai.es/politicadeprivacidad#empleo-tech')).toBe(
      'https://www.cookyourwebai.es/politicadeprivacidad#empleo-tech',
    );
  });
});
