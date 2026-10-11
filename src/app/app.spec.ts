import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { App } from './app';
import { ALTA_ACTIVA } from './configuracion';
import { Sesion } from './sesion/sesion';

@Component({ template: 'pagina' })
class PaginaFalsa {}

let liberarGuarda: () => void = () => undefined;
const guardaLenta = () => new Promise<boolean>((resolver) => (liberarGuarda = () => resolver(true)));

describe('App', () => {
  const activa = signal(false);
  const consentimientos = signal<{ almacenarCv: boolean; enviarCvAIa: boolean } | null>(null);
  const perfil = signal<{ tienePerfil: boolean } | null>(null);

  beforeEach(async () => {
    activa.set(false);
    consentimientos.set(null);
    perfil.set(null);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: Sesion, useValue: { activa, consentimientos, perfil } },
        { provide: ALTA_ACTIVA, useValue: false },
        provideRouter([
          { path: 'a', component: PaginaFalsa },
          { path: 'b', component: PaginaFalsa },
          { path: 'lenta', component: PaginaFalsa, canActivate: [guardaLenta] },
        ]),
      ],
    }).compileComponents();
  });

  it('ofrece un enlace de salto que lleva al contenido principal', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const pagina = fixture.nativeElement as HTMLElement;

    const salto = pagina.querySelector('a[href="#main-content"]');

    expect(salto?.textContent).toContain('Saltar al contenido principal');
  });

  it('ofrece en la barra de la app el cambio de idioma, con el idioma actual marcado', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const cabecera = (fixture.nativeElement as HTMLElement).querySelector('.barra-app');

    const enlaces = [...(cabecera?.querySelectorAll('nav a[hreflang]') ?? [])];

    expect(enlaces.map((a) => a.getAttribute('hreflang'))).toEqual(['es', 'en']);
    expect(cabecera?.querySelectorAll('a[aria-current="true"]')).toHaveLength(1);
  });

  it('tiene un unico landmark main, y es el que alcanza el enlace de salto', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const pagina = fixture.nativeElement as HTMLElement;

    const mains = pagina.querySelectorAll('main');

    expect(mains).toHaveLength(1);
    expect(mains[0].id).toBe('main-content');
  });

  it('el enlace de salto es lo primero que enfoca el teclado, antes que la cabecera de marca', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const pagina = fixture.nativeElement as HTMLElement;

    const primero = pagina.querySelector('a, button');

    expect(primero?.getAttribute('href')).toBe('#main-content');
    expect(pagina.querySelectorAll('app-cabecera-de-marca, app-pie-de-marca')).toHaveLength(2);
  });

  it('solo la cabecera de marca es el banner de la pagina, y solo el pie de marca su contentinfo', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const pagina = fixture.nativeElement as HTMLElement;

    expect(pagina.querySelectorAll('header')).toHaveLength(1);
    expect(pagina.querySelectorAll('footer')).toHaveLength(1);
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

  it('con sesion pero sin backend de alta, la barra de la app no ofrece la cuenta', async () => {
    activa.set(true);
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/cuenta"]')).toBeNull();
  });

  it('con sesion y backend de alta, la barra de la app enlaza a la cuenta', async () => {
    TestBed.overrideProvider(ALTA_ACTIVA, { useValue: true });
    activa.set(true);
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const cabecera = (fixture.nativeElement as HTMLElement).querySelector('.barra-app');

    const enlace = cabecera?.querySelector('a[href="/cuenta"]');

    expect(enlace?.textContent?.trim()).toBe('Tu cuenta');
  });

  describe('aviso de consentimiento', () => {
    async function pintar() {
      TestBed.overrideProvider(ALTA_ACTIVA, { useValue: true });
      activa.set(true);
      const fixture = TestBed.createComponent(App);
      await fixture.whenStable();
      return fixture.nativeElement as HTMLElement;
    }

    it('con perfil y sin consentimiento de guardar el CV, avisa con amabilidad y enlaza a Tu cuenta', async () => {
      perfil.set({ tienePerfil: true });
      consentimientos.set({ almacenarCv: false, enviarCvAIa: true });
      const pagina = await pintar();

      const aviso = pagina.querySelector('[data-aviso-consentimiento]')!;
      expect(aviso.textContent).toContain('consentimiento');
      expect(aviso.querySelector('a')?.getAttribute('href')).toBe('/cuenta');
      expect(aviso.textContent).not.toMatch(/[—–→]/);
    });

    it('si el estado es desconocido nunca avisa', async () => {
      perfil.set({ tienePerfil: true });
      const pagina = await pintar();

      expect(pagina.querySelector('[data-aviso-consentimiento]')).toBeNull();
    });

    it('con el consentimiento vigente no avisa', async () => {
      perfil.set({ tienePerfil: true });
      consentimientos.set({ almacenarCv: true, enviarCvAIa: false });
      const pagina = await pintar();

      expect(pagina.querySelector('[data-aviso-consentimiento]')).toBeNull();
    });

    it('sin perfil no avisa: ese camino es el del alta', async () => {
      perfil.set({ tienePerfil: false });
      consentimientos.set({ almacenarCv: false, enviarCvAIa: false });
      const pagina = await pintar();

      expect(pagina.querySelector('[data-aviso-consentimiento]')).toBeNull();
    });

    it('sin backend de alta no avisa', async () => {
      perfil.set({ tienePerfil: true });
      consentimientos.set({ almacenarCv: false, enviarCvAIa: false });
      activa.set(true);
      const fixture = TestBed.createComponent(App);
      await fixture.whenStable();

      expect((fixture.nativeElement as HTMLElement).querySelector('[data-aviso-consentimiento]')).toBeNull();
    });
  });

  it('sin sesion, la barra de la app no ofrece la cuenta', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/cuenta"]')).toBeNull();
  });

  it('muestra el aviso de preparar la zona mientras una guarda espera y lo quita al decidir', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const pagina = fixture.nativeElement as HTMLElement;
    const router = TestBed.inject(Router);
    const estado = () => pagina.querySelector('[role="status"]')?.textContent ?? '';
    expect(estado().trim()).toBe('');

    void router.navigateByUrl('/lenta');
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(estado()).toContain('Estamos preparando tu zona…');
    });

    liberarGuarda();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(estado().trim()).toBe('');
    });
  });
});
