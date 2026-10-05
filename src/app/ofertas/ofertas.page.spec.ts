import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CandidaturasStore } from './candidaturas.store';
import { OfertasPage } from './ofertas.page';
import { RepositorioDemo } from './repositorio-demo';
import { RepositorioDeCandidaturas } from './repositorio-de-candidaturas';

describe('OfertasPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfertasPage],
      // El store lo provee la ruta en la aplicacion real. Aqui se monta el
      // componente suelto, asi que hay que darselo.
      providers: [
        provideRouter([]),
        CandidaturasStore,
        { provide: RepositorioDeCandidaturas, useClass: RepositorioDemo },
      ],
    }).compileComponents();
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

  it('cada fila lleva a su candidatura', async () => {
    const pagina = await pintar();

    const primer = pagina.querySelector<HTMLAnchorElement>('tbody a[href^="/candidatura/"]');

    expect(primer?.getAttribute('href')).toBe('/candidatura/c1');
    expect(primer?.textContent).toContain('Northwind Labs');
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
  it('muestra las columnas por defecto de la maqueta aprobada', async () => {
    const pagina = await pintar();

    const cabeceras = [...pagina.querySelectorAll('thead th')].map((th) => th.textContent?.replace(/[▲▼]/g, '').trim());

    expect(cabeceras).toEqual([
      'Empresa',
      'Puesto',
      'Estado',
      'Modalidad',
      'Ubicación',
      'Salario',
      'Vía envío',
      'Fecha envío',
      'Publicada',
      'Oferta',
      'CV',
    ]);
  });

  it('las fechas se leen en formato espanol', async () => {
    const pagina = await pintar();

    expect(pagina.querySelector('tbody')?.textContent).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('el estado va en una etiqueta que sabe de que estado es, para darle su color', async () => {
    const pagina = await pintar();

    const etiqueta = pagina.querySelector('tbody .estado');

    expect(etiqueta?.getAttribute('data-estado')).toBe('Pendiente');
  });

  it('el buscador filtra la tabla mientras se escribe', async () => {
    const fixture = TestBed.createComponent(OfertasPage);
    await fixture.whenStable();
    const pagina = fixture.nativeElement as HTMLElement;

    const caja = pagina.querySelector<HTMLInputElement>('input[type="search"]')!;
    caja.value = 'northwind';
    caja.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    const filas = pagina.querySelectorAll('table tbody tr');
    expect(filas).toHaveLength(1);
    expect(filas[0].textContent).toContain('Northwind Labs');
  });

  it('si la busqueda no encuentra nada lo dice, en vez de dejar la tabla vacia', async () => {
    const fixture = TestBed.createComponent(OfertasPage);
    await fixture.whenStable();
    const pagina = fixture.nativeElement as HTMLElement;

    const caja = pagina.querySelector<HTMLInputElement>('input[type="search"]')!;
    caja.value = 'no existe esta empresa';
    caja.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(pagina.querySelector('tbody')?.textContent).toContain('Ninguna oferta coincide');
  });

  it('al pulsar una cabecera ordena por esa columna y lo anuncia con aria-sort', async () => {
    const fixture = TestBed.createComponent(OfertasPage);
    await fixture.whenStable();
    const pagina = fixture.nativeElement as HTMLElement;

    const cabecera = pagina.querySelector<HTMLElement>('th[data-columna="empresa"]')!;
    expect(cabecera.getAttribute('aria-sort')).toBe('none');

    cabecera.querySelector('button')!.click();
    await fixture.whenStable();

    expect(cabecera.getAttribute('aria-sort')).toBe('ascending');
    const primeras = [...pagina.querySelectorAll('tbody tr td:first-child')].map((td) => td.textContent?.trim());
    expect(primeras[0]).toBe('Arbórea');
  });
});

