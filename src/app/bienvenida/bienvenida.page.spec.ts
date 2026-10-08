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

  it('explica el producto y avisa de que es proximo y por invitacion', async () => {
    const pagina = await abrir();
    const texto = pagina.textContent ?? '';

    expect(pagina.querySelector('h2')).not.toBeNull();
    expect(pagina.querySelector('h1')).toBeNull();
    expect(texto).toContain('Próximamente');
    expect(texto).toContain('invitación');
    expect(texto).toContain('CookYourWebAI');
  });

  it('Pedir acceso es un mailto con el asunto ya escrito y sin formulario', async () => {
    const pagina = await abrir();

    const pedir = pagina.querySelector<HTMLAnchorElement>('a[data-pedir-acceso]');

    expect(pedir?.textContent?.trim()).toBe('Pedir acceso');
    expect(pedir?.getAttribute('href')).toBe(
      'mailto:hello.cookyourweb@gmail.com?subject=Acceso%20al%20panel%20de%20empleo',
    );
    expect(pagina.querySelector('form, input')).toBeNull();
  });

  it('Ya tengo acceso lleva a la pantalla de entrada', async () => {
    const pagina = await abrir();

    const entrar = pagina.querySelector<HTMLAnchorElement>('a[data-entrar]');

    expect(entrar?.textContent?.trim()).toBe('Ya tengo acceso, entrar');
    expect(entrar?.getAttribute('href')).toBe('/entrar');
  });
});
