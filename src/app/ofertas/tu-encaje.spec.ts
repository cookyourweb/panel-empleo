import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Encaje } from './encaje';
import { TuEncaje, VISTA_DE_ENCAJE, VistaDeEncaje } from './tu-encaje';

const ENCAJE: Encaje = {
  cubiertos: [
    { requisito: 'Angular', evidencia: 'Angular 17 en Acme' },
    { requisito: 'TypeScript', evidencia: '<img src=x onerror=alert(1)>' },
  ],
  huecos: [
    { requisito: 'Rust', eliminatorio: false },
    { requisito: '25 anos de experiencia', eliminatorio: true },
  ],
  noEvaluables: ['Buena comunicacion'],
  alcanzable: false,
  cobertura: 0.5,
};

describe('TuEncaje', () => {
  async function pintar(vista: VistaDeEncaje): Promise<HTMLElement> {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TuEncaje);
    fixture.componentRef.setInput('vista', vista);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const listo = (encaje: Encaje): VistaDeEncaje => ({ estado: VISTA_DE_ENCAJE.listo, encaje });

  it('tiene un titulo de seccion y un hueco aria-live para los estados asincronos', async () => {
    const pagina = await pintar({ estado: VISTA_DE_ENCAJE.cargando });

    expect(pagina.querySelector('section h3')?.textContent).toContain('Tu encaje');
    expect(pagina.querySelector('[aria-live="polite"]')?.textContent).toContain('Calculando');
  });

  it('un error no bloquea: lo dice y la ficha sigue', async () => {
    const pagina = await pintar({ estado: VISTA_DE_ENCAJE.error });

    expect(pagina.querySelector('[data-encaje-error]')?.textContent).toContain('No hemos podido');
  });

  it('sin perfil enlaza al alta', async () => {
    const pagina = await pintar({ estado: VISTA_DE_ENCAJE.sinPerfil });

    expect(pagina.querySelector('a[href="/alta"]')).not.toBeNull();
  });

  it('dice cuantos requisitos cubres de cuantos se han podido medir', async () => {
    const pagina = await pintar(listo(ENCAJE));

    expect(pagina.querySelector('[data-encaje-cobertura]')?.textContent).toContain('Cubres 2 de 4 requisitos');
  });

  it('cada cubierto lleva su evidencia, y se pinta como texto, nunca como html', async () => {
    const pagina = await pintar(listo(ENCAJE));

    const evidencias = [...pagina.querySelectorAll('[data-encaje-cubierto] blockquote')];

    expect(evidencias[0].textContent).toContain('Angular 17 en Acme');
    expect(evidencias[1].textContent).toContain('<img src=x onerror=alert(1)>');
    expect(pagina.querySelector('img')).toBeNull();
  });

  it('marca los huecos eliminatorios con texto, no solo con color', async () => {
    const pagina = await pintar(listo(ENCAJE));

    const huecos = [...pagina.querySelectorAll('[data-encaje-hueco]')];

    expect(huecos[0].textContent).not.toContain('imprescindible');
    expect(huecos[1].textContent).toContain('imprescindible');
  });

  it('lista lo que no se puede evaluar', async () => {
    const pagina = await pintar(listo(ENCAJE));

    expect(pagina.querySelector('[data-encaje-no-evaluable]')?.textContent).toContain('Buena comunicacion');
  });

  it('una oferta alcanzable lo dice, sin prometer nada mas', async () => {
    const pagina = await pintar(listo({ ...ENCAJE, huecos: [], alcanzable: true }));

    expect(pagina.querySelector('[data-encaje-veredicto]')?.textContent).toContain('Esta te la puedes pedir');
  });

  it('una no alcanzable no presume: no dice que te la puedes pedir', async () => {
    const pagina = await pintar(listo(ENCAJE));

    expect(pagina.textContent).not.toContain('te la puedes pedir');
  });

  it('sin tecnologias que comparar lo dice con honestidad, sin nota ni cobertura', async () => {
    const pagina = await pintar(
      listo({ cubiertos: [], huecos: [], noEvaluables: ['Buena comunicacion'], alcanzable: false, cobertura: 0 }),
    );

    expect(pagina.querySelector('[data-encaje-sin-datos]')?.textContent).toContain('Sin datos para evaluar');
    expect(pagina.querySelector('[data-encaje-cobertura]')).toBeNull();
    expect(pagina.querySelector('[data-encaje-no-evaluable]')?.textContent).toContain('Buena comunicacion');
  });
});
