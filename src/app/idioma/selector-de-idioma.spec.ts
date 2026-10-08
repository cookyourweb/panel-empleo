import { Component, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { SelectorDeIdioma } from './selector-de-idioma';

@Component({ template: '' })
class PaginaFalsa {}

async function selector(locale: string, url = '/') {
  TestBed.configureTestingModule({
    imports: [SelectorDeIdioma],
    providers: [
      { provide: LOCALE_ID, useValue: locale },
      provideRouter([{ path: '**', component: PaginaFalsa }]),
    ],
  });
  const fixture = TestBed.createComponent(SelectorDeIdioma);
  await TestBed.inject(Router).navigateByUrl(url);
  await fixture.whenStable();
  const enlaces = [...(fixture.nativeElement as HTMLElement).querySelectorAll('a')];
  return { fixture, enlaces, enlace: (codigo: string) => enlaces.find((a) => a.getAttribute('hreflang') === codigo)! };
}

describe('SelectorDeIdioma', () => {
  it('es una navegación con nombre, con un enlace por idioma', async () => {
    const { fixture, enlaces } = await selector('es');

    expect((fixture.nativeElement as HTMLElement).querySelector('nav')?.getAttribute('aria-label')).toBeTruthy();
    expect(enlaces.map((a) => a.textContent?.trim())).toEqual(['Español', 'English']);
  });

  it('cada enlace declara su idioma, para el lector de pantalla y para los buscadores', async () => {
    const { enlace } = await selector('es');

    expect(enlace('es').getAttribute('lang')).toBe('es');
    expect(enlace('en').getAttribute('lang')).toBe('en');
  });

  it('marca el idioma actual con aria-current y solo ese', async () => {
    const es = await selector('es');
    expect(es.enlace('es').getAttribute('aria-current')).toBe('true');
    expect(es.enlace('en').hasAttribute('aria-current')).toBe(false);

    TestBed.resetTestingModule();
    const en = await selector('en');
    expect(en.enlace('en').getAttribute('aria-current')).toBe('true');
    expect(en.enlace('es').hasAttribute('aria-current')).toBe(false);
  });

  it('lleva a la misma pantalla bajo el prefijo del otro idioma', async () => {
    const { enlace } = await selector('es', '/candidatura/c1');

    expect(enlace('es').getAttribute('href')).toBe('/es/candidatura/c1');
    expect(enlace('en').getAttribute('href')).toBe('/en/candidatura/c1');
  });

  it('conserva la ficha abierta y el resto de la dirección', async () => {
    const { enlace } = await selector('en', '/?ficha=c4&q=a#fin');

    expect(enlace('es').getAttribute('href')).toBe('/es/?ficha=c4&q=a#fin');
  });

  it('se actualiza al navegar', async () => {
    const { fixture, enlace } = await selector('es', '/');

    await TestBed.inject(Router).navigateByUrl('/candidatura/c2');
    await fixture.whenStable();

    expect(enlace('en').getAttribute('href')).toBe('/en/candidatura/c2');
  });

  it('un idioma con región sigue marcando el suyo: en-GB es inglés', async () => {
    const { enlace } = await selector('en-GB');

    expect(enlace('en').getAttribute('aria-current')).toBe('true');
  });
});
