import { TestBed } from '@angular/core/testing';

import { AltaPage } from './alta.page';
import { MotivoManual, MOTIVOS_MANUAL, ResultadoExtraccion } from './dominio';
import { ExtractorDeCv } from './extractor-de-cv';
import { RepositorioDePerfil } from './repositorio-de-perfil';

describe('AltaPage', () => {
  const repositorio = { obtener: vi.fn(), guardar: vi.fn(), consentir: vi.fn().mockResolvedValue(undefined) };
  const extractor = { subir: vi.fn().mockResolvedValue(undefined), extraer: vi.fn() };

  beforeEach(() => vi.clearAllMocks());

  async function pintar() {
    TestBed.configureTestingModule({
      providers: [
        { provide: RepositorioDePerfil, useValue: repositorio },
        { provide: ExtractorDeCv, useValue: extractor },
      ],
    });
    const fixture = TestBed.createComponent(AltaPage);
    await fixture.whenStable();
    return { fixture, raiz: fixture.nativeElement as HTMLElement };
  }

  it('abre en el consentimiento', async () => {
    const { raiz } = await pintar();

    expect(raiz.querySelector('app-consentimiento')).not.toBeNull();
    expect(raiz.querySelector('app-subida-de-cv')).toBeNull();
  });

  it('al aceptar pasa a la subida', async () => {
    const { fixture, raiz } = await pintar();

    raiz.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
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
      p.raiz.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
      await p.fixture.whenStable();
      p.raiz.querySelector<HTMLButtonElement>('[data-continuar]')!.click();
      await p.fixture.whenStable();
      return p;
    }

    async function subir(p: Awaited<ReturnType<typeof pintar>>, resultado: ResultadoExtraccion) {
      extractor.extraer.mockResolvedValue(resultado);
      const entrada = p.raiz.querySelector<HTMLInputElement>('input[type="file"]')!;
      Object.defineProperty(entrada, 'files', { value: [new File(['x'], 'cv.pdf')], configurable: true });
      entrada.dispatchEvent(new Event('change'));
      await p.fixture.whenStable();
    }

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
      expect(texto).toContain('No has perdido tu intento');
      expect(texto).toContain('más tarde');
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

    it('mueve el foco al titulo del paso en cada cambio de paso', async () => {
      const p = await pintar();
      p.raiz.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
      await p.fixture.whenStable();
      p.raiz.querySelector<HTMLButtonElement>('[data-continuar]')!.click();
      await p.fixture.whenStable();

      expect(document.activeElement).toBe(p.raiz.querySelector('app-subida-de-cv [data-titulo-de-paso]'));

      await subir(p, PROPUESTA);

      expect(document.activeElement).toBe(p.raiz.querySelector('app-revision-de-campos [data-titulo-de-paso]'));
    });
  });
});
