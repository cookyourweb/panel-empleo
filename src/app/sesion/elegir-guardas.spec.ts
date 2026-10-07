import { elegirGuardas } from './elegir-guardas';
import { soloConSesion } from './solo-con-sesion';

describe('elegirGuardas', () => {
  it('en desarrollo (datos reales) exige sesion', () => {
    expect(elegirGuardas(true)).toEqual([soloConSesion]);
  });

  it('fuera de desarrollo (demo publica) deja el panel abierto', () => {
    expect(elegirGuardas(false)).toEqual([]);
  });
});
