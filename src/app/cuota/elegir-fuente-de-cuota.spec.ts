import { elegirFuenteDeCuota } from './elegir-fuente-de-cuota';
import { FuenteDeCuotaDemo } from './fuente-de-cuota-demo';
import { FuenteDeCuotaHttp } from './fuente-de-cuota-http';

describe('elegirFuenteDeCuota', () => {
  it('sin backend de alta, la demo', () => {
    expect(elegirFuenteDeCuota(false)).toBe(FuenteDeCuotaDemo);
  });

  it('con backend de alta, el adaptador http', () => {
    expect(elegirFuenteDeCuota(true)).toBe(FuenteDeCuotaHttp);
  });
});

describe('FuenteDeCuotaDemo', () => {
  const demo = new FuenteDeCuotaDemo();

  it('no inventa una cuota: no hay nada que mostrar', async () => {
    expect(await demo.actual()).toBeNull();
    expect(await demo.refrescar()).toBeNull();
  });

  it('registrar interes no hace nada ni falla', async () => {
    await expect(demo.registrarInteres({ tipo: 'paquetes' })).resolves.toBeUndefined();
  });
});
