import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { CandidaturasStore } from './candidaturas.store';
import { FuenteDeEncaje } from './encaje';
import { FuenteDeAcciones, FuenteDeAccionesDemo } from './fuente-de-acciones';
import { FuenteDeEncajeDemo } from './fuente-de-encaje-demo';
import { OfertasPage } from './ofertas.page';
import { RepositorioDemo } from './repositorio-demo';
import { RepositorioDeCandidaturas } from './repositorio-de-candidaturas';

/** La ficha abierta al lado de la tabla, sin salir de ella. Orden de la demo: c1, c2, c13... */
describe('Panel lateral de la tabla', () => {
  let harness: RouterTestingHarness;

  async function abrir(ruta: string): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: '', component: OfertasPage }], withComponentInputBinding()),
        CandidaturasStore,
        { provide: RepositorioDeCandidaturas, useClass: RepositorioDemo },
        { provide: FuenteDeAcciones, useClass: FuenteDeAccionesDemo },
        { provide: FuenteDeEncaje, useClass: FuenteDeEncajeDemo },
      ],
    });
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(ruta, OfertasPage);
    await harness.fixture.whenStable();
    return harness.routeNativeElement as HTMLElement;
  }

  async function estable(): Promise<void> {
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  const panel = (pagina: HTMLElement) => pagina.querySelector<HTMLElement>('[data-panel]');
  const boton = (pagina: HTMLElement, nombre: string) =>
    pagina.querySelector<HTMLButtonElement>(`[data-panel] [data-${nombre}]`);

  it('sin ficha en la direccion no hay panel', async () => {
    const pagina = await abrir('/');

    expect(panel(pagina)).toBeNull();
  });

  it('la empresa de cada fila abre su ficha en el panel, sin salir de la tabla', async () => {
    const pagina = await abrir('/');

    const enlace = pagina.querySelector<HTMLAnchorElement>('tbody td.empresa a');

    expect(enlace?.getAttribute('href')).toBe('/?ficha=c1');
  });

  it('con ?ficha enseña esa candidatura al lado de la tabla', async () => {
    const pagina = await abrir('/?ficha=c1');

    expect(panel(pagina)?.textContent).toContain('Northwind Labs');
    expect(panel(pagina)?.textContent).toContain('Senior Frontend Engineer');
    expect(pagina.querySelector('table')).not.toBeNull();
  });

  it('Siguiente pasa a la fila de debajo', async () => {
    const pagina = await abrir('/?ficha=c1');

    boton(pagina, 'siguiente')?.click();
    await estable();

    expect(TestBed.inject(Router).url).toBe('/?ficha=c2');
    expect(panel(pagina)?.textContent).toContain('Marisma');
  });

  it('Anterior vuelve a la fila de encima', async () => {
    const pagina = await abrir('/?ficha=c13');

    boton(pagina, 'anterior')?.click();
    await estable();

    expect(panel(pagina)?.textContent).toContain('Marisma');
  });

  it('en la primera fila no hay anterior a la que ir', async () => {
    const pagina = await abrir('/?ficha=c1');

    expect(boton(pagina, 'anterior')?.disabled).toBe(true);
    expect(boton(pagina, 'siguiente')?.disabled).toBe(false);
  });

  it('Cerrar quita el panel y deja la tabla', async () => {
    const pagina = await abrir('/?ficha=c1');

    boton(pagina, 'cerrar')?.click();
    await estable();

    expect(TestBed.inject(Router).url).toBe('/');
    expect(panel(pagina)).toBeNull();
  });

  it('Escape tambien lo cierra', async () => {
    const pagina = await abrir('/?ficha=c1');

    panel(pagina)?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await estable();

    expect(panel(pagina)).toBeNull();
  });

  it('ofrece abrir la ficha a pantalla completa', async () => {
    const pagina = await abrir('/?ficha=c1');

    const completa = pagina.querySelector('[data-panel] a[href="/panel/candidatura/c1"]');

    expect(completa).not.toBeNull();
  });

  it('un id que no existe no abre nada', async () => {
    const pagina = await abrir('/?ficha=no-existe');

    expect(panel(pagina)).toBeNull();
  });
});
