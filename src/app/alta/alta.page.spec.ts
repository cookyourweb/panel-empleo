import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AltaPage } from './alta.page';
import { MotivoManual, MOTIVOS_MANUAL, ResultadoExtraccion, SubidaRechazada } from './dominio';
import { ExtractorDeCv } from './extractor-de-cv';
import { Sesion } from '../sesion/sesion';
import { RepositorioDePerfil } from './repositorio-de-perfil';

describe('AltaPage', () => {
  const repositorio = { obtener: vi.fn(), guardar: vi.fn(), consentir: vi.fn().mockResolvedValue(undefined) };
  const extractor = { subir: vi.fn().mockResolvedValue(undefined), extraer: vi.fn() };

  beforeEach(() => vi.clearAllMocks());

  async function pintar() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: RepositorioDePerfil, useValue: repositorio },
        { provide: ExtractorDeCv, useValue: extractor },
        { provide: Sesion, useValue: { perfilGuardado: vi.fn(), consentimientosDados: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(AltaPage);
    await fixture.whenStable();
    return { fixture, raiz: fixture.nativeElement as HTMLElement };
  }

  it('tiene exactamente un h1, Tu perfil, y los pasos cuelgan como h2', async () => {
    const { raiz } = await pintar();

    expect(raiz.querySelectorAll('h1')).toHaveLength(1);
    expect(raiz.querySelector('h1')?.textContent?.trim()).toBe('Tu perfil');
    expect(raiz.querySelectorAll('h2').length).toBeGreaterThan(0);
  });

  it('abre en el consentimiento', async () => {
    const { raiz } = await pintar();

    expect(raiz.querySelector('app-consentimiento')).not.toBeNull();
    expect(raiz.querySelector('app-subida-de-cv')).toBeNull();
  });

  it('al aceptar pasa a la subida', async () => {
    const { fixture, raiz } = await pintar();

    raiz.querySelectorAll<HTMLInputElement>('input[type=\"checkbox\"]').forEach((c) => c.click());
    await fixture.whenStable();
    raiz.querySelector<HTMLButtonElement>('[data-continuar]')!.click();
    await fixture.whenStable();

    expect(raiz.querySelector('app-subida-de-cv')).not.toBeNull();
    expect(raiz.querySelector('app-consentimiento')).toBeNull();
  });

  it('rellenar a mano deja el paso manual sin consentir nada', async () => {
    const { fixture, raiz } = await pintar();

    raiz.querySelector<HTMLButtonElement>('[data-a-mano]')!.click();
    await fixture.whenStable();

    expect(repositorio.consentir).not.toHaveBeenCalled();
    expect(raiz.querySelector('app-consentimiento')).toBeNull();
  });

  it('tiene una region de estado siempre presente para anunciar la lectura del CV', async () => {
    const { raiz } = await pintar();

    expect(raiz.querySelector('[role="status"]')).not.toBeNull();
  });

  describe('revision, manual y hecho', () => {
    async function hastaLaSubida() {
      const p = await pintar();
      p.raiz.querySelectorAll<HTMLInputElement>('input[type=\"checkbox\"]').forEach((c) => c.click());
      await p.fixture.whenStable();
      p.raiz.querySelector<HTMLButtonElement>('[data-continuar]')!.click();
      await p.fixture.whenStable();
      return p;
    }

    async function elegirArchivo(p: Awaited<ReturnType<typeof pintar>>) {
      const entrada = p.raiz.querySelector<HTMLInputElement>('input[type="file"]')!;
      Object.defineProperty(entrada, 'files', { value: [new File(['x'], 'cv.pdf')], configurable: true });
      entrada.dispatchEvent(new Event('change'));
      await p.fixture.whenStable();
    }

    async function subir(p: Awaited<ReturnType<typeof pintar>>, resultado: ResultadoExtraccion) {
      extractor.extraer.mockResolvedValue(resultado);
      await elegirArchivo(p);
    }

    const estado = (p: Awaited<ReturnType<typeof pintar>>) => p.raiz.querySelector('[role="status"]')!.textContent!.trim();

    async function rellenarYGuardar(p: Awaited<ReturnType<typeof pintar>>) {
      const escribir = async (nombre: string, valor: string) => {
        const entrada = p.raiz.querySelector<HTMLInputElement>(`[data-campo="${nombre}"]`)!;
        entrada.value = valor;
        entrada.dispatchEvent(new Event('input'));
        entrada.dispatchEvent(new Event('change'));
        await p.fixture.whenStable();
      };
      await escribir('rol', 'Dev');
      await escribir('aniosExperiencia', '5');
      await escribir('stack', 'Angular');
      await escribir('ubicacion', 'Madrid');
      await escribir('salarioMin', '30000');
      await escribir('salarioMoneda', 'EUR');
      p.raiz.querySelector<HTMLInputElement>('[data-modalidad="remoto"]')!.click();
      await p.fixture.whenStable();
      p.raiz.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
      await p.fixture.whenStable();
    }

    const PROPUESTA: ResultadoExtraccion = {
      estado: 'propuesta',
      propuestas: [{ campo: 'rol', valor: 'Dev', cita: 'Developer' }],
    };

    it('con propuestas muestra la revision, sin guardar nada todavia', async () => {
      const p = await hastaLaSubida();

      await subir(p, PROPUESTA);

      expect(p.raiz.querySelector('app-revision-de-campos')).not.toBeNull();
      expect(repositorio.guardar).not.toHaveBeenCalled();
    });

    it.each(MOTIVOS_MANUAL.map((motivo) => [motivo]))(
      'S5.5: motivo %s lleva al formulario manual con su mensaje',
      async (motivo: MotivoManual) => {
        const p = await hastaLaSubida();

        await subir(p, { estado: 'manual', motivo });

        expect(p.raiz.querySelector('app-formulario-manual')).not.toBeNull();
        expect(p.raiz.querySelector(`[data-motivo="${motivo}"]`)?.textContent?.trim()).not.toBe('');
      },
    );

    it('los mensajes de cada motivo son distintos entre si', async () => {
      const textos = new Set<string>();
      for (const motivo of MOTIVOS_MANUAL) {
        TestBed.resetTestingModule();
        const p = await hastaLaSubida();
        await subir(p, { estado: 'manual', motivo });
        textos.add(p.raiz.querySelector(`[data-motivo="${motivo}"]`)!.textContent!.trim());
      }

      expect(textos.size).toBe(MOTIVOS_MANUAL.length);
    });

    it('si falla el proveedor, dice que no ha perdido su intento y que puede reintentar', async () => {
      const p = await hastaLaSubida();

      await subir(p, { estado: 'manual', motivo: 'proveedor' });

      const texto = p.raiz.querySelector('[data-motivo="proveedor"]')!.textContent!;
      expect(texto).toContain('no has perdido tu intento');
      expect(texto).toContain('más tarde');
    });

    describe('subir el CV y leerlo son dos hechos distintos', () => {
      it.each(MOTIVOS_MANUAL.map((motivo) => [motivo]))(
        'motivo %s: el mensaje empieza diciendo que el CV esta guardado y nunca sugiere que se perdio',
        async (motivo: MotivoManual) => {
          const p = await hastaLaSubida();

          await subir(p, { estado: 'manual', motivo });

          const texto = p.raiz.querySelector(`[data-motivo="${motivo}"]`)!.textContent!.trim();
          expect(texto.startsWith('Tu CV está guardado')).toBe(true);
          expect(texto).not.toMatch(/no hemos podido (guardar|subir)|has perdido tu CV|no se ha guardado/i);
          expect(texto).toContain('a mano');
        },
      );

      it('indisponible: dice que no se puede leer automaticamente, que se rellene a mano y que son unos minutos', async () => {
        const p = await hastaLaSubida();

        await subir(p, { estado: 'manual', motivo: 'indisponible' });

        expect(p.raiz.querySelector('[data-motivo="indisponible"]')!.textContent!.trim()).toBe(
          'Tu CV está guardado. Ahora mismo no podemos leerlo automáticamente, así que rellena tu perfil a mano; solo te llevará unos minutos.',
        );
      });

      it('rellenar a mano por eleccion (sin subir nada) no dice que haya un CV guardado', async () => {
        const p = await pintar();

        p.raiz.querySelector<HTMLButtonElement>('[data-a-mano]')!.click();
        await p.fixture.whenStable();

        expect(p.raiz.textContent).not.toContain('Tu CV está guardado');
      });

      it('mientras sube, lo dice y todavia no afirma que este guardado', async () => {
        const p = await hastaLaSubida();
        extractor.subir.mockReturnValueOnce(new Promise<void>(() => undefined));

        await elegirArchivo(p);

        expect(estado(p)).toBe('Subiendo tu CV…');
      });

      it('mientras sube, enseña el nombre del archivo elegido', async () => {
        const p = await hastaLaSubida();
        extractor.subir.mockReturnValueOnce(new Promise<void>(() => undefined));

        await elegirArchivo(p);

        expect(p.raiz.querySelector('[data-archivo]')?.textContent).toContain('cv.pdf');
      });

      it('al terminar la subida confirma que esta guardado (cifrado) mientras lo lee', async () => {
        const p = await hastaLaSubida();
        extractor.extraer.mockReturnValueOnce(new Promise<ResultadoExtraccion>(() => undefined));

        await elegirArchivo(p);

        expect(estado(p)).toContain('Tu CV está guardado (cifrado).');
        expect(estado(p)).toContain('lo estamos leyendo');
      });

      it('con propuestas, la revision confirma que el CV esta guardado', async () => {
        const p = await hastaLaSubida();

        await subir(p, PROPUESTA);

        expect(p.raiz.querySelector('app-revision-de-campos [data-cv-guardado]')?.textContent?.trim()).toBe(
          'Tu CV está guardado (cifrado).',
        );
      });

      it('si la subida se rechaza no dice que este guardado', async () => {
        const p = await hastaLaSubida();
        extractor.subir.mockRejectedValueOnce(new SubidaRechazada('tipo'));

        await elegirArchivo(p);

        expect(p.raiz.textContent).not.toContain('Tu CV está guardado');
        expect(p.raiz.querySelector('app-subida-de-cv')).not.toBeNull();
      });
    });

    it('rellenar a mano por eleccion no dice que algo haya fallado', async () => {
      const p = await pintar();

      p.raiz.querySelector<HTMLButtonElement>('[data-a-mano]')!.click();
      await p.fixture.whenStable();

      expect(p.raiz.querySelector('app-formulario-manual')).not.toBeNull();
      expect(p.raiz.querySelector('[data-motivo]')).toBeNull();
      expect(p.raiz.querySelector('[data-motivo-elegido]')).not.toBeNull();
    });

    it('REQ-5.5: guarda solo al confirmar y pasa a hecho', async () => {
      repositorio.guardar.mockResolvedValue(undefined);
      const p = await hastaLaSubida();
      await subir(p, { estado: 'manual', motivo: 'desactivada' });
      expect(repositorio.guardar).not.toHaveBeenCalled();

      await rellenarYGuardar(p);

      expect(repositorio.guardar).toHaveBeenCalledTimes(1);
      expect(p.raiz.querySelector('[data-hecho]')).not.toBeNull();
      expect(p.raiz.querySelector('app-formulario-manual')).toBeNull();
    });

    it('si guardar falla, muestra el error y conserva el formulario', async () => {
      repositorio.guardar.mockRejectedValue(new Error('500'));
      const p = await hastaLaSubida();
      await subir(p, { estado: 'manual', motivo: 'proveedor' });

      await rellenarYGuardar(p);

      expect(p.raiz.querySelector('[data-error-de-guardado]')).not.toBeNull();
      expect(p.raiz.querySelector<HTMLInputElement>('[data-campo="rol"]')!.value).toBe('Dev');
    });

    describe('indicador de pasos y siguiente paso', () => {
      const indicador = (p: Awaited<ReturnType<typeof pintar>>) =>
        p.raiz.querySelector('[data-paso-actual]')!.textContent!.trim();
      const siguiente = (p: Awaited<ReturnType<typeof pintar>>) =>
        p.raiz.querySelector('[data-siguiente]')?.textContent?.trim() ?? '';

      it('en el consentimiento es el paso 1 de 4 y explica lo que viene', async () => {
        const p = await pintar();

        expect(indicador(p)).toBe('Paso 1 de 4: Antes de empezar');
        expect(siguiente(p)).not.toBe('');
        expect(p.raiz.querySelector('[aria-current="step"]')!.textContent).toContain('Antes de empezar');
      });

      it('en la subida es el paso 2 de 4', async () => {
        const p = await hastaLaSubida();

        expect(indicador(p)).toBe('Paso 2 de 4: Sube tu CV');
        expect(siguiente(p)).toContain('cifrado');
      });

      it('mientras sube y lee sigue siendo el paso 2', async () => {
        const p = await hastaLaSubida();
        extractor.subir.mockReturnValueOnce(new Promise<void>(() => undefined));

        await elegirArchivo(p);

        expect(indicador(p)).toBe('Paso 2 de 4: Sube tu CV');
        expect(siguiente(p)).not.toBe('');
      });

      it('en la revision y en el formulario manual es el paso 3 de 4', async () => {
        const p = await hastaLaSubida();
        await subir(p, PROPUESTA);
        expect(indicador(p)).toBe('Paso 3 de 4: Completa tu perfil');
        expect(siguiente(p)).toContain('Guardar mi perfil');

        TestBed.resetTestingModule();
        const m = await pintar();
        m.raiz.querySelector<HTMLButtonElement>('[data-a-mano]')!.click();
        await m.fixture.whenStable();
        expect(indicador(m)).toBe('Paso 3 de 4: Completa tu perfil');
        expect(siguiente(m)).toContain('Guardar mi perfil');
      });

      it('al guardar es el paso 4 de 4', async () => {
        repositorio.guardar.mockResolvedValue(undefined);
        const p = await pintar();
        p.raiz.querySelector<HTMLButtonElement>('[data-a-mano]')!.click();
        await p.fixture.whenStable();

        await rellenarYGuardar(p);

        expect(indicador(p)).toBe('Paso 4 de 4: Listo');
        expect(siguiente(p)).not.toBe('');
      });
    });

    describe('resumen final', () => {
      const resumen = (p: Awaited<ReturnType<typeof pintar>>) => p.raiz.querySelector('[data-hecho]')!;

      it('tras subir el CV y consentir resume perfil, CV cifrado y consentimientos', async () => {
        repositorio.guardar.mockResolvedValue(undefined);
        const p = await hastaLaSubida();
        await subir(p, { estado: 'manual', motivo: 'indisponible' });

        await rellenarYGuardar(p);

        expect(resumen(p).querySelector('[data-resumen-perfil]')).not.toBeNull();
        expect(resumen(p).querySelector('[data-resumen-cv]')!.textContent).toContain('cifrado');
        expect(resumen(p).querySelector('[data-resumen-consentimientos]')).not.toBeNull();
        expect(resumen(p).querySelector('[data-resumen-consentimientos]')!.textContent).toContain('generar');
      });

      it('si se relleno a mano sin CV ni consentimientos, solo resume el perfil', async () => {
        repositorio.guardar.mockResolvedValue(undefined);
        const p = await pintar();
        p.raiz.querySelector<HTMLButtonElement>('[data-a-mano]')!.click();
        await p.fixture.whenStable();

        await rellenarYGuardar(p);

        expect(resumen(p).querySelector('[data-resumen-perfil]')).not.toBeNull();
        expect(resumen(p).querySelector('[data-resumen-cv]')).toBeNull();
        expect(resumen(p).querySelector('[data-resumen-consentimientos]')).toBeNull();
      });

      it('explica como borrarlo, con un enlace a /cuenta, y ofrece ir al panel', async () => {
        repositorio.guardar.mockResolvedValue(undefined);
        const p = await pintar();
        p.raiz.querySelector<HTMLButtonElement>('[data-a-mano]')!.click();
        await p.fixture.whenStable();

        await rellenarYGuardar(p);

        expect(resumen(p).querySelector('a[href="/cuenta"]')).not.toBeNull();
        expect(resumen(p).querySelector('a[href="/panel"]')).not.toBeNull();
        expect(resumen(p).textContent).toContain('borrar');
      });

      it('el titulo del resumen recibe el foco al llegar', async () => {
        repositorio.guardar.mockResolvedValue(undefined);
        const p = await pintar();
        p.raiz.querySelector<HTMLButtonElement>('[data-a-mano]')!.click();
        await p.fixture.whenStable();

        await rellenarYGuardar(p);

        expect(document.activeElement).toBe(resumen(p).querySelector('[data-titulo-de-paso]'));
      });
    });

    describe('estado ocupado mientras hay una peticion en vuelo', () => {
      it('al continuar, el boton queda deshabilitado, con aria-busy y el texto de lo que hace', async () => {
        repositorio.consentir.mockReturnValueOnce(new Promise<void>(() => undefined));
        const p = await pintar();
        p.raiz.querySelectorAll<HTMLInputElement>('input[type=\"checkbox\"]').forEach((c) => c.click());
        await p.fixture.whenStable();

        p.raiz.querySelector<HTMLButtonElement>('[data-continuar]')!.click();
        await p.fixture.whenStable();

        const boton = p.raiz.querySelector<HTMLButtonElement>('[data-continuar]')!;
        expect(boton.disabled).toBe(true);
        expect(boton.getAttribute('aria-busy')).toBe('true');
        expect(boton.textContent!.trim()).toBe('Registrando tu consentimiento…');
        expect(p.raiz.querySelector('[role="status"]')!.textContent).toContain('Registrando tu consentimiento…');
      });

      it('si el consentimiento falla, el boton vuelve a estar disponible', async () => {
        repositorio.consentir.mockRejectedValueOnce(new Error('500'));
        const p = await pintar();
        p.raiz.querySelectorAll<HTMLInputElement>('input[type=\"checkbox\"]').forEach((c) => c.click());
        await p.fixture.whenStable();

        p.raiz.querySelector<HTMLButtonElement>('[data-continuar]')!.click();
        await vi.waitFor(() => expect(p.raiz.querySelector('[role="alert"]')).not.toBeNull());

        const boton = p.raiz.querySelector<HTMLButtonElement>('[data-continuar]')!;
        expect(boton.disabled).toBe(false);
        expect(boton.hasAttribute('aria-busy')).toBe(false);
        expect(boton.textContent!.trim()).toBe('Continuar');
      });

      it('al guardar, el boton queda ocupado y un segundo envio no repite la peticion', async () => {
        repositorio.guardar.mockReturnValueOnce(new Promise<void>(() => undefined));
        const p = await pintar();
        p.raiz.querySelector<HTMLButtonElement>('[data-a-mano]')!.click();
        await p.fixture.whenStable();

        await rellenarYGuardar(p);
        p.raiz.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
        await p.fixture.whenStable();

        const boton = p.raiz.querySelector<HTMLButtonElement>('[data-guardar]')!;
        expect(boton.disabled).toBe(true);
        expect(boton.getAttribute('aria-busy')).toBe('true');
        expect(boton.textContent!.trim()).toBe('Guardando tu perfil…');
        expect(p.raiz.querySelector('[role="status"]')!.textContent).toContain('Guardando tu perfil…');
        expect(repositorio.guardar).toHaveBeenCalledTimes(1);
      });

      it('si guardar falla, el boton se libera para reintentar', async () => {
        repositorio.guardar.mockRejectedValueOnce(new Error('500'));
        const p = await pintar();
        p.raiz.querySelector<HTMLButtonElement>('[data-a-mano]')!.click();
        await p.fixture.whenStable();

        await rellenarYGuardar(p);
        await vi.waitFor(() => expect(p.raiz.querySelector('[data-error-de-guardado]')).not.toBeNull());

        const boton = p.raiz.querySelector<HTMLButtonElement>('[data-guardar]')!;
        expect(boton.disabled).toBe(false);
        expect(boton.hasAttribute('aria-busy')).toBe(false);
        expect(boton.textContent!.trim()).toBe('Guardar mi perfil');
      });
    });

    it('mueve el foco al titulo del paso en cada cambio de paso', async () => {
      const p = await pintar();
      p.raiz.querySelectorAll<HTMLInputElement>('input[type=\"checkbox\"]').forEach((c) => c.click());
      await p.fixture.whenStable();
      p.raiz.querySelector<HTMLButtonElement>('[data-continuar]')!.click();
      await p.fixture.whenStable();

      expect(document.activeElement).toBe(p.raiz.querySelector('app-subida-de-cv [data-titulo-de-paso]'));

      await subir(p, PROPUESTA);

      expect(document.activeElement).toBe(p.raiz.querySelector('app-revision-de-campos [data-titulo-de-paso]'));
    });
  });
});
