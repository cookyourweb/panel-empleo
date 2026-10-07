import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { App } from './app';

@Component({ template: 'pagina' })
class PaginaFalsa {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'a', component: PaginaFalsa },
          { path: 'b', component: PaginaFalsa },
        ]),
      ],
    }).compileComponents();
  });

  it('ofrece un enlace de salto que lleva al contenido principal', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const pagina = fixture.nativeElement as HTMLElement;

    const salto = pagina.querySelector('a[href="#contenido"]');

    expect(salto?.textContent).toContain('Saltar al contenido principal');
  });

  it('tiene un unico landmark main, y es el que alcanza el enlace de salto', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const pagina = fixture.nativeElement as HTMLElement;

    const mains = pagina.querySelectorAll('main');

    expect(mains).toHaveLength(1);
    expect(mains[0].id).toBe('contenido');
  });

  it('tras navegar lleva el foco al main, pero no en la carga inicial', async () => {
    const fixture = TestBed.createComponent(App);
    document.body.appendChild(fixture.nativeElement);
    const router = TestBed.inject(Router);
    const main = (fixture.nativeElement as HTMLElement).querySelector('main') as HTMLElement;

    await router.navigateByUrl('/a');
    await fixture.whenStable();
    expect(document.activeElement).not.toBe(main);

    await router.navigateByUrl('/b');
    await fixture.whenStable();
    expect(document.activeElement).toBe(main);

    (fixture.nativeElement as HTMLElement).remove();
  });
});
