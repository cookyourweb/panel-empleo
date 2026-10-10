import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CandidaturasStore } from './candidaturas.store';
import { CambiosDeCandidatura } from './edicion';
import { EditorDeCandidaturas } from './editor-de-candidaturas';
import { FuenteDeEncaje } from './encaje';
import { FuenteDeAcciones, FuenteDeAccionesDemo } from './fuente-de-acciones';
import { FuenteDeEncajeDemo } from './fuente-de-encaje-demo';
import { OfertasPage } from './ofertas.page';
import { RepositorioDemo } from './repositorio-demo';
import { RepositorioDeCandidaturas } from './repositorio-de-candidaturas';

/** Checks por fila y acciones en bloque, como en la maqueta. Demo: c1 Northwind Pendiente, c2 Marisma Pendiente... */
describe('Seleccion y acciones en bloque', () => {
  let llamadas: { eliminar: string[][]; restaurar: string[][]; guardar: [string, CambiosDeCandidatura][] };

  async function pintar(conEditor = true) {
    localStorage.clear();
    llamadas = { eliminar: [], restaurar: [], guardar: [] };
    const editor = {
      opciones: async () => (conEditor ? {} : null),
      guardar: async (id: string, cambios: CambiosDeCandidatura) => {
        llamadas.guardar.push([id, cambios]);
      },
      eliminar: async (ids: string[]) => {
        llamadas.eliminar.push(ids);
        return ids;
      },
      restaurar: async (ids: string[]) => {
        llamadas.restaurar.push(ids);
        return ids;
      },
      eliminadas: async () => [],
    };
    TestBed.configureTestingModule({
      imports: [OfertasPage],
      providers: [
        provideRouter([]),
        CandidaturasStore,
        { provide: RepositorioDeCandidaturas, useClass: RepositorioDemo },
        { provide: FuenteDeAcciones, useClass: FuenteDeAccionesDemo },
        { provide: FuenteDeEncaje, useClass: FuenteDeEncajeDemo },
        { provide: EditorDeCandidaturas, useValue: editor },
      ],
    });
    const fixture = TestBed.createComponent(OfertasPage);
    await fixture.whenStable();
    const pagina = fixture.nativeElement as HTMLElement;
    const estable = () => fixture.whenStable();
    const check = (empresa: string) =>
      [...pagina.querySelectorAll('tbody tr')]
        .find((tr) => tr.textContent?.includes(empresa))
        ?.querySelector<HTMLInputElement>('td.sel input')!;
    return { pagina, estable, check };
  }

  it('sin puente no hay checks: no habria nada que hacer con ellos', async () => {
    const { pagina } = await pintar(false);

    expect(pagina.querySelector('td.sel')).toBeNull();
  });

  it('cada fila lleva su check a la izquierda, con un nombre que dice cual es', async () => {
    const { pagina } = await pintar();

    const primero = pagina.querySelector('tbody tr td.sel input');
    expect(primero?.getAttribute('aria-label')).toBe('Seleccionar Northwind Labs');
    expect(pagina.querySelector('tbody tr td')?.classList).toContain('sel');
  });

  it('al marcar aparece la barra de acciones con el recuento', async () => {
    const { pagina, estable, check } = await pintar();

    check('Northwind').click();
    check('Marisma').click();
    await estable();

    const barra = pagina.querySelector('[data-bloque]');
    expect(barra?.textContent).toContain('2 seleccionadas');
    expect(pagina.querySelector('tbody tr[aria-selected="true"]')).not.toBeNull();
  });

  it('el check de la cabecera marca todas las que se ven', async () => {
    const { pagina, estable } = await pintar();

    pagina.querySelector<HTMLInputElement>('thead th.sel input')!.click();
    await estable();

    expect(pagina.querySelector('[data-bloque]')?.textContent).toContain('13 seleccionadas');
  });

  it('Eliminar pregunta antes, lista las ofertas y avisa si alguna esta en curso', async () => {
    const { pagina, estable, check } = await pintar();
    check('Northwind').click();
    check('Quintana').click();
    await estable();

    pagina.querySelector<HTMLButtonElement>('[data-bloque] [data-eliminar]')!.click();
    await estable();

    const dialogo = pagina.querySelector('[role="dialog"][data-confirmar]');
    expect(dialogo?.textContent).toContain('Northwind Labs');
    expect(dialogo?.textContent).toContain('papelera de Notion');
    expect(dialogo?.querySelector('[data-aviso]')?.textContent).toContain('1 ficha está en curso');
    expect(llamadas.eliminar).toEqual([]);
  });

  it('al confirmar las quita, avisa y deja deshacer', async () => {
    const { pagina, estable, check } = await pintar();
    check('Northwind').click();
    await estable();
    pagina.querySelector<HTMLButtonElement>('[data-bloque] [data-eliminar]')!.click();
    await estable();

    pagina.querySelector<HTMLButtonElement>('[data-confirmar] [data-confirmar-eliminar]')!.click();
    await estable();

    expect(llamadas.eliminar).toEqual([['c1']]);
    expect(pagina.querySelector('tbody')?.textContent).not.toContain('Northwind');
    const aviso = pagina.querySelector('[data-aviso-general]');
    expect(aviso?.textContent).toContain('1 oferta eliminada');

    aviso!.querySelector<HTMLButtonElement>('[data-deshacer]')!.click();
    await estable();

    expect(llamadas.restaurar).toEqual([['c1']]);
    expect(pagina.querySelector('tbody')?.textContent).toContain('Northwind');
  });

  it('Marcar caducada cambia el estado y tambien se puede deshacer', async () => {
    const { pagina, estable, check } = await pintar();
    check('Northwind').click();
    await estable();

    pagina.querySelector<HTMLButtonElement>('[data-bloque] [data-caducada]')!.click();
    await estable();

    expect(llamadas.guardar).toEqual([['c1', { estado: 'Caducada' }]]);
    pagina.querySelector<HTMLButtonElement>('[data-aviso-general] [data-deshacer]')!.click();
    await estable();
    expect(llamadas.guardar.at(-1)).toEqual(['c1', { estado: 'Pendiente' }]);
  });

  it('Cambiar estado ofrece todos los estados', async () => {
    const { pagina, estable, check } = await pintar();
    check('Northwind').click();
    await estable();

    pagina.querySelector<HTMLButtonElement>('[data-bloque] [data-cambiar-estado]')!.click();
    await estable();

    expect(pagina.querySelectorAll('[role="menu"] [role="menuitem"]').length).toBe(9);
  });

  it('Eliminadas enseña lo eliminado y deja restaurarlo', async () => {
    const { pagina, estable, check } = await pintar();
    check('Northwind').click();
    await estable();
    pagina.querySelector<HTMLButtonElement>('[data-bloque] [data-eliminar]')!.click();
    await estable();
    pagina.querySelector<HTMLButtonElement>('[data-confirmar-eliminar]')!.click();
    await estable();

    pagina.querySelector<HTMLButtonElement>('[data-ver-eliminadas]')!.click();
    await estable();

    const lista = pagina.querySelector('[role="dialog"][data-eliminadas]');
    expect(lista?.textContent).toContain('Northwind Labs');
    lista!.querySelector<HTMLButtonElement>('[data-restaurar]')!.click();
    await estable();
    expect(llamadas.restaurar).toEqual([['c1']]);
  });
});
