import { TestBed } from '@angular/core/testing';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
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
});
