import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { CandidaturasStore } from './candidaturas.store';
import { DetallePage } from './detalle.page';
import { RepositorioDemo } from './repositorio-demo';
import { RepositorioDeCandidaturas } from './repositorio-de-candidaturas';

describe('DetallePage', () => {
  async function abrir(ruta: string): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'candidatura/:id', component: DetallePage }], withComponentInputBinding()),
        CandidaturasStore,
        { provide: RepositorioDeCandidaturas, useClass: RepositorioDemo },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(ruta, DetallePage);
    await harness.fixture.whenStable();
    return harness.routeNativeElement as HTMLElement;
  }

  it('enseña la empresa y el puesto de la candidatura abierta', async () => {
    const pagina = await abrir('/candidatura/c1');

    expect(pagina.textContent).toContain('Northwind Labs');
    expect(pagina.textContent).toContain('Senior Frontend Engineer');
  });

  it('el enlace a la oferta original se abre fuera, sin perder el panel', async () => {
    const pagina = await abrir('/candidatura/c1');

    const enlace = pagina.querySelector<HTMLAnchorElement>('[data-oferta-original]');

    expect(enlace?.target).toBe('_blank');
    expect(enlace?.rel).toContain('noopener');
  });

  it('un id que no existe no revienta: lo dice y ofrece volver', async () => {
    const pagina = await abrir('/candidatura/no-existe');

    expect(pagina.textContent).toContain('no está');
    expect(pagina.querySelector('a[href="/"]')).not.toBeNull();
  });
});
