import {
  CAMPOS,
  esCampo,
  MODALIDADES_DE_PERFIL,
  MOTIVOS_MANUAL,
  SubidaRechazada,
  TIPOS_DE_CONSENTIMIENTO,
  VERSION_DE_CONSENTIMIENTO,
} from './dominio';

describe('dominio del alta', () => {
  it('los campos extraibles no incluyen salario ni modalidad (REQ-4.6, REQ-5.3)', () => {
    expect([...CAMPOS]).toEqual(['rol', 'aniosExperiencia', 'stack', 'idiomas', 'ubicacion']);
  });

  it('esCampo reconoce los campos y rechaza lo demas', () => {
    expect(esCampo('stack')).toBe(true);
    expect(esCampo('salarioMin')).toBe(false);
    expect(esCampo(42)).toBe(false);
    expect(esCampo(undefined)).toBe(false);
  });

  it('las modalidades del perfil son las del servidor', () => {
    expect([...MODALIDADES_DE_PERFIL]).toEqual(['remoto', 'hibrido', 'presencial']);
  });

  it('el consentimiento tiene dos tipos y una version fija', () => {
    expect(TIPOS_DE_CONSENTIMIENTO).toEqual({ almacenarCv: 'almacenar_cv', enviarCvAIa: 'enviar_cv_a_ia' });
    expect(VERSION_DE_CONSENTIMIENTO).toBe('v1');
  });

  it('los motivos para ir al formulario manual cubren el servidor y la caida', () => {
    expect([...MOTIVOS_MANUAL]).toEqual(['desactivada', 'ya_usada', 'tope', 'proveedor', 'indisponible']);
  });

  it('SubidaRechazada lleva el motivo y es un Error', () => {
    const error = new SubidaRechazada('tamano');

    expect(error).toBeInstanceOf(Error);
    expect(error.motivo).toBe('tamano');
  });
});
