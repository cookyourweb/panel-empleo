import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Sesion } from '../sesion/sesion';
import { CuentaPage } from './cuenta.page';
import { RepositorioDeCuenta } from './repositorio-de-cuenta';

describe('CuentaPage', () => {
  const repositorio = {
    borrar: vi.fn(),
    listarCvs: vi.fn(),
    borrarCv: vi.fn(),
    retirarConsentimiento: vi.fn(),
  };
  const sesion = { cerrar: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    repositorio.borrar.mockResolvedValue(undefined);
    repositorio.listarCvs.mockResolvedValue([]);
    repositorio.borrarCv.mockResolvedValue(undefined);
    repositorio.retirarConsentimiento.mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: RepositorioDeCuenta, useValue: repositorio },
        { provide: Sesion, useValue: sesion },
      ],
    });
  });

  async function pintar() {
    const fixture = TestBed.createComponent(CuentaPage);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    const pulsar = async (selector: string) => {
      raiz.querySelector<HTMLButtonElement>(selector)!.click();
      await fixture.whenStable();
    };
    const teclear = async (selector: string, tecla: string) => {
      raiz.querySelector<HTMLElement>(selector)!.dispatchEvent(new KeyboardEvent('keydown', { key: tecla, bubbles: true }));
      await fixture.whenStable();
    };
    return { fixture, raiz, pulsar, teclear };
  }

  it('explica que se borra: perfil, CV cifrados, consentimientos, avisos de interes e invitacion', async () => {
    const { raiz } = await pintar();

    const texto = raiz.querySelector('[data-borrado-cuenta]')!.textContent ?? '';
    expect(texto).toContain('perfil');
    expect(texto).toContain('CV cifrados');
    expect(texto).toContain('consentimientos');
    expect(texto).toContain('avisos de interés');
    expect(texto).toContain('invitación');
  });

  it('explica tambien lo que queda: registros sin nombre, copias 30 dias y lo que se pide por correo', async () => {
    const { raiz } = await pintar();

    const queda = raiz.querySelector('[data-queda]')!;
    const texto = queda.textContent ?? '';
    expect(texto).toContain('sin tu nombre');
    expect(texto).toContain('30 días');
    expect(texto).toContain('ofertas');
    expect(texto).toContain('documentos generados');
    expect(queda.querySelector('a')?.getAttribute('href')).toBe('mailto:veronica@cookyourwebai.es');
    expect(queda.querySelector('a')?.textContent).toBe('veronica@cookyourwebai.es');
  });

  it('la pagina dice que para volver hace falta pedir una invitacion nueva', async () => {
    const { raiz } = await pintar();

    const volver = raiz.querySelector('[data-borrado-cuenta] [data-volver]');
    expect(volver?.textContent?.trim()).toBe('Si más adelante quieres volver, pídenos una invitación nueva.');
  });

  it('la pantalla de despues de borrar lo repite una sola vez', async () => {
    const { raiz, pulsar } = await pintar();
    await pulsar('[data-borrar]');
    await pulsar('[data-confirmar]');

    const volver = raiz.querySelectorAll('[data-borrada] [data-volver]');
    expect(volver.length).toBe(1);
    expect(volver[0].textContent?.trim()).toBe('Si más adelante quieres volver, pídenos una invitación nueva.');
    expect(raiz.querySelector('[data-borrada]')!.textContent).not.toMatch(/[—–→]/);
  });

  it('ningun texto de la cuenta usa guiones largos ni flechas', async () => {
    const { raiz } = await pintar();

    expect(raiz.textContent).not.toMatch(/[—–→]/);
  });

  it('no borra nada al abrir ni al pedir borrar: hace falta confirmar', async () => {
    const { raiz, pulsar } = await pintar();
    expect(raiz.querySelector('[data-confirmar]')).toBeNull();

    await pulsar('[data-borrar]');

    expect(raiz.querySelector('[data-confirmar]')).not.toBeNull();
    expect(repositorio.borrar).not.toHaveBeenCalled();
  });

  it('cancelar vuelve atras sin borrar', async () => {
    const { raiz, pulsar } = await pintar();
    await pulsar('[data-borrar]');

    await pulsar('[data-cancelar]');

    expect(raiz.querySelector('[data-confirmar]')).toBeNull();
    expect(repositorio.borrar).not.toHaveBeenCalled();
  });

  it('al confirmar borra y enseña que se ha borrado, sin cerrar la sesion todavia', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { raiz, pulsar } = await pintar();
    await pulsar('[data-borrar]');

    await pulsar('[data-confirmar]');

    expect(repositorio.borrar).toHaveBeenCalledTimes(1);
    const borrada = raiz.querySelector('[data-borrada]')!;
    expect(borrada).not.toBeNull();
    expect(borrada.textContent).toContain('perfil');
    expect(borrada.textContent).toContain('CV cifrado');
    expect(borrada.textContent).toContain('consentimientos');
    expect(borrada.textContent).toContain('invitación');
    expect(borrada.querySelector('[data-queda]')!.textContent).toContain('30 días');
    expect(raiz.querySelector('[data-confirmar]')).toBeNull();
    expect(sesion.cerrar).not.toHaveBeenCalled();
    expect(navegar).not.toHaveBeenCalled();
  });

  it('la confirmacion lleva el foco a su titulo', async () => {
    const { raiz, pulsar } = await pintar();
    await pulsar('[data-borrar]');

    await pulsar('[data-confirmar]');

    expect(document.activeElement).toBe(raiz.querySelector('[data-borrada] [data-titulo-de-paso]'));
  });

  it('al continuar cierra la sesion y vuelve al inicio', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { pulsar } = await pintar();
    await pulsar('[data-borrar]');
    await pulsar('[data-confirmar]');

    await pulsar('[data-salir]');

    expect(sesion.cerrar).toHaveBeenCalledTimes(1);
    expect(navegar).toHaveBeenCalledWith('/');
  });

  it('mientras borra, el boton queda ocupado con su texto y no se puede cancelar', async () => {
    repositorio.borrar.mockReturnValue(new Promise<void>(() => undefined));
    const { raiz, pulsar } = await pintar();
    await pulsar('[data-borrar]');

    await pulsar('[data-confirmar]');

    const boton = raiz.querySelector<HTMLButtonElement>('[data-confirmar]')!;
    expect(boton.disabled).toBe(true);
    expect(boton.getAttribute('aria-busy')).toBe('true');
    expect(boton.textContent!.trim()).toBe('Borrando tu cuenta…');
    expect(raiz.querySelector<HTMLButtonElement>('[data-cancelar]')!.disabled).toBe(true);
    expect(raiz.querySelector('[data-borrada]')).toBeNull();
  });

  it('si el servidor falla muestra el error, no cierra la sesion y deja reintentar', async () => {
    repositorio.borrar.mockRejectedValue(new Error('500'));
    const { raiz, pulsar } = await pintar();
    await pulsar('[data-borrar]');

    await pulsar('[data-confirmar]');

    expect(sesion.cerrar).not.toHaveBeenCalled();
    expect(raiz.querySelector('[role="alert"]')).not.toBeNull();
    expect(raiz.querySelector('[data-borrada]')).toBeNull();
    const boton = raiz.querySelector<HTMLButtonElement>('[data-confirmar]')!;
    expect(boton.disabled).toBe(false);
    expect(boton.hasAttribute('aria-busy')).toBe(false);
    expect(boton.textContent!.trim()).toBe('Sí, borrar todo');
  });

  it('mueve el foco al titulo de la confirmacion', async () => {
    const { raiz, pulsar } = await pintar();

    await pulsar('[data-borrar]');

    expect(document.activeElement).toBe(raiz.querySelector('[data-titulo-de-paso]'));
  });

  it('no usa los dialogos del navegador', async () => {
    const confirmar = vi.spyOn(window, 'confirm');
    const { pulsar } = await pintar();

    await pulsar('[data-borrar]');
    await pulsar('[data-confirmar]');

    expect(confirmar).not.toHaveBeenCalled();
  });

  describe('borrar solo el CV', () => {
    const CVS = [
      { idioma: 'es', formato: 'pdf', subidoEn: '2026-10-01T10:00:00+00:00' },
      { idioma: 'en', formato: 'docx', subidoEn: '2026-10-02T10:00:00+00:00' },
    ];

    it('enseña un boton por idioma presente, con el idioma como descripcion', async () => {
      repositorio.listarCvs.mockResolvedValue(CVS);
      const { raiz } = await pintar();

      const botones = [...raiz.querySelectorAll<HTMLButtonElement>('[data-borrar-cv]')];
      expect(botones.map((b) => b.dataset['borrarCv'])).toEqual(['es', 'en']);
      expect(botones[0].textContent!.trim()).toBe('Borrar mi CV');
      const descripcion = raiz.querySelector(`#${botones[0].getAttribute('aria-describedby')}`);
      expect(descripcion?.textContent).toContain('Español');
    });

    it('sin CV guardado lo dice y no ofrece borrar', async () => {
      const { raiz } = await pintar();

      expect(raiz.querySelector('[data-sin-cv]')).not.toBeNull();
      expect(raiz.querySelector('[data-borrar-cv]')).toBeNull();
    });

    it('si no se puede consultar la lista lo dice como alerta y deja reintentar, sin afirmar que no hay CV', async () => {
      repositorio.listarCvs.mockRejectedValueOnce(new Error('500')).mockResolvedValue(CVS);
      const { raiz, pulsar } = await pintar();

      expect(raiz.querySelector('[data-error-cvs]')?.getAttribute('role')).toBe('alert');
      expect(raiz.querySelector('[data-sin-cv]')).toBeNull();

      await pulsar('[data-reintentar-cvs]');

      expect(raiz.querySelector('[data-error-cvs]')).toBeNull();
      expect(raiz.querySelectorAll('[data-borrar-cv]')).toHaveLength(2);
    });

    it('pedir borrar no borra: abre una confirmacion con el foco en su titulo', async () => {
      repositorio.listarCvs.mockResolvedValue(CVS);
      const { raiz, pulsar } = await pintar();

      await pulsar('[data-borrar-cv="es"]');

      const confirmacion = raiz.querySelector('[data-confirmacion-cv]')!;
      expect(confirmacion.getAttribute('role')).toBe('group');
      expect(confirmacion.getAttribute('aria-labelledby')).toBeTruthy();
      expect(confirmacion.textContent).toContain('Español');
      expect(document.activeElement).toBe(confirmacion.querySelector('[data-titulo-confirmacion]'));
      expect(repositorio.borrarCv).not.toHaveBeenCalled();
    });

    it('Cancelar cierra la confirmacion, no borra y devuelve el foco al boton', async () => {
      repositorio.listarCvs.mockResolvedValue(CVS);
      const { raiz, pulsar } = await pintar();
      await pulsar('[data-borrar-cv="es"]');

      await pulsar('[data-cancelar-accion]');

      expect(raiz.querySelector('[data-confirmacion-cv]')).toBeNull();
      expect(repositorio.borrarCv).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(raiz.querySelector('[data-borrar-cv="es"]'));
    });

    it('Escape tambien cancela, para quien usa teclado', async () => {
      repositorio.listarCvs.mockResolvedValue(CVS);
      const { raiz, pulsar, teclear } = await pintar();
      await pulsar('[data-borrar-cv="es"]');

      await teclear('[data-confirmacion-cv]', 'Escape');

      expect(raiz.querySelector('[data-confirmacion-cv]')).toBeNull();
      expect(repositorio.borrarCv).not.toHaveBeenCalled();
    });

    it('al confirmar borra ese idioma, lo quita de la lista y lo anuncia en una region educada', async () => {
      repositorio.listarCvs.mockResolvedValue(CVS);
      const { raiz, pulsar } = await pintar();
      const region = raiz.querySelector('[data-resultado]')!;
      expect(region.getAttribute('role')).toBe('status');
      expect(region.getAttribute('aria-live')).toBe('polite');

      await pulsar('[data-borrar-cv="es"]');
      await pulsar('[data-confirmar-accion]');

      expect(repositorio.borrarCv).toHaveBeenCalledWith('es');
      expect(repositorio.borrarCv).toHaveBeenCalledTimes(1);
      expect([...raiz.querySelectorAll<HTMLElement>('[data-borrar-cv]')].map((b) => b.dataset['borrarCv'])).toEqual(['en']);
      expect(raiz.querySelector('[data-confirmacion-cv]')).toBeNull();
      expect(raiz.querySelector('[data-resultado]')).toBe(region);
      expect(region.textContent).toContain('Hemos borrado tu CV en Español');
    });

    it('al borrar el ultimo CV pasa a "no tienes CV guardado"', async () => {
      repositorio.listarCvs.mockResolvedValue([CVS[0]]);
      const { raiz, pulsar } = await pintar();

      await pulsar('[data-borrar-cv="es"]');
      await pulsar('[data-confirmar-accion]');

      expect(raiz.querySelector('[data-sin-cv]')).not.toBeNull();
    });

    it('mientras borra, el boton queda ocupado y no se puede cancelar', async () => {
      repositorio.listarCvs.mockResolvedValue(CVS);
      repositorio.borrarCv.mockReturnValue(new Promise<void>(() => undefined));
      const { raiz, pulsar } = await pintar();
      await pulsar('[data-borrar-cv="es"]');

      await pulsar('[data-confirmar-accion]');

      const boton = raiz.querySelector<HTMLButtonElement>('[data-confirmar-accion]')!;
      expect(boton.disabled).toBe(true);
      expect(boton.getAttribute('aria-busy')).toBe('true');
      expect(boton.textContent!.trim()).toBe('Borrando…');
      expect(raiz.querySelector<HTMLButtonElement>('[data-cancelar-accion]')!.disabled).toBe(true);
    });

    it('si el servidor falla avisa como alerta, el CV sigue en la lista y se puede reintentar', async () => {
      repositorio.listarCvs.mockResolvedValue(CVS);
      repositorio.borrarCv.mockRejectedValue(new Error('500'));
      const { raiz, pulsar } = await pintar();
      await pulsar('[data-borrar-cv="es"]');

      await pulsar('[data-confirmar-accion]');

      expect(raiz.querySelector('[data-error-accion]')?.getAttribute('role')).toBe('alert');
      expect(raiz.querySelectorAll('[data-borrar-cv]')).toHaveLength(2);
      expect(raiz.querySelector<HTMLButtonElement>('[data-confirmar-accion]')!.disabled).toBe(false);
      expect(raiz.querySelector('[data-resultado]')!.textContent).not.toContain('Hemos borrado');
    });
  });

  describe('retirar consentimientos', () => {
    it('ofrece retirar cada tipo, con un boton nombrado y la finalidad como descripcion', async () => {
      const { raiz } = await pintar();

      for (const tipo of ['almacenar_cv', 'enviar_cv_a_ia']) {
        const boton = raiz.querySelector<HTMLButtonElement>(`[data-retirar="${tipo}"]`)!;
        expect(boton.textContent!.trim()).toBe('Retirar consentimiento');
        expect(raiz.querySelector(`#${boton.getAttribute('aria-describedby')}`)?.textContent).toBeTruthy();
      }
    });

    it('retirar el de guardar el CV avisa de que se borra el CV', async () => {
      const { raiz, pulsar } = await pintar();

      await pulsar('[data-retirar="almacenar_cv"]');

      const confirmacion = raiz.querySelector('[data-confirmacion-consentimiento="almacenar_cv"]')!;
      expect(confirmacion.textContent).toContain('borramos tu CV');
      expect(document.activeElement).toBe(confirmacion.querySelector('[data-titulo-confirmacion]'));
      expect(repositorio.retirarConsentimiento).not.toHaveBeenCalled();
    });

    it('retirar el de la IA avisa de que se deja de usar la IA y el perfil se queda', async () => {
      const { raiz, pulsar } = await pintar();

      await pulsar('[data-retirar="enviar_cv_a_ia"]');

      const texto = raiz.querySelector('[data-confirmacion-consentimiento="enviar_cv_a_ia"]')!.textContent!;
      expect(texto).toContain('dejamos de enviar tu CV');
      expect(texto).toContain('Tu perfil se queda');
    });

    it('al confirmar el de la IA llama al servidor, lo anuncia y refleja el estado sin tocar los CV', async () => {
      repositorio.listarCvs.mockResolvedValue([{ idioma: 'es', formato: 'pdf', subidoEn: 'x' }]);
      const { raiz, pulsar } = await pintar();
      await pulsar('[data-retirar="enviar_cv_a_ia"]');

      await pulsar('[data-confirmar-accion]');

      expect(repositorio.retirarConsentimiento).toHaveBeenCalledWith('enviar_cv_a_ia');
      expect(raiz.querySelector('[data-resultado]')!.textContent).toContain('Has retirado');
      expect(raiz.querySelector('[data-retirar="enviar_cv_a_ia"]')).toBeNull();
      expect(raiz.querySelector('[data-retirado="enviar_cv_a_ia"]')).not.toBeNull();
      expect(raiz.querySelector('[data-retirar="almacenar_cv"]')).not.toBeNull();
      expect(raiz.querySelector('[data-borrar-cv="es"]')).not.toBeNull();
    });

    it('al retirar el de guardar el CV vuelve a consultar la lista: el servidor borro los CV', async () => {
      repositorio.listarCvs
        .mockResolvedValueOnce([{ idioma: 'es', formato: 'pdf', subidoEn: 'x' }])
        .mockResolvedValue([]);
      const { raiz, pulsar } = await pintar();
      expect(raiz.querySelector('[data-borrar-cv="es"]')).not.toBeNull();

      await pulsar('[data-retirar="almacenar_cv"]');
      await pulsar('[data-confirmar-accion]');

      expect(repositorio.retirarConsentimiento).toHaveBeenCalledWith('almacenar_cv');
      expect(repositorio.listarCvs).toHaveBeenCalledTimes(2);
      expect(raiz.querySelector('[data-borrar-cv]')).toBeNull();
      expect(raiz.querySelector('[data-sin-cv]')).not.toBeNull();
      expect(raiz.querySelector('[data-resultado]')!.textContent).toContain('hemos borrado tus CV');
    });

    it('si el servidor falla no se marca como retirado y avisa como alerta', async () => {
      repositorio.retirarConsentimiento.mockRejectedValue(new Error('500'));
      const { raiz, pulsar } = await pintar();
      await pulsar('[data-retirar="almacenar_cv"]');

      await pulsar('[data-confirmar-accion]');

      expect(raiz.querySelector('[data-error-accion]')?.getAttribute('role')).toBe('alert');
      expect(raiz.querySelector('[data-retirado]')).toBeNull();
      expect(raiz.querySelector('[data-retirar="almacenar_cv"]')).not.toBeNull();
    });

    it('Cancelar no retira nada y devuelve el foco', async () => {
      const { raiz, pulsar } = await pintar();
      await pulsar('[data-retirar="enviar_cv_a_ia"]');

      await pulsar('[data-cancelar-accion]');

      expect(repositorio.retirarConsentimiento).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(raiz.querySelector('[data-retirar="enviar_cv_a_ia"]'));
    });

    it('es honesta: dice que retirar uno ya retirado no cambia nada', async () => {
      const { raiz } = await pintar();

      expect(raiz.querySelector('[data-consentimientos]')!.textContent).toContain('no cambia nada');
    });
  });
});
