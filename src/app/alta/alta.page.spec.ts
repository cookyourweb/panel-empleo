import { TestBed } from '@angular/core/testing';

import { AltaPage } from './alta.page';
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
});
