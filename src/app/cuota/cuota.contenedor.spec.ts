import { TestBed } from '@angular/core/testing';

import { ContenedorDeCuota } from './cuota.contenedor';
import { Cuota } from './cuota';
import { FuenteDeCuota } from './fuente-de-cuota';

const SALDO: Cuota = { usadas: 2.7, limite: 8, seRenueva: '2026-11-01' };
const AGOTADA: Cuota = { usadas: 8, limite: 8, seRenueva: '2026-11-01' };

describe('ContenedorDeCuota', () => {
  const fuente = { actual: vi.fn(), refrescar: vi.fn(), registrarInteres: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    fuente.actual.mockResolvedValue(SALDO);
    fuente.refrescar.mockResolvedValue(SALDO);
    fuente.registrarInteres.mockResolvedValue(undefined);
    TestBed.configureTestingModule({ providers: [{ provide: FuenteDeCuota, useValue: fuente }] });
  });

  async function pintar() {
    const fixture = TestBed.createComponent(ContenedorDeCuota);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    return { fixture, raiz };
  }

  it('muestra el medidor con lo que dice la fuente', async () => {
    const { raiz } = await pintar();

    expect(raiz.querySelector('[data-cuota-restantes]')?.textContent).toContain('Te quedan 5 candidaturas');
  });

  it('sin cuota (dueña, legacy, demo) no pinta nada, pero deja la region viva lista', async () => {
    fuente.actual.mockResolvedValue(null);

    const { raiz } = await pintar();

    expect(raiz.querySelector('[data-cuota-restantes]')).toBeNull();
    expect(raiz.querySelector('[data-cuota-agotada]')).toBeNull();
    expect(raiz.querySelector('[aria-live=polite]')).not.toBeNull();
  });

  it('si la fuente falla, no rompe la pagina: no pinta nada', async () => {
    fuente.actual.mockRejectedValue(new Error('x'));

    const { raiz } = await pintar();

    expect(raiz.querySelector('[data-cuota-restantes]')).toBeNull();
  });

  it('el mensaje de agotada vive dentro de una region educada (aria-live=polite)', async () => {
    fuente.actual.mockResolvedValue(AGOTADA);

    const { raiz } = await pintar();

    const viva = raiz.querySelector('[aria-live=polite]')!;
    expect(viva.querySelector('[data-cuota-agotada]')).not.toBeNull();
  });

  it('al volver a la pestaña (tras aprobar en n8n) refresca la cuota desde /yo', async () => {
    const { fixture, raiz } = await pintar();
    fuente.refrescar.mockResolvedValue({ ...SALDO, usadas: 3.7 });

    document.dispatchEvent(new Event('visibilitychange'));
    await fixture.whenStable();

    expect(fuente.refrescar).toHaveBeenCalledTimes(1);
    expect(raiz.querySelector('[data-cuota-restantes]')?.textContent).toContain('Te quedan 4 candidaturas');
  });

  it('ocultar la pestaña no refresca', async () => {
    const { fixture } = await pintar();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

    document.dispatchEvent(new Event('visibilitychange'));
    await fixture.whenStable();

    expect(fuente.refrescar).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('enviar el interes llama a la fuente y da las gracias', async () => {
    fuente.actual.mockResolvedValue(AGOTADA);
    const { fixture, raiz } = await pintar();
    raiz.querySelector<HTMLElement>('[data-abrir-interes]')!.click();
    await fixture.whenStable();

    raiz.querySelector<HTMLElement>('[data-enviar-interes]')!.click();
    await fixture.whenStable();

    expect(fuente.registrarInteres).toHaveBeenCalledWith({ tipo: 'paquetes' });
    expect(raiz.querySelector('[data-interes-enviado]')?.textContent).toContain('Gracias, te avisaremos.');
  });

  it('si enviar el interes falla, muestra el error y deja reintentar', async () => {
    fuente.actual.mockResolvedValue(AGOTADA);
    fuente.registrarInteres.mockRejectedValue(new Error('500'));
    const { fixture, raiz } = await pintar();
    raiz.querySelector<HTMLElement>('[data-abrir-interes]')!.click();
    await fixture.whenStable();

    raiz.querySelector<HTMLElement>('[data-enviar-interes]')!.click();
    await fixture.whenStable();

    expect(raiz.querySelector('[data-error-interes]')).not.toBeNull();
    expect(raiz.querySelector<HTMLButtonElement>('[data-enviar-interes]')!.disabled).toBe(false);
  });

  it('no envia dos veces mientras una peticion esta en vuelo', async () => {
    fuente.actual.mockResolvedValue(AGOTADA);
    let resolver!: () => void;
    fuente.registrarInteres.mockReturnValue(new Promise<void>((r) => (resolver = r)));
    const { fixture, raiz } = await pintar();
    raiz.querySelector<HTMLElement>('[data-abrir-interes]')!.click();
    await fixture.whenStable();

    raiz.querySelector<HTMLElement>('[data-enviar-interes]')!.click();
    raiz.querySelector<HTMLElement>('[data-enviar-interes]')!.click();
    resolver();
    await fixture.whenStable();

    expect(fuente.registrarInteres).toHaveBeenCalledTimes(1);
  });
});
