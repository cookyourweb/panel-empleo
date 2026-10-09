import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { EnlacesDeAccion } from './acciones';
import { CandidaturasStore } from './candidaturas.store';
import { DetallePage } from './detalle.page';
import { Encaje, FuenteDeEncaje, ResultadoDeEncaje } from './encaje';
import { FuenteDeAcciones } from './fuente-de-acciones';
import { RepositorioDemo } from './repositorio-demo';
import { RepositorioDeCandidaturas } from './repositorio-de-candidaturas';

describe('DetallePage', () => {
  const ENLACES: EnlacesDeAccion = {
    aprobar: 'https://n8n.test/aprobar?id=',
    descartar: 'https://n8n.test/descartar?id=',
    enviarEmpresa: 'https://n8n.test/enviar?id=',
  };

  const ENCAJE: Encaje = {
    cubiertos: [{ requisito: 'Angular', evidencia: 'Angular 17 en Acme' }],
    huecos: [],
    noEvaluables: [],
    alcanzable: true,
    cobertura: 1,
  };
  const CON_ENCAJE: Pick<FuenteDeEncaje, 'obtener'> = {
    obtener: async (): Promise<ResultadoDeEncaje> => ({ estado: 'listo', encaje: ENCAJE }),
  };

  async function abrir(
    ruta: string,
    enlaces: EnlacesDeAccion | null = null,
    encaje: Pick<FuenteDeEncaje, 'obtener'> = CON_ENCAJE,
  ): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'candidatura/:id', component: DetallePage }], withComponentInputBinding()),
        CandidaturasStore,
        { provide: RepositorioDeCandidaturas, useClass: RepositorioDemo },
        { provide: FuenteDeAcciones, useValue: { enlaces: async () => enlaces } },
        { provide: FuenteDeEncaje, useValue: encaje },
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
    expect(pagina.querySelector('a[href="/panel"]')).not.toBeNull();
  });

  it('el CV que se genero se abre fuera, como en Notion', async () => {
    const pagina = await abrir('/candidatura/c13');

    const cv = pagina.querySelector<HTMLAnchorElement>('[data-campo="cv"] a');

    expect(cv?.href).toBe('https://ejemplo.test/cv/lumen-grid');
    expect(cv?.target).toBe('_blank');
    expect(cv?.rel).toContain('noopener');
  });

  it('enseña la carta respetando sus saltos de linea', async () => {
    const pagina = await abrir('/candidatura/c13');

    const carta = pagina.querySelector('[data-campo="carta"]');

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

    expect(pagina.querySelector('[data-campo="cv"]')).toBeNull();
    expect(pagina.querySelector('[data-campo="carta"]')).toBeNull();
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

  it('el estado lleva la misma etiqueta de color que en la tabla', async () => {
    const pagina = await abrir('/candidatura/c13');

    expect(pagina.querySelector('.estado')?.getAttribute('data-estado')).toBe('Aprobado');
  });

  it('agrupa los campos en Oferta, Candidatura y Documentos, como la maqueta', async () => {
    const pagina = await abrir('/candidatura/c13');

    const titulos = [...pagina.querySelectorAll('section h3')].map((h) => h.textContent?.trim());

    expect(titulos).toContain('Oferta');
    expect(titulos).toContain('Documentos');
  });

  it('pinta el contenido de la pagina de Notion con sus titulos y listas', async () => {
    const pagina = await abrir('/candidatura/c1');

    const cuerpo = pagina.querySelector('[data-cuerpo]');

    expect(cuerpo?.querySelector('h4')?.textContent).toContain('Historial');
    expect(cuerpo?.querySelectorAll('li').length).toBeGreaterThan(0);
  });

  it('ofrece abrir la ficha en Notion', async () => {
    const pagina = await abrir('/candidatura/c1');

    const notion = pagina.querySelector<HTMLAnchorElement>('[data-notion]');

    expect(notion?.target).toBe('_blank');
  });

  it('cuenta los campos sin dato en un desplegable, sin ocupar sitio', async () => {
    const pagina = await abrir('/candidatura/c2');

    expect(pagina.querySelector('details summary')?.textContent).toMatch(/\d+ campos sin dato/);
  });
  describe('Tu encaje', () => {
    it('enseña el encaje de la oferta abierta con su evidencia', async () => {
      const pagina = await abrir('/candidatura/c1');

      expect(pagina.querySelector('app-tu-encaje')?.textContent).toContain('Cubres 1 de 1 requisito');
      expect(pagina.querySelector('[data-encaje-cubierto]')?.textContent).toContain('Angular 17 en Acme');
    });

    it('pide el encaje por el id de la oferta, no por el de la candidatura', async () => {
      const obtener = vi.fn(CON_ENCAJE.obtener);

      await abrir('/candidatura/c1', null, { obtener });

      expect(obtener).toHaveBeenCalledWith('o1');
    });

    it('si el encaje falla, la ficha sigue entera y se dice', async () => {
      const pagina = await abrir('/candidatura/c1', null, {
        obtener: async () => {
          throw new Error('caido');
        },
      });

      expect(pagina.querySelector('[data-encaje-error]')).not.toBeNull();
      expect(pagina.textContent).toContain('Northwind Labs');
    });

    it('sin perfil enlaza al alta', async () => {
      const pagina = await abrir('/candidatura/c1', null, { obtener: async () => ({ estado: 'sin-perfil' }) });

      expect(pagina.querySelector('app-tu-encaje a[href="/alta"]')).not.toBeNull();
    });

    it('una candidatura que no existe no pide encaje', async () => {
      const obtener = vi.fn(CON_ENCAJE.obtener);

      await abrir('/candidatura/no-existe', null, { obtener });

      expect(obtener).not.toHaveBeenCalled();
    });
  });
});
