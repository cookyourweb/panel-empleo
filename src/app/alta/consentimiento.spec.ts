import { TestBed } from '@angular/core/testing';

import { Consentimiento } from './consentimiento';

describe('Consentimiento', () => {
  async function pintar() {
    const fixture = TestBed.createComponent(Consentimiento);
    const aceptar = vi.fn();
    const aMano = vi.fn();
    fixture.componentInstance.aceptar.subscribe(aceptar);
    fixture.componentInstance.aMano.subscribe(aMano);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      raiz,
      aceptar,
      aMano,
      casilla: raiz.querySelector<HTMLInputElement>('input[type="checkbox"]')!,
      continuar: raiz.querySelector<HTMLButtonElement>('[data-continuar]')!,
    };
  }

  it('dice que el CV se guarda cifrado y que puede ir a Anthropic y Groq', async () => {
    const { raiz } = await pintar();
    const texto = raiz.textContent ?? '';

    expect(texto).toContain('cifrado');
    expect(texto).toContain('Anthropic');
    expect(texto).toContain('Groq');
  });

  it('sin marcar la casilla el boton esta desactivado y no emite (S5.3)', async () => {
    const { continuar, aceptar } = await pintar();

    expect(continuar.disabled).toBe(true);
    continuar.click();

    expect(aceptar).not.toHaveBeenCalled();
  });

  it('con la casilla marcada el boton emite aceptar', async () => {
    const { fixture, casilla, continuar, aceptar } = await pintar();

    casilla.click();
    await fixture.whenStable();

    expect(continuar.disabled).toBe(false);
    continuar.click();
    expect(aceptar).toHaveBeenCalledTimes(1);
  });

  it('desmarcar la casilla vuelve a desactivar el boton', async () => {
    const { fixture, casilla, continuar } = await pintar();
    casilla.click();
    await fixture.whenStable();

    casilla.click();
    await fixture.whenStable();

    expect(continuar.disabled).toBe(true);
  });

  it('la casilla tiene etiqueta asociada', async () => {
    const { raiz, casilla } = await pintar();

    expect(raiz.querySelector(`label[for="${casilla.id}"]`)).not.toBeNull();
  });

  it('ofrece rellenar a mano sin consentir nada', async () => {
    const { raiz, aMano } = await pintar();

    raiz.querySelector<HTMLButtonElement>('[data-a-mano]')!.click();

    expect(aMano).toHaveBeenCalledTimes(1);
  });

  it('muestra el error cuando el servidor no registro el consentimiento, como alerta', async () => {
    const fixture = TestBed.createComponent(Consentimiento);
    fixture.componentRef.setInput('conError', true);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')).not.toBeNull();
  });
});
