import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { BienvenidaPage } from './bienvenida.page';

describe('BienvenidaPage', () => {
  async function abrir(): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: '', component: BienvenidaPage }]),
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', BienvenidaPage);
    return harness.routeNativeElement as HTMLElement;
  }

  it('abre con la etiqueta, el titular y la explicacion', async () => {
    const pagina = await abrir();

    expect(pagina.querySelector('[data-etiqueta]')?.textContent?.trim()).toBe('Próximamente');
    expect(pagina.querySelector('h2')?.textContent?.trim()).toBe(
      'Tu próximo trabajo, buscado mientras programas.',
    );
    expect(pagina.querySelector('[data-explicacion]')?.textContent).toContain(
      'Cada mañana te traemos las que encajan contigo',
    );
  });

  it('no repite el h1 del shell y los titulos de tarjeta son h3 bajo el h2', async () => {
    const pagina = await abrir();

    expect(pagina.querySelector('h1')).toBeNull();
    expect(pagina.querySelectorAll('h2')).toHaveLength(1);
    const titulos = [...pagina.querySelectorAll('h3')].map((h) => h.textContent?.trim());
    expect(titulos).toEqual([
      'Busca por ti cada mañana',
      'CV y carta, sin inventar',
      'Tú decides siempre',
      'Preparación de entrevistas',
      '¿Necesitas ponerte al día?',
    ]);
  });

  it('muestra tres tarjetas de beneficio', async () => {
    const pagina = await abrir();

    const tarjetas = pagina.querySelectorAll('[data-beneficio]');

    expect(tarjetas).toHaveLength(3);
    expect(tarjetas[0].textContent).toContain('Tecnoempleo, Adzuna, Remotive, Indeed y LinkedIn');
    expect(tarjetas[1].textContent).toContain('controles en código');
    expect(tarjetas[2].textContent).toContain('nada se envía sin ti');
  });

  it('las dos tarjetas de proximamente llevan la etiqueta visible', async () => {
    const pagina = await abrir();

    const tarjetas = pagina.querySelectorAll('[data-proximamente]');

    expect(tarjetas).toHaveLength(2);
    for (const tarjeta of tarjetas) {
      expect(tarjeta.querySelector('[data-etiqueta-tarjeta]')?.textContent?.trim()).toBe(
        'Próximamente',
      );
    }
    expect(tarjetas[0].textContent).toContain('Preparación de entrevistas');
    expect(tarjetas[1].textContent).toContain('formación para desarrolladores de CookYourWebAI');
  });

  it('avisa de que el acceso es por invitacion', async () => {
    const pagina = await abrir();

    expect(pagina.querySelector('[data-invitacion]')?.textContent?.trim()).toBe(
      'Por ahora el acceso es por invitación y forma parte de CookYourWebAI.',
    );
  });

  it('Unirse a la lista de espera abre el formulario de Tally en una pestana nueva y lo dice', async () => {
    const pagina = await abrir();

    const unirse = pagina.querySelector<HTMLAnchorElement>('a[data-lista-espera]');

    expect(unirse?.textContent).toContain('Únete a la lista de espera');
    expect(unirse?.getAttribute('href')).toBe('https://tally.so/r/n0YDZ0');
    expect(unirse?.getAttribute('target')).toBe('_blank');
    expect(unirse?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(unirse?.querySelector('.solo-lectores')?.textContent?.trim()).toBe(
      '(se abre en una pestaña nueva)',
    );
  });

  it('Ya tienes acceso lleva a la pantalla de entrada', async () => {
    const pagina = await abrir();

    const entrar = pagina.querySelector<HTMLAnchorElement>('a[data-entrar]');

    expect(entrar?.textContent?.trim()).toBe('¿Ya tienes acceso? Entra');
    expect(entrar?.getAttribute('href')).toBe('/entrar');
  });

  it('ya no queda ningun mailto ni formulario', async () => {
    const pagina = await abrir();

    expect(pagina.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(pagina.querySelector('[data-pedir-acceso]')).toBeNull();
    expect(pagina.querySelector('form, input')).toBeNull();
  });
});
