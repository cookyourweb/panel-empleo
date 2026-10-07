import { elegirConfiguracion } from './configuracion';

describe('elegirConfiguracion', () => {
  it('en desarrollo apunta al servidor local', () => {
    expect(elegirConfiguracion(true).urlApi).toBe('http://localhost:5000');
  });

  it('fuera de desarrollo apunta al servidor publicado', () => {
    expect(elegirConfiguracion(false).urlApi).toBe('https://cv-server-ggd8.onrender.com');
  });

  it('usa el mismo id de cliente de Google en los dos modos', () => {
    expect(elegirConfiguracion(true).idCliente).toBe(elegirConfiguracion(false).idCliente);
    expect(elegirConfiguracion(false).idCliente).toMatch(/\.apps\.googleusercontent\.com$/);
  });
});
