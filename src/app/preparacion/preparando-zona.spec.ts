import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Preparacion } from './preparacion';
import { AVISO_DE_ARRANQUE_TRAS_MS, PreparandoZona } from './preparando-zona';

describe('PreparandoZona', () => {
  const visible = signal(false);
  let fixture: ComponentFixture<PreparandoZona>;

  function montar(reducido = false): HTMLElement {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((consulta: string) => ({
        matches: reducido && consulta.includes('prefers-reduced-motion'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: Preparacion, useValue: { visible } }],
    });
    fixture = TestBed.createComponent(PreparandoZona);
    return fixture.nativeElement as HTMLElement;
  }

  // whenStable never settles under fake timers, so change detection is run by hand.
  async function refrescar(): Promise<void> {
    fixture.detectChanges();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    visible.set(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('tiene siempre una region de estado educada, vacia mientras no hay espera', async () => {
    const pagina = montar();
    await refrescar();

    const region = pagina.querySelector('[role="status"]');

    expect(region?.getAttribute('aria-live')).toBe('polite');
    expect(region?.textContent?.trim()).toBe('');
  });

  it('dice que esta preparando la zona cuando hay espera', async () => {
    const pagina = montar();
    visible.set(true);
    await refrescar();

    expect(pagina.querySelector('[role="status"]')?.textContent).toContain('Estamos preparando tu zona…');
  });

  it('solo muestra la segunda linea pasado el retardo', async () => {
    const pagina = montar();
    visible.set(true);
    await refrescar();
    const texto = () => pagina.querySelector('[role="status"]')?.textContent ?? '';

    vi.advanceTimersByTime(AVISO_DE_ARRANQUE_TRAS_MS - 1);
    await refrescar();
    expect(texto()).not.toContain('La primera vez puede tardar unos segundos');

    vi.advanceTimersByTime(1);
    await refrescar();
    expect(texto()).toContain('La primera vez puede tardar unos segundos mientras el servidor se despierta.');
  });

  it('al terminar la espera lo oculta todo, y la siguiente espera empieza sin segunda linea', async () => {
    const pagina = montar();
    visible.set(true);
    await refrescar();
    vi.advanceTimersByTime(AVISO_DE_ARRANQUE_TRAS_MS);
    await refrescar();

    visible.set(false);
    await refrescar();
    expect(pagina.querySelector('[role="status"]')?.textContent?.trim()).toBe('');

    visible.set(true);
    await refrescar();
    expect(pagina.querySelector('[role="status"]')?.textContent).not.toContain('La primera vez');
  });

  it('anima la barra por defecto', async () => {
    const pagina = montar(false);
    visible.set(true);
    await refrescar();

    expect(pagina.querySelector('.preparando')?.classList.contains('preparando--sin-animacion')).toBe(false);
  });

  it('con movimiento reducido marca la barra como quieta', async () => {
    const pagina = montar(true);
    visible.set(true);
    await refrescar();

    expect(pagina.querySelector('.preparando')?.classList.contains('preparando--sin-animacion')).toBe(true);
  });

  it('no roba el foco al aparecer', async () => {
    const pagina = montar();
    document.body.appendChild(pagina);
    const boton = document.createElement('button');
    document.body.appendChild(boton);
    boton.focus();

    visible.set(true);
    await refrescar();

    expect(document.activeElement).toBe(boton);
    expect(pagina.querySelector('[tabindex]')).toBeNull();
    pagina.remove();
    boton.remove();
  });
});
