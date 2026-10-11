import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { ListaDeEspera, SolicitudDeEspera } from '../espera/lista-de-espera';
import { URL_DE_PRIVACIDAD, UrlDePrivacidad } from '../marca/enlaces-de-marca';
import { BienvenidaPage } from './bienvenida.page';

describe('BienvenidaPage', () => {
  let apuntar: ReturnType<typeof vi.fn<(solicitud: SolicitudDeEspera) => Promise<void>>>;
  let pagina: HTMLElement;

  async function abrir(privacidad: UrlDePrivacidad = ''): Promise<HTMLElement> {
    apuntar = vi.fn<(solicitud: SolicitudDeEspera) => Promise<void>>().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ListaDeEspera, useValue: { apuntar } },
        { provide: URL_DE_PRIVACIDAD, useValue: privacidad },
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

  it('Ya tienes acceso lleva a la pantalla de entrada', async () => {
    const pagina = await abrir();

    const entrar = pagina.querySelector<HTMLAnchorElement>('a[data-entrar]');

    expect(entrar?.textContent?.trim()).toBe('¿Ya tienes acceso? Entra');
    expect(entrar?.getAttribute('href')).toBe('/entrar');
  });

  it('ya no queda ningun mailto ni rastro de tally.so', async () => {
    const pagina = await abrir();

    expect(pagina.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(pagina.querySelector('[data-pedir-acceso]')).toBeNull();
    expect(pagina.innerHTML).not.toContain('tally.so');
    expect(pagina.querySelector('a[href*="tally"]')).toBeNull();
  });

  describe('lista de espera de Empleo Tech', () => {
    const campo = (nombre: string) => pagina.querySelector<HTMLInputElement>(`input[name="${nombre}"]`)!;
    const formulario = () => pagina.querySelector<HTMLFormElement>('form[data-lista-espera]');
    const boton = () => pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!;

    function escribir(entrada: HTMLInputElement, valor: string): void {
      entrada.value = valor;
      entrada.dispatchEvent(new Event('input', { bubbles: true }));
    }

    async function rellenar(aceptar = true): Promise<void> {
      escribir(campo('nombre'), 'Ana');
      escribir(campo('email'), 'ana@ejemplo.test');
      if (aceptar) {
        campo('privacidad').click();
      }
      await TestBed.inject(ApplicationRef).whenStable();
    }

    async function enviar(): Promise<void> {
      formulario()!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await TestBed.inject(ApplicationRef).whenStable();
    }

    beforeEach(async () => {
      pagina = await abrir();
      document.body.appendChild(pagina);
    });

    afterEach(() => pagina.remove());

    it('tiene etiquetas reales, campos obligatorios y la casilla sin marcar', () => {
      for (const [nombre, tipo, autocompletar] of [
        ['nombre', 'text', 'name'],
        ['email', 'email', 'email'],
      ]) {
        const entrada = campo(nombre);
        expect(entrada.type).toBe(tipo);
        expect(entrada.autocomplete).toBe(autocompletar);
        expect(entrada.required).toBe(true);
        expect(entrada.labels?.[0]?.textContent?.trim()).toBe(nombre === 'nombre' ? 'Nombre' : 'Email');
      }
      expect(campo('privacidad').type).toBe('checkbox');
      expect(campo('privacidad').required).toBe(true);
      expect(campo('privacidad').checked).toBe(false);
      expect(pagina.querySelector('input[type="tel"], input[name="telefono"]')).toBeNull();
    });

    it('lleva los textos del propietario tal cual', () => {
      // Without the visually hidden "opens in a new tab" notice, which only screen readers get.
      const visible = campo('privacidad').labels![0].cloneNode(true) as HTMLElement;
      visible.querySelectorAll('.solo-lectores').forEach((oculto) => oculto.remove());
      const etiqueta = visible.textContent?.replace(/\s+/g, ' ').trim();
      expect(etiqueta).toContain('He leído y acepto la política de privacidad.');
      expect(formulario()?.textContent).toContain(
        'Al enviar este formulario aceptas recibir un email de aviso cuando haya una plaza disponible en Empleo Tech.',
      );
      expect(boton().textContent?.trim()).toBe('Unirme a la lista de espera');
    });

    it('sin URL propia de Empleo Tech, enlaza la politica base sin ancla', () => {
      const enlace = campo('privacidad').labels?.[0]?.querySelector('a');

      expect(enlace?.getAttribute('href')).toBe('https://www.cookyourwebai.es/politicadeprivacidad');
      expect(enlace?.getAttribute('target')).toBe('_blank');
      expect(enlace?.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('con URL propia de Empleo Tech, enlaza esa', async () => {
      pagina.remove();
      TestBed.resetTestingModule();
      pagina = await abrir('https://www.cookyourwebai.es/politicadeprivacidad#empleo-tech');

      expect(campo('privacidad').labels?.[0]?.querySelector('a')?.getAttribute('href')).toBe(
        'https://www.cookyourwebai.es/politicadeprivacidad#empleo-tech',
      );
    });

    it('envia el nombre y el email, sin telefono', async () => {
      await rellenar();

      await enviar();

      expect(apuntar).toHaveBeenCalledTimes(1);
      expect(apuntar).toHaveBeenCalledWith({ nombre: 'Ana', email: 'ana@ejemplo.test' });
    });

    it('con respuesta OK muestra el exito en una zona educada, lleva el foco y oculta el formulario', async () => {
      await rellenar();

      await enviar();

      expect(formulario()).toBeNull();
      const exito = pagina.querySelector<HTMLElement>('[data-exito]');
      expect(exito?.textContent?.trim()).toBe('¡Listo! Te avisaremos por email en cuanto haya una plaza disponible.');
      expect(pagina.querySelector('[aria-live="polite"]')?.contains(exito!)).toBe(true);
      expect(document.activeElement).toBe(exito);
      expect(pagina.querySelector('[role="alert"]')).toBeNull();
    });

    it('con respuesta fallida avisa con role alert, conserva los datos y no finge el exito', async () => {
      apuntar.mockRejectedValue(new Error('no guardado'));
      await rellenar();

      await enviar();

      expect(pagina.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
        'No hemos podido registrar tu solicitud. Inténtalo de nuevo en unos minutos o escribe a veronica@cookyourwebai.es.',
      );
      expect(pagina.querySelector('[data-exito]')).toBeNull();
      expect(formulario()).not.toBeNull();
      expect(campo('nombre').value).toBe('Ana');
      expect(campo('email').value).toBe('ana@ejemplo.test');
      expect(campo('privacidad').checked).toBe(true);
      expect(boton().disabled).toBe(false);
    });

    it('sin marcar la casilla de privacidad no se puede enviar', async () => {
      await rellenar(false);

      await enviar();

      expect(apuntar).not.toHaveBeenCalled();
      expect(pagina.querySelector('[data-exito]')).toBeNull();
    });

    it('sin nombre o sin email tampoco se envia', async () => {
      escribir(campo('email'), 'ana@ejemplo.test');
      campo('privacidad').click();
      await enviar();

      expect(apuntar).not.toHaveBeenCalled();
    });

    it('mientras envia, el boton dice Enviando, esta desactivado y con aria-busy, y no envia dos veces', async () => {
      let terminar!: () => void;
      apuntar.mockReturnValue(new Promise<void>((resolver) => (terminar = resolver)));
      await rellenar();

      await enviar();
      await enviar();

      expect(boton().textContent?.trim()).toBe('Enviando…');
      expect(boton().disabled).toBe(true);
      expect(boton().getAttribute('aria-busy')).toBe('true');
      expect(apuntar).toHaveBeenCalledTimes(1);
      terminar();
      await new Promise((resolver) => setTimeout(resolver));
      await TestBed.inject(ApplicationRef).whenStable();
      expect(pagina.querySelector('[data-exito]')).not.toBeNull();
    });
  });
});
