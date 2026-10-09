import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EnlacesDeAccion } from './acciones';
import { CandidaturasStore } from './candidaturas.store';
import { Candidatura } from './dominio';
import { FuenteDeEncaje } from './encaje';
import { FuenteDeAcciones, FuenteDeAccionesDemo } from './fuente-de-acciones';
import { FuenteDeEncajeDemo } from './fuente-de-encaje-demo';
import { OfertasPage } from './ofertas.page';
import { RepositorioDemo } from './repositorio-demo';
import { RepositorioDeCandidaturas } from './repositorio-de-candidaturas';

describe('OfertasPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [OfertasPage],
      // El store lo provee la ruta en la aplicacion real. Aqui se monta el
      // componente suelto, asi que hay que darselo.
      providers: [
        provideRouter([]),
        CandidaturasStore,
        { provide: RepositorioDeCandidaturas, useClass: RepositorioDemo },
        { provide: FuenteDeAcciones, useClass: FuenteDeAccionesDemo },
        { provide: FuenteDeEncaje, useClass: FuenteDeEncajeDemo },
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

    expect(filtros.length).toBe(10);
    expect(filtros[0].textContent).toContain('Todas');
    expect(filtros[0].textContent).toContain('13');
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

  it('en la demo publica no hay botones de accion', async () => {
    const pagina = await pintar();

    expect(pagina.querySelector('[data-accion]')).toBeNull();
  });

  it('con enlaces, una pendiente se puede aprobar o descartar desde la tabla', async () => {
    const enlaces: EnlacesDeAccion = {
      aprobar: 'https://n8n.test/webhook/A?id=',
      descartar: 'https://n8n.test/webhook/D?id=',
      enviarEmpresa: 'https://n8n.test/webhook/E?id=',
    };
    TestBed.overrideProvider(FuenteDeAcciones, { useValue: { enlaces: async () => enlaces } });
    const pagina = await pintar();

    const fila = [...pagina.querySelectorAll('tbody tr')].find((tr) => tr.textContent?.includes('Northwind Labs'))!;
    const aprobar = fila.querySelector<HTMLAnchorElement>('[data-accion="aprobar"]');

    expect(aprobar?.getAttribute('href')).toBe('https://n8n.test/webhook/A?id=c1');
    expect(aprobar?.getAttribute('target')).toBe('_blank');
    expect(fila.querySelector('[data-accion="descartar"]')).not.toBeNull();

    const conCv = [...pagina.querySelectorAll('tbody tr')].find((tr) => tr.textContent?.includes('Lumen Grid'))!;
    expect(conCv.querySelector('[data-accion="enviarEmpresa"]')?.textContent).toContain('Enviar a empresa');
  });

  describe('selector de columnas', () => {
    async function abrirSelector(): Promise<{ pagina: HTMLElement; fixture: ReturnType<typeof TestBed.createComponent<OfertasPage>> }> {
      const fixture = TestBed.createComponent(OfertasPage);
      await fixture.whenStable();
      const pagina = fixture.nativeElement as HTMLElement;
      pagina.querySelector<HTMLButtonElement>('[data-columnas]')!.click();
      await fixture.whenStable();
      return { pagina, fixture };
    }

    const cabeceras = (pagina: HTMLElement) =>
      [...pagina.querySelectorAll('thead th')].map((th) => th.textContent?.replace(/[▲▼]/g, '').trim());

    it('el boton dice cuantas columnas se ven de cuantas hay', async () => {
      const fixture = TestBed.createComponent(OfertasPage);
      await fixture.whenStable();

      const boton = (fixture.nativeElement as HTMLElement).querySelector('[data-columnas]');

      expect(boton?.textContent).toMatch(/11\/\d{2}/);
      expect(boton?.getAttribute('aria-expanded')).toBe('false');
    });

    it('agrupa las columnas como la maqueta, con cuantas fichas tienen dato', async () => {
      const { pagina } = await abrirSelector();

      const grupos = [...pagina.querySelectorAll('[data-selector] legend')].map((l) => l.textContent?.trim());
      expect(grupos).toEqual(['Oferta', 'Candidatura', 'Documentos']);
      expect(pagina.querySelector('[data-selector] [data-con-dato="empresa"]')?.textContent?.trim()).toBe('13');
    });

    it('desmarcar una columna la quita de la tabla', async () => {
      const { pagina, fixture } = await abrirSelector();

      pagina.querySelector<HTMLInputElement>('[data-selector] input[value="salario"]')!.click();
      await fixture.whenStable();

      expect(cabeceras(pagina)).not.toContain('Salario');
    });

    it('marcar una que no estaba la añade en su sitio', async () => {
      const { pagina, fixture } = await abrirSelector();

      pagina.querySelector<HTMLInputElement>('[data-selector] input[value="fase"]')!.click();
      await fixture.whenStable();

      const lista = cabeceras(pagina);
      expect(lista.indexOf('Fase')).toBe(lista.indexOf('Estado') + 1);
    });

    it('la empresa viene marcada y no se puede desmarcar', async () => {
      const { pagina } = await abrirSelector();

      const empresa = pagina.querySelector<HTMLInputElement>('[data-selector] input[value="empresa"]');
      expect(empresa?.checked).toBe(true);
      expect(empresa?.disabled).toBe(true);
    });

    it('Escape cierra el selector', async () => {
      const { pagina, fixture } = await abrirSelector();

      pagina
        .querySelector('[data-selector]')!
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await fixture.whenStable();

      expect(pagina.querySelector('[data-selector]')).toBeNull();
    });
  });
});

describe('OfertasPage · números según el idioma activo', () => {
  const MUCHAS: Candidatura[] = Array.from({ length: 1100 }, (_, i) => ({
    id: `c${i}`,
    estado: 'Pendiente',
    oferta: { id: `o${i}`, empresa: `Empresa ${i}`, puesto: 'Frontend', idioma: 'es' },
  }));

  async function recuentoEn(locale: string): Promise<string> {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [OfertasPage],
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: locale },
        CandidaturasStore,
        { provide: RepositorioDeCandidaturas, useValue: { listar: async () => MUCHAS } },
        { provide: FuenteDeAcciones, useClass: FuenteDeAccionesDemo },
        { provide: FuenteDeEncaje, useClass: FuenteDeEncajeDemo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(OfertasPage);
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).querySelector('.total')?.textContent?.trim() ?? '';
  }

  it('el separador de miles es el del idioma, no uno fijo', async () => {
    registerLocaleData(localeDe);

    expect(await recuentoEn('de')).toBe('1.100 de 1.100');
  });
});

describe('OfertasPage · filtro de alcanzables', () => {
  let resumen: ReturnType<typeof vi.fn>;

  async function montar(fuente?: Partial<FuenteDeEncaje>) {
    localStorage.clear();
    const demo = new FuenteDeEncajeDemo();
    resumen = vi.fn((ids: string[]) => demo.resumen(ids));
    await TestBed.configureTestingModule({
      imports: [OfertasPage],
      providers: [
        provideRouter([]),
        CandidaturasStore,
        { provide: RepositorioDeCandidaturas, useClass: RepositorioDemo },
        { provide: FuenteDeAcciones, useClass: FuenteDeAccionesDemo },
        { provide: FuenteDeEncaje, useValue: fuente ?? { resumen } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(OfertasPage);
    await fixture.whenStable();
    const pagina = fixture.nativeElement as HTMLElement;
    const casilla = () => pagina.querySelector<HTMLInputElement>('[data-filtro-alcanzables]');
    const filas = () => pagina.querySelectorAll('table tbody tr').length;
    const marcar = async () => {
      casilla()?.click();
      await fixture.whenStable();
    };
    return { fixture, pagina, casilla, filas, marcar };
  }

  it('es una casilla con su etiqueta, apagada al empezar', async () => {
    const { pagina, casilla } = await montar();

    expect(casilla()?.checked).toBe(false);
    expect(casilla()?.closest('label')?.textContent).toContain('Solo alcanzables');
    expect(pagina.querySelector('[data-ayuda-alcanzables]')?.getAttribute('aria-live')).toBe('polite');
  });

  it('sin activarla no pregunta nada al servidor', async () => {
    await montar();

    expect(resumen).not.toHaveBeenCalled();
  });

  it('al activarla solo quedan las ofertas alcanzables, con una sola peticion para toda la lista', async () => {
    const { filas, marcar } = await montar();
    expect(filas()).toBe(13);

    await marcar();

    expect(resumen).toHaveBeenCalledTimes(1);
    expect(resumen.mock.calls[0][0]).toHaveLength(13);
    expect(filas()).toBe(3);
  });

  it('al apagarla vuelven todas', async () => {
    const { filas, marcar } = await montar();
    await marcar();

    await marcar();

    expect(filas()).toBe(13);
  });

  it('convive con el filtro de estado y no vuelve a preguntar por lo que ya sabe', async () => {
    const { fixture, pagina, filas, marcar } = await montar();
    await marcar();

    pagina.querySelector<HTMLButtonElement>('[data-filtro="Entrevista"]')?.click();
    await fixture.whenStable();

    expect(filas()).toBe(1);
    expect(resumen).toHaveBeenCalledTimes(1);
  });

  it('si ninguna de las que ves es alcanzable, lo dice en vez de dejar la tabla vacia sin motivo', async () => {
    const { fixture, pagina, marcar } = await montar();
    pagina.querySelector<HTMLButtonElement>('[data-filtro="Caducada"]')?.click();
    await fixture.whenStable();

    await marcar();

    expect(pagina.querySelector('td.vacio')?.textContent).toContain('alcanzable');
    expect(pagina.querySelector('[data-ayuda-alcanzables]')?.textContent).toContain('Ninguna');
  });

  it('cuenta cuantas son alcanzables entre las que se ven', async () => {
    const { pagina, marcar } = await montar();

    await marcar();

    expect(pagina.querySelector('[data-ayuda-alcanzables]')?.textContent).toContain('3 de 13');
  });

  it('si el encaje falla, el filtro se desactiva con una explicacion y la tabla sigue entera', async () => {
    const { pagina, casilla, filas, marcar } = await montar({
      resumen: async () => {
        throw new Error('caido');
      },
    });

    await marcar();

    expect(casilla()?.disabled).toBe(true);
    expect(casilla()?.checked).toBe(false);
    expect(filas()).toBe(13);
    expect(pagina.querySelector('[data-ayuda-alcanzables]')?.textContent).toContain('No hemos podido');
  });
});
