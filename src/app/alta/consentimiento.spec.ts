import { TestBed } from '@angular/core/testing';

import { URL_DE_PRIVACIDAD, UrlDePrivacidad } from '../marca/enlaces-de-marca';
import { Consentimiento } from './consentimiento';

describe('Consentimiento', () => {
  async function pintar(privacidad?: UrlDePrivacidad) {
    if (privacidad !== undefined) {
      TestBed.configureTestingModule({ providers: [{ provide: URL_DE_PRIVACIDAD, useValue: privacidad }] });
    }
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
      casilla: raiz.querySelector<HTMLInputElement>('#consentimiento-casilla')!,
      mayor: raiz.querySelector<HTMLInputElement>('#consentimiento-mayor')!,
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

  it('dice la verdad completa: Estados Unidos, extraer el perfil una vez y generar CV y cartas cuando ella lo pide', async () => {
    const { raiz } = await pintar();
    const texto = raiz.querySelector('#consentimiento-texto')!.textContent ?? '';

    expect(texto).toContain('Estados Unidos');
    expect(texto).toContain('una vez');
    expect(texto).toContain('CV y cartas de presentación');
    expect(texto).toContain('Cuando lo pidas');
    expect(texto).not.toContain('una sola vez a proveedores externos');
  });

  it('dice que puede borrar el CV o retirar el consentimiento desde Tu cuenta', async () => {
    const { raiz } = await pintar();
    const texto = raiz.textContent ?? '';

    expect(texto).toContain('Tu cuenta');
    expect(texto).toContain('retirar tu consentimiento');
  });

  it('la casilla de consentimiento nombra a los dos proveedores y los dos usos', async () => {
    const { raiz, casilla } = await pintar();
    const etiqueta = raiz.querySelector(`label[for="${casilla.id}"]`)!.textContent!;

    expect(etiqueta).toContain('Anthropic');
    expect(etiqueta).toContain('Groq');
    expect(etiqueta).toContain('generar');
  });

  it('el texto no usa guiones largos ni flechas', async () => {
    const { raiz } = await pintar('https://www.cookyourwebai.es/empleo-tech/privacidad');

    expect(raiz.textContent).not.toMatch(/[—–→]/);
  });

  describe('mayoria de edad', () => {
    it('hay una casilla propia con etiqueta que dice 18 años o mas', async () => {
      const { raiz, mayor } = await pintar();

      expect(mayor).not.toBeNull();
      expect(mayor.type).toBe('checkbox');
      expect(raiz.querySelector(`label[for="${mayor.id}"]`)?.textContent).toContain('18 años o más');
    });

    it('con solo el consentimiento marcado no se puede continuar', async () => {
      const { fixture, casilla, continuar, aceptar } = await pintar();

      casilla.click();
      await fixture.whenStable();

      expect(continuar.disabled).toBe(true);
      continuar.click();
      expect(aceptar).not.toHaveBeenCalled();
    });

    it('con solo la mayoria de edad marcada tampoco', async () => {
      const { fixture, mayor, continuar } = await pintar();

      mayor.click();
      await fixture.whenStable();

      expect(continuar.disabled).toBe(true);
    });

    it('con las dos marcadas se puede continuar, y desmarcar la edad lo vuelve a impedir', async () => {
      const { fixture, casilla, mayor, continuar, aceptar } = await pintar();
      casilla.click();
      mayor.click();
      await fixture.whenStable();

      expect(continuar.disabled).toBe(false);
      continuar.click();
      expect(aceptar).toHaveBeenCalledTimes(1);

      mayor.click();
      await fixture.whenStable();
      expect(continuar.disabled).toBe(true);
    });

    it('rellenar a mano no exige confirmar la edad', async () => {
      const { raiz, aMano } = await pintar();

      raiz.querySelector<HTMLButtonElement>('[data-a-mano]')!.click();

      expect(aMano).toHaveBeenCalledTimes(1);
    });
  });

  describe('enlace a la politica de privacidad', () => {
    it('sin URL configurada no se pinta ningun enlace, y menos uno a cookyourwebai.es', async () => {
      const { raiz } = await pintar();

      expect(raiz.querySelector('[data-privacidad]')).toBeNull();
      expect(raiz.querySelectorAll('a')).toHaveLength(0);
      expect(raiz.querySelector('a[href*="cookyourwebai.es"]')).toBeNull();
    });

    it('con URL configurada enlaza la politica, en pestaña nueva y sin filtrar el origen', async () => {
      const { raiz } = await pintar('https://www.cookyourwebai.es/empleo-tech/privacidad');

      const enlace = raiz.querySelector<HTMLAnchorElement>('a[data-privacidad]')!;
      expect(enlace.getAttribute('href')).toBe('https://www.cookyourwebai.es/empleo-tech/privacidad');
      expect(enlace.textContent?.trim()).toBe('política de privacidad');
      expect(enlace.target).toBe('_blank');
      expect(enlace.rel).toContain('noopener');
    });
  });

  it('sin marcar la casilla el boton esta desactivado y no emite (S5.3)', async () => {
    const { continuar, aceptar } = await pintar();

    expect(continuar.disabled).toBe(true);
    continuar.click();

    expect(aceptar).not.toHaveBeenCalled();
  });

  it('con la casilla marcada el boton emite aceptar', async () => {
    const { fixture, casilla, mayor, continuar, aceptar } = await pintar();

    casilla.click();
    mayor.click();
    await fixture.whenStable();

    expect(continuar.disabled).toBe(false);
    continuar.click();
    expect(aceptar).toHaveBeenCalledTimes(1);
  });

  it('desmarcar la casilla vuelve a desactivar el boton', async () => {
    const { fixture, casilla, mayor, continuar } = await pintar();
    casilla.click();
    mayor.click();
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
