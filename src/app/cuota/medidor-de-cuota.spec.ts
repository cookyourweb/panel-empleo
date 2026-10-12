import { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MedidorDeCuota } from './medidor-de-cuota';
import { Cuota, Interes } from './cuota';

const CUOTA: Cuota = { usadas: 2.7, limite: 8, seRenueva: '2026-11-01', topeAgotado: false };
const AGOTADA: Cuota = { usadas: 8, limite: 8, seRenueva: '2026-11-01', topeAgotado: false };

describe('MedidorDeCuota', () => {
  async function pintar(entradas: Partial<Record<string, unknown>> = {}) {
    const fixture = TestBed.createComponent(MedidorDeCuota);
    const ref: ComponentRef<MedidorDeCuota> = fixture.componentRef;
    ref.setInput('cuota', CUOTA);
    ref.setInput('idioma', 'es');
    for (const [nombre, valor] of Object.entries(entradas)) ref.setInput(nombre, valor);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    const avisos: Interes[] = [];
    fixture.componentInstance.avisar.subscribe((interes) => avisos.push(interes));
    const poner = async (cambios: Record<string, unknown>) => {
      for (const [nombre, valor] of Object.entries(cambios)) ref.setInput(nombre, valor);
      await fixture.whenStable();
    };
    const pulsar = async (selector: string) => {
      raiz.querySelector<HTMLElement>(selector)!.click();
      await fixture.whenStable();
    };
    return { fixture, raiz, avisos, poner, pulsar };
  }

  it('con saldo, dice cuantas candidaturas quedan y cuando se renueva', async () => {
    const { raiz } = await pintar();

    expect(raiz.querySelector('[data-cuota-restantes]')?.textContent?.trim()).toBe(
      'Te quedan 5 candidaturas este mes · se renueva el 1 de noviembre',
    );
    expect(raiz.querySelector('[data-cuota-agotada]')).toBeNull();
    expect(raiz.querySelector('button')).toBeNull();
  });

  it('agotada por cuota, lo explica con calma', async () => {
    const { raiz } = await pintar({ cuota: AGOTADA });

    expect(raiz.querySelector('[data-cuota-agotada]')?.textContent?.trim()).toBe(
      'Has usado tus candidaturas de este mes. Se renuevan el 1 de noviembre.',
    );
    expect(raiz.querySelector('[data-cuota-restantes]')).toBeNull();
  });

  it('con saldo para una carta pero no para un CV, lo dice y sigue ofreciendo el aviso', async () => {
    const { raiz } = await pintar({ cuota: { ...CUOTA, usadas: 7.5 } });

    expect(raiz.querySelector('[data-cuota-agotada]')?.textContent?.trim()).toBe(
      'Te queda para una carta, pero no para otro CV este mes. Se renueva el 1 de noviembre.',
    );
    expect(raiz.querySelector('[data-cuota-restantes]')).toBeNull();
    expect(raiz.querySelector('[data-abrir-interes]')).not.toBeNull();
  });

  it('con tope global agotado y saldo personal, gana el mensaje del tope', async () => {
    const { raiz } = await pintar({ cuota: { ...CUOTA, topeAgotado: true } });

    expect(raiz.querySelector('[data-cuota-agotada]')?.textContent?.trim()).toContain('para todo el mundo');
    expect(raiz.querySelector('[data-abrir-interes]')).not.toBeNull();
  });

  it('agotada por tope, dice que es de todo el mundo', async () => {
    const { raiz } = await pintar({ cuota: { ...AGOTADA, topeAgotado: true } });

    expect(raiz.querySelector('[data-cuota-agotada]')?.textContent?.trim()).toBe(
      'Este mes se ha agotado el cupo gratuito para todo el mundo. Se renueva el 1 de noviembre.',
    );
  });

  it('ofrece el aviso con un boton que tiene nombre accesible', async () => {
    const { raiz } = await pintar({ cuota: AGOTADA });

    const boton = raiz.querySelector<HTMLButtonElement>('[data-abrir-interes]')!;
    expect(boton.textContent?.trim()).toBe('Avísame si hay paquetes o acceso por mi academia');
    expect(raiz.querySelector('form')).toBeNull();
    expect(boton.getAttribute('aria-expanded')).toBe('false');
  });

  it('el boton abre un formulario con etiquetas: radios dentro de un grupo y organizacion limitada a 120', async () => {
    const { raiz, pulsar } = await pintar({ cuota: AGOTADA });

    await pulsar('[data-abrir-interes]');

    const form = raiz.querySelector('form')!;
    expect(form.querySelector('fieldset legend')?.textContent?.trim()).toBeTruthy();
    const radios = [...form.querySelectorAll<HTMLInputElement>('input[type=radio]')];
    expect(radios.map((r) => r.value)).toEqual(['paquetes', 'academia']);
    for (const radio of radios) {
      expect(form.querySelector(`label[for="${radio.id}"]`)).not.toBeNull();
    }
    const organizacion = form.querySelector<HTMLInputElement>('input[type=text]')!;
    expect(organizacion.maxLength).toBe(120);
    expect(form.querySelector(`label[for="${organizacion.id}"]`)?.textContent).toContain('opcional');
  });

  it('enviar emite el tipo elegido y la organizacion', async () => {
    const { raiz, avisos, pulsar } = await pintar({ cuota: AGOTADA });
    await pulsar('[data-abrir-interes]');

    raiz.querySelector<HTMLInputElement>('input[value=academia]')!.click();
    const campo = raiz.querySelector<HTMLInputElement>('input[type=text]')!;
    campo.value = 'CLE Formacion';
    campo.dispatchEvent(new Event('input'));
    await pulsar('[data-enviar-interes]');

    expect(avisos).toEqual([{ tipo: 'academia', organizacion: 'CLE Formacion' }]);
  });

  it('por defecto el tipo es paquetes y la organizacion en blanco no se manda', async () => {
    const { avisos, pulsar } = await pintar({ cuota: AGOTADA });
    await pulsar('[data-abrir-interes]');

    await pulsar('[data-enviar-interes]');

    expect(avisos).toEqual([{ tipo: 'paquetes' }]);
  });

  it('mientras envia, el boton esta deshabilitado y marcado como ocupado', async () => {
    const { raiz, pulsar, poner } = await pintar({ cuota: AGOTADA });
    await pulsar('[data-abrir-interes]');

    await poner({ enviando: true });

    const enviar = raiz.querySelector<HTMLButtonElement>('[data-enviar-interes]')!;
    expect(enviar.disabled).toBe(true);
    expect(enviar.getAttribute('aria-busy')).toBe('true');
  });

  it('si falla, avisa con role=alert y deja reintentar sin perder lo escrito', async () => {
    const { raiz, pulsar, poner } = await pintar({ cuota: AGOTADA });
    await pulsar('[data-abrir-interes]');

    await poner({ fallo: true });

    const error = raiz.querySelector('[data-error-interes]')!;
    expect(error.getAttribute('role')).toBe('alert');
    expect(raiz.querySelector<HTMLButtonElement>('[data-enviar-interes]')!.disabled).toBe(false);
  });

  it('al enviarse, da las gracias y esconde el formulario', async () => {
    const { raiz, pulsar, poner } = await pintar({ cuota: AGOTADA });
    await pulsar('[data-abrir-interes]');

    await poner({ enviado: true });

    expect(raiz.querySelector('[data-interes-enviado]')?.textContent?.trim()).toBe('Gracias, te avisaremos.');
    expect(raiz.querySelector('form')).toBeNull();
    expect(raiz.querySelector('[data-abrir-interes]')).toBeNull();
  });
});
