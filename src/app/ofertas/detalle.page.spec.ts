import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { EnlacesDeAccion } from './acciones';
import { CandidaturasStore } from './candidaturas.store';
import { DetallePage } from './detalle.page';
import { FuenteDeAcciones } from './fuente-de-acciones';
import { RepositorioDemo } from './repositorio-demo';
import { RepositorioDeCandidaturas } from './repositorio-de-candidaturas';

describe('DetallePage', () => {
  const ENLACES: EnlacesDeAccion = {
    aprobar: 'https://n8n.test/aprobar?id=',
    descartar: 'https://n8n.test/descartar?id=',
    enviarEmpresa: 'https://n8n.test/enviar?id=',
  };

  async function abrir(ruta: string, enlaces: EnlacesDeAccion | null = null): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'candidatura/:id', component: DetallePage }], withComponentInputBinding()),
        CandidaturasStore,
        { provide: RepositorioDeCandidaturas, useClass: RepositorioDemo },
        { provide: FuenteDeAcciones, useValue: { enlaces: async () => enlaces } },
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

  it('el CV que se genero se abre fuera, como en Notion', async () => {
    const pagina = await abrir('/candidatura/c13');

    const cv = pagina.querySelector<HTMLAnchorElement>('[data-cv]');

    expect(cv?.href).toBe('https://ejemplo.test/cv/lumen-grid');
    expect(cv?.target).toBe('_blank');
    expect(cv?.rel).toContain('noopener');
  });

  it('enseña la carta respetando sus saltos de linea', async () => {
    const pagina = await abrir('/candidatura/c13');

    const carta = pagina.querySelector('[data-carta]');

    expect(carta?.textContent).toContain('Dear Lumen Grid team,');
    expect(carta?.textContent).toContain('\n');
  });

  it('enseña por donde y cuando salio, con la fecha como se lee en Espana', async () => {
    const pagina = await abrir('/candidatura/c5');

    expect(pagina.textContent).toContain('Email directo');
    expect(pagina.textContent).toContain('01/10/2026');
  });

  it('sin CV ni carta no pinta esos apartados vacios', async () => {
    const pagina = await abrir('/candidatura/c2');

    expect(pagina.querySelector('[data-cv]')).toBeNull();
    expect(pagina.querySelector('[data-carta]')).toBeNull();
  });

  it('ofrece las mismas acciones que la tabla cuando hay enlaces', async () => {
    const pagina = await abrir('/candidatura/c13', ENLACES);

    const accion = pagina.querySelector<HTMLAnchorElement>('[data-accion="enviarEmpresa"]');

    expect(accion?.href).toBe('https://n8n.test/enviar?id=c13');
    expect(accion?.target).toBe('_blank');
  });

  it('en la demo publica no hay acciones', async () => {
    const pagina = await abrir('/candidatura/c13');

    expect(pagina.querySelector('[data-accion]')).toBeNull();
  });
});
