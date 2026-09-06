import { TestBed } from '@angular/core/testing';

import { OfertasPage } from './ofertas.page';

describe('OfertasPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [OfertasPage] }).compileComponents();
  });

  async function pintar(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(OfertasPage);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('lista las ofertas en una tabla con cabeceras de columna', async () => {
    const pagina = await pintar();

    expect(pagina.querySelectorAll('table thead th').length).toBeGreaterThan(0);
    expect(pagina.querySelectorAll('table tbody tr').length).toBeGreaterThan(0);
  });

  it('ofrece un filtro por cada estado, con su recuento', async () => {
    const pagina = await pintar();

    const filtros = [...pagina.querySelectorAll('[data-filtro]')];

    expect(filtros.length).toBe(9);
    expect(filtros[0].textContent).toContain('Todas');
    expect(filtros[0].textContent).toContain('12');
  });

  it('al elegir un estado solo quedan sus ofertas', async () => {
    const fixture = TestBed.createComponent(OfertasPage);
    await fixture.whenStable();
    const pagina = fixture.nativeElement as HTMLElement;

    pagina.querySelector<HTMLButtonElement>('[data-filtro="Caducada"]')?.click();
    await fixture.whenStable();

    const filas = pagina.querySelectorAll('table tbody tr');
    expect(filas).toHaveLength(2);
    expect(pagina.querySelector('[data-filtro="Caducada"]')?.getAttribute('aria-pressed')).toBe('true');
  });
});
