import { TestBed } from '@angular/core/testing';

import { MotivoDeSubida } from './dominio';
import { SubidaDeCv } from './subida-de-cv';

describe('SubidaDeCv', () => {
  async function pintar(rechazo: MotivoDeSubida | null = null) {
    const fixture = TestBed.createComponent(SubidaDeCv);
    fixture.componentRef.setInput('rechazo', rechazo);
    const elegido = vi.fn();
    const aMano = vi.fn();
    fixture.componentInstance.elegido.subscribe(elegido);
    fixture.componentInstance.aMano.subscribe(aMano);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    return { fixture, raiz, elegido, aMano, entrada: raiz.querySelector<HTMLInputElement>('input[type="file"]')! };
  }

  function elegir(entrada: HTMLInputElement, archivos: File[]): void {
    Object.defineProperty(entrada, 'files', { value: archivos, configurable: true });
    entrada.dispatchEvent(new Event('change'));
  }

  it('acepta PDF y DOCX y lo dice como pista, sin impedir nada', async () => {
    const { raiz, entrada } = await pintar();

    expect(entrada.accept).toContain('.pdf');
    expect(entrada.accept).toContain('.docx');
    expect(raiz.textContent).toContain('2 MB');
  });

  it('el campo tiene etiqueta asociada', async () => {
    const { raiz, entrada } = await pintar();

    expect(raiz.querySelector(`label[for="${entrada.id}"]`)).not.toBeNull();
  });

  it('emite el archivo elegido sin filtrarlo: el servidor decide', async () => {
    const { entrada, elegido } = await pintar();
    const archivo = new File(['x'], 'cv.exe');

    elegir(entrada, [archivo]);

    expect(elegido).toHaveBeenCalledWith(archivo);
  });

  it('sin archivo no emite', async () => {
    const { entrada, elegido } = await pintar();

    elegir(entrada, []);

    expect(elegido).not.toHaveBeenCalled();
  });

  it('sin rechazo no hay alerta', async () => {
    const { raiz } = await pintar();

    expect(raiz.querySelector('[role="alert"]')).toBeNull();
  });

  it.each<[MotivoDeSubida, string]>([
    ['tamano', 'demasiado grande'],
    ['tipo', 'PDF o DOCX'],
    ['ilegible', 'leer'],
    ['sinConsentimiento', 'consentimiento'],
    ['servidor', 'servidor'],
  ])('un rechazo %s se explica en una alerta y el formulario sigue usable (S5.7)', async (motivo, trozo) => {
    const { raiz, entrada } = await pintar(motivo);

    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain(trozo);
    expect(entrada.disabled).toBe(false);
  });

  it('ofrece rellenar a mano', async () => {
    const { raiz, aMano } = await pintar();

    raiz.querySelector<HTMLButtonElement>('[data-a-mano]')!.click();

    expect(aMano).toHaveBeenCalledTimes(1);
  });
});
