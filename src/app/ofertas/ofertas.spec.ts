import { TestBed } from '@angular/core/testing';

import { Oferta } from './oferta';
import { OfertasStore } from './ofertas.store';
import { RepositorioDeOfertas } from './repositorio-de-ofertas';

/** Doble de prueba: la aplicacion depende de la interfaz, no de una fuente concreta. */
class RepositorioFalso implements RepositorioDeOfertas {
  constructor(
    private readonly ofertas: Oferta[] = [
      { id: '1', empresa: 'Acme', puesto: 'Frontend', estado: 'Pendiente' },
    ],
  ) {}
  async listar() {
    return this.ofertas;
  }
}

describe('OfertasStore', () => {
  it('empieza sin ofertas y sin haber cargado nada', () => {
    TestBed.configureTestingModule({
      providers: [OfertasStore, { provide: RepositorioDeOfertas, useValue: new RepositorioFalso() }],
    });

    const store = TestBed.inject(OfertasStore);

    expect(store.ofertas()).toEqual([]);
  });

  it('carga las ofertas del repositorio', async () => {
    TestBed.configureTestingModule({
      providers: [OfertasStore, { provide: RepositorioDeOfertas, useValue: new RepositorioFalso() }],
    });

    const store = TestBed.inject(OfertasStore);
    await store.cargar();

    expect(store.ofertas()).toHaveLength(1);
    expect(store.ofertas()[0].empresa).toBe('Acme');
  });

  it('cuenta cuantas ofertas hay en cada estado, para poder filtrar por el', async () => {
    const repositorio = new RepositorioFalso([
      { id: '1', empresa: 'Acme', puesto: 'Frontend', estado: 'Pendiente' },
      { id: '2', empresa: 'Beta', puesto: 'Full-stack', estado: 'Pendiente' },
      { id: '3', empresa: 'Ceta', puesto: 'Frontend', estado: 'Caducada' },
    ]);
    TestBed.configureTestingModule({
      providers: [OfertasStore, { provide: RepositorioDeOfertas, useValue: repositorio }],
    });

    const store = TestBed.inject(OfertasStore);
    await store.cargar();

    expect(store.recuentoPorEstado()).toEqual({ Pendiente: 2, Caducada: 1 });
  });

  it('sin filtro se ven todas', async () => {
    const store = conTresOfertas();
    await store.cargar();

    expect(store.visibles()).toHaveLength(3);
  });

  it('filtrar por un estado deja solo las de ese estado', async () => {
    const store = conTresOfertas();
    await store.cargar();

    store.filtrarPor('Caducada');

    expect(store.visibles().map((oferta) => oferta.empresa)).toEqual(['Ceta']);
  });

  it('quitar el filtro vuelve a enseñarlas todas', async () => {
    const store = conTresOfertas();
    await store.cargar();

    store.filtrarPor('Caducada');
    store.filtrarPor(null);

    expect(store.visibles()).toHaveLength(3);
  });
});

function conTresOfertas(): OfertasStore {
  const repositorio = new RepositorioFalso([
    { id: '1', empresa: 'Acme', puesto: 'Frontend', estado: 'Pendiente' },
    { id: '2', empresa: 'Beta', puesto: 'Full-stack', estado: 'Pendiente' },
    { id: '3', empresa: 'Ceta', puesto: 'Frontend', estado: 'Caducada' },
  ]);
  TestBed.configureTestingModule({
    providers: [OfertasStore, { provide: RepositorioDeOfertas, useValue: repositorio }],
  });
  return TestBed.inject(OfertasStore);
}
