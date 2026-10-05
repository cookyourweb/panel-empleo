import { elegirRepositorio } from './elegir-repositorio';
import { RepositorioDemo } from './repositorio-demo';
import { RepositorioLocal } from './repositorio-local';

describe('elegirRepositorio', () => {
  it('en desarrollo lee los datos locales, que son los reales', () => {
    expect(elegirRepositorio(true)).toBe(RepositorioLocal);
  });

  it('fuera de desarrollo usa siempre la demo: la build publica no lleva datos reales', () => {
    expect(elegirRepositorio(false)).toBe(RepositorioDemo);
  });
});
