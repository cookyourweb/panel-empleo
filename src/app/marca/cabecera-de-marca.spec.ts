import { LOCALE_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideRouter, Router } from '@angular/router';

import { ALTA_ACTIVA } from '../configuracion';
import { ProveedorDeIdentidad } from '../sesion/proveedor-de-identidad';
import { Sesion } from '../sesion/sesion';
import { CabeceraDeMarca } from './cabecera-de-marca';
import { raizDeLaPlataforma } from './enlaces-de-marca';

const ENLACES_DE_LA_AGENCIA = [
  ['Automatización', 'https://www.cookyourwebai.es/#automatizacion-empresarial'],
  ['Funnels AI', 'https://www.cookyourwebai.es/#funnels-ia-avanzados'],
  ['Avatares AI', 'https://www.cookyourwebai.es/#ia-influencer-avatares'],
  ['Auditoría Gratis', 'https://www.cookyourwebai.es/#consultoria-transformacion-ia'],
  ['Desarrolladores', 'https://www.cookyourwebai.es/#desarrolladores'],
] as const;

function desplazarA(y: number): void {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  window.dispatchEvent(new Event('scroll'));
}

describe('CabeceraDeMarca', () => {
  let fixture: ComponentFixture<CabeceraDeMarca>;
  let raiz: HTMLElement;

  const cabecera = () => raiz.querySelector('header') as HTMLElement;
  const alternar = () => raiz.querySelector('button.alternar') as HTMLButtonElement;
  const panel = () => raiz.querySelector('#menu-movil') as HTMLElement;

  const sesionActiva = signal(false);
  const cerrar = vi.fn();
  const olvidar = vi.fn();

  async function crear(localeId = 'es', conAlta = true): Promise<void> {
    TestBed.configureTestingModule({
      imports: [CabeceraDeMarca],
      providers: [
        { provide: LOCALE_ID, useValue: localeId },
        { provide: Sesion, useValue: { activa: sesionActiva, cerrar } },
        { provide: ProveedorDeIdentidad, useValue: { olvidar } },
        { provide: ALTA_ACTIVA, useValue: conAlta },
        provideRouter([{ path: 'cuenta', children: [] }]),
      ],
    });
    fixture = TestBed.createComponent(CabeceraDeMarca);
    raiz = fixture.nativeElement as HTMLElement;
    document.body.appendChild(raiz);
    await fixture.whenStable();
  }

  beforeEach(() => {
    sesionActiva.set(false);
    cerrar.mockReset();
    olvidar.mockReset();
    desplazarA(0);
  });

  afterEach(() => {
    raiz?.remove();
    desplazarA(0);
  });

  it('es el banner fijo de la pagina, con el logo como enlace a la agencia', async () => {
    await crear();

    const logo = raiz.querySelector('a.logo__nombre');

    expect(raiz.querySelectorAll('header')).toHaveLength(1);
    expect(logo?.textContent).toBe('cookYourWebAI');
    expect(logo?.getAttribute('href')).toBe('https://www.cookyourwebai.es/');
    expect(raiz.querySelector('.logo__etiqueta')?.textContent).toBe('Agencia AI');
  });

  describe('menu', () => {
    it.each(['nav.menu-escritorio', '#menu-movil nav'])('%s tiene los seis enlaces, en orden y con las URL exactas', async (selector) => {
      await crear();

      const enlaces = [...raiz.querySelectorAll(`${selector} a:not(.cta)`)];

      expect(enlaces.map((a) => [a.textContent?.trim(), a.getAttribute('href')])).toEqual([...ENLACES_DE_LA_AGENCIA, ['Empleo Tech', '/es/']]);
    });

    it.each(['nav.menu-escritorio', '#menu-movil nav'])('%s esta etiquetado como Principal', async (selector) => {
      await crear();

      expect(raiz.querySelector(selector)?.getAttribute('aria-label')).toBe('Principal');
    });

    it.each(['nav.menu-escritorio', '#menu-movil nav'])('%s marca solo Empleo Tech como pagina actual', async (selector) => {
      await crear();

      const actuales = [...raiz.querySelectorAll(`${selector} a[aria-current]`)];

      expect(actuales.map((a) => [a.textContent?.trim(), a.getAttribute('aria-current')])).toEqual([['Empleo Tech', 'page']]);
    });

    it('los enlaces de la agencia son absolutos y no abren pestaña nueva', async () => {
      await crear();

      for (const [, url] of ENLACES_DE_LA_AGENCIA) {
        const enlace = raiz.querySelector(`nav.menu-escritorio a[href="${url}"]`);
        expect(enlace?.getAttribute('target')).toBeNull();
      }
    });
  });

  describe('Empleo Tech y el idioma de la build', () => {
    it.each([
      ['es', '/es/'],
      ['es-ES', '/es/'],
      ['en', '/en/'],
      ['en-GB', '/en/'],
      ['fr', '/es/'],
    ])('con LOCALE_ID %s enlaza a %s', async (locale, ruta) => {
      await crear(locale);

      expect(raiz.querySelector('nav.menu-escritorio a[aria-current="page"]')?.getAttribute('href')).toBe(ruta);
    });

    it('la raiz sale de los idiomas que se sirven, no de una lista propia', () => {
      expect(raizDeLaPlataforma('en-US')).toBe('/en/');
      expect(raizDeLaPlataforma('de')).toBe('/es/');
    });
  });

  describe('scroll', () => {
    it('arriba del todo la cabecera no esta compacta', async () => {
      await crear();

      expect(cabecera().classList.contains('cabecera--desplazada')).toBe(false);
    });

    it('pasados 50 px se compacta, y al volver arriba se descompacta', async () => {
      await crear();

      desplazarA(51);
      await fixture.whenStable();
      expect(cabecera().classList.contains('cabecera--desplazada')).toBe(true);

      desplazarA(50);
      await fixture.whenStable();
      expect(cabecera().classList.contains('cabecera--desplazada')).toBe(false);
    });

    it('si la pagina se recarga ya desplazada, nace compacta', async () => {
      desplazarA(300);
      await crear();

      expect(cabecera().classList.contains('cabecera--desplazada')).toBe(true);
    });

    it('al destruirse deja de escuchar el scroll', async () => {
      await crear();
      const quitar = vi.spyOn(window, 'removeEventListener');

      fixture.destroy();

      expect(quitar).toHaveBeenCalledWith('scroll', expect.any(Function));
    });
  });

  describe('WhatsApp', () => {
    it('es un enlace a wa.me en otra pestaña, seguro y con nombre accesible', async () => {
      await crear();

      const enlace = raiz.querySelector('a.whatsapp') as HTMLAnchorElement;

      expect(enlace.getAttribute('href')).toBe('https://wa.me/34688757782');
      expect(enlace.getAttribute('target')).toBe('_blank');
      expect(enlace.getAttribute('rel')).toBe('noopener noreferrer');
      expect(enlace.getAttribute('aria-label')).toBe('Contactar por WhatsApp');
    });

    it('lleva el tooltip, que no se lee dos veces porque el enlace ya tiene nombre', async () => {
      await crear();

      const ayuda = raiz.querySelector('.whatsapp__ayuda');

      expect(ayuda?.textContent?.trim()).toBe('¡Chatbot AI en vivo!');
      expect(ayuda?.getAttribute('aria-hidden')).toBe('true');
    });

    it('el boton del menu movil lleva al mismo WhatsApp, en otra pestaña', async () => {
      await crear();

      const cta = raiz.querySelector('#menu-movil a.cta') as HTMLAnchorElement;

      expect(cta.textContent?.trim()).toBe('Chatbot AI en Vivo');
      expect(cta.getAttribute('href')).toBe('https://wa.me/34688757782');
      expect(cta.getAttribute('target')).toBe('_blank');
      expect(cta.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  describe('menu movil', () => {
    it('empieza cerrado, con el boton que lo abre y apunta a su panel', async () => {
      await crear();

      expect(alternar().getAttribute('aria-expanded')).toBe('false');
      expect(alternar().getAttribute('aria-label')).toBe('Abrir menú de navegación');
      expect(alternar().getAttribute('aria-controls')).toBe('menu-movil');
      expect(panel().hidden).toBe(true);
    });

    it('se abre y se cierra con el boton, y el nombre del boton lo dice', async () => {
      await crear();

      alternar().click();
      await fixture.whenStable();
      expect(panel().hidden).toBe(false);
      expect(alternar().getAttribute('aria-expanded')).toBe('true');
      expect(alternar().getAttribute('aria-label')).toBe('Cerrar menú de navegación');

      alternar().click();
      await fixture.whenStable();
      expect(panel().hidden).toBe(true);
      expect(alternar().getAttribute('aria-expanded')).toBe('false');
    });

    it('Escape lo cierra y devuelve el foco al boton, esté donde esté el foco', async () => {
      await crear();
      alternar().click();
      await fixture.whenStable();
      (panel().querySelector('a') as HTMLElement).focus();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await fixture.whenStable();

      expect(panel().hidden).toBe(true);
      expect(document.activeElement).toBe(alternar());
    });

    it('Escape con el menu cerrado no le roba el foco a nadie', async () => {
      await crear();
      const otro = document.createElement('input');
      document.body.appendChild(otro);
      otro.focus();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(document.activeElement).toBe(otro);
      otro.remove();
    });

    it.each(['a.enlace-movil', 'a.cta'])('se cierra al activar %s', async (selector) => {
      await crear();
      alternar().click();
      await fixture.whenStable();
      const enlace = panel().querySelector(selector) as HTMLAnchorElement;
      // Sin navegar de verdad: lo que se prueba es que el menu se cierra.
      enlace.addEventListener('click', (evento) => evento.preventDefault());

      enlace.click();
      await fixture.whenStable();

      expect(panel().hidden).toBe(true);
    });

    it('todo se alcanza con teclado: son enlaces y botones nativos, sin tabindex que los saque del orden', async () => {
      await crear();

      const controles = [...raiz.querySelectorAll('a[href], button')];

      expect(controles.length).toBeGreaterThan(10);
      expect(controles.filter((c) => c.hasAttribute('tabindex'))).toEqual([]);
    });

    it('los iconos no se anuncian: cada control tiene su propio nombre', async () => {
      await crear();

      const iconos = [...raiz.querySelectorAll('svg')];

      expect(iconos.length).toBeGreaterThan(0);
      for (const icono of iconos) expect(icono.getAttribute('aria-hidden')).toBe('true');
      expect(alternar().textContent?.trim()).toBe('');
      expect(alternar().getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('Tu cuenta', () => {
    const enlaces = () => [...raiz.querySelectorAll<HTMLAnchorElement>('a[href="/cuenta"]')];

    it('sin sesion no hay enlace a la cuenta', async () => {
      await crear();

      expect(enlaces()).toHaveLength(0);
    });

    it('con sesion pero sin backend de alta tampoco: no hay cuenta que enseñar', async () => {
      sesionActiva.set(true);
      await crear('es', false);

      expect(enlaces()).toHaveLength(0);
    });

    it('con sesion es un enlace con nombre accesible, un icono decorativo y el texto visible', async () => {
      sesionActiva.set(true);
      await crear();

      const enlace = raiz.querySelector('.controles a.cuenta') as HTMLAnchorElement;

      expect(enlace.getAttribute('aria-label')).toBe('Tu cuenta');
      expect(enlace.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
      expect(enlace.querySelector('.cuenta__texto')?.textContent?.trim()).toBe('Tu cuenta');
    });

    it('va antes del boton de WhatsApp, en los controles de la derecha', async () => {
      sesionActiva.set(true);
      await crear();

      const controles = [...raiz.querySelector('.controles')!.children].map((h) => h.className.split(' ')[0]);

      expect(controles).toEqual(['cuenta', 'salir', 'whatsapp', 'alternar']);
    });

    it('el menu movil la trae tras los seis enlaces y antes del Chatbot, y al pulsarla cierra el menu', async () => {
      sesionActiva.set(true);
      await crear();
      alternar().click();
      await fixture.whenStable();

      const hijos = [...raiz.querySelector('.menu-movil__nav')!.children];
      const cuenta = hijos.findIndex((h) => h.getAttribute('href') === '/cuenta');

      expect(cuenta).toBe(6);
      expect(hijos[8].classList.contains('menu-movil__cta')).toBe(true);
      (hijos[cuenta] as HTMLAnchorElement).addEventListener('click', (e) => e.preventDefault());
      (hijos[cuenta] as HTMLAnchorElement).click();
      await fixture.whenStable();
      expect(panel().hidden).toBe(true);
    });
  });

  describe('Cerrar sesion', () => {
    const botones = () => [...raiz.querySelectorAll<HTMLButtonElement>('button.salir, button.enlace-movil--salir')];

    it('sin sesion no hay boton para salir', async () => {
      await crear();

      expect(botones()).toHaveLength(0);
    });

    it('con sesion se puede salir aunque el alta este apagada: la sesion existe en todos los entornos', async () => {
      sesionActiva.set(true);
      await crear('es', false);

      expect(raiz.querySelector('.controles button.salir')).not.toBeNull();
    });

    it('es un boton con nombre accesible, un icono decorativo y el texto visible', async () => {
      sesionActiva.set(true);
      await crear();

      const boton = raiz.querySelector('.controles button.salir') as HTMLButtonElement;

      expect(boton.type).toBe('button');
      expect(boton.getAttribute('aria-label')).toBe('Cerrar sesión');
      expect(boton.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
      expect(boton.querySelector('.salir__texto')?.textContent?.trim()).toBe('Cerrar sesión');
    });

    it('al pulsarlo cierra la sesion, olvida la cuenta de Google y vuelve a la bienvenida', async () => {
      sesionActiva.set(true);
      await crear();
      const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

      (raiz.querySelector('.controles button.salir') as HTMLButtonElement).click();
      await fixture.whenStable();

      expect(cerrar).toHaveBeenCalledTimes(1);
      expect(olvidar).toHaveBeenCalledTimes(1);
      expect(navegar).toHaveBeenCalledWith('/');
    });

    it('el menu movil lo trae tras Tu cuenta, y al pulsarlo sale y cierra el menu', async () => {
      sesionActiva.set(true);
      await crear();
      vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      alternar().click();
      await fixture.whenStable();

      const hijos = [...raiz.querySelector('.menu-movil__nav')!.children];

      expect(hijos[7].classList.contains('enlace-movil--salir')).toBe(true);
      (hijos[7] as HTMLButtonElement).click();
      await fixture.whenStable();
      expect(cerrar).toHaveBeenCalledTimes(1);
      expect(panel().hidden).toBe(true);
    });
  });
});
