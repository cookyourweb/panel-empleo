import { TestBed } from '@angular/core/testing';

import { CandidaturasStore } from './candidaturas.store';
import { Candidatura } from './dominio';
import { RepositorioDeCandidaturas } from './repositorio-de-candidaturas';

/** Doble de prueba: la aplicacion depende de la abstraccion, no de una fuente. */
class RepositorioFalso implements RepositorioDeCandidaturas {
  constructor(private readonly candidaturas: Candidatura[] = [UNA]) {}
  async listar() {
    return this.candidaturas;
  }
}

const UNA: Candidatura = {
  id: 'c1',
  estado: 'Pendiente',
  oferta: { id: 'o1', empresa: 'Acme', puesto: 'Frontend', idioma: 'es' },
};

const TRES: Candidatura[] = [
  UNA,
  { id: 'c2', estado: 'Pendiente', oferta: { id: 'o2', empresa: 'Beta', puesto: 'Full-stack', idioma: 'es' } },
  { id: 'c3', estado: 'Caducada', oferta: { id: 'o3', empresa: 'Ceta', puesto: 'Frontend', idioma: 'es' } },
];

function store(candidaturas?: Candidatura[]): CandidaturasStore {
  TestBed.configureTestingModule({
    providers: [
      CandidaturasStore,
      { provide: RepositorioDeCandidaturas, useValue: new RepositorioFalso(candidaturas) },
    ],
  });
  return TestBed.inject(CandidaturasStore);
}

describe('CandidaturasStore', () => {
  it('empieza vacio, sin haber cargado nada', () => {
    expect(store().candidaturas()).toEqual([]);
  });

  it('carga las candidaturas del repositorio', async () => {
    const s = store();
    await s.cargar();

    expect(s.candidaturas()).toHaveLength(1);
    expect(s.candidaturas()[0].oferta.empresa).toBe('Acme');
  });

  it('cuenta cuantas hay en cada estado, para poder filtrar por el', async () => {
    const s = store(TRES);
    await s.cargar();

    expect(s.recuentoPorEstado()).toEqual({ Pendiente: 2, Caducada: 1 });
  });

  it('sin filtro se ven todas', async () => {
    const s = store(TRES);
    await s.cargar();

    expect(s.visibles()).toHaveLength(3);
  });

  it('filtrar por un estado deja solo las de ese estado', async () => {
    const s = store(TRES);
    await s.cargar();

    s.filtrarPor('Caducada');

    expect(s.visibles().map((una) => una.oferta.empresa)).toEqual(['Ceta']);
  });

  it('quitar el filtro vuelve a enseñarlas todas', async () => {
    const s = store(TRES);
    await s.cargar();

    s.filtrarPor('Caducada');
    s.filtrarPor(null);

    expect(s.visibles()).toHaveLength(3);
  });

  it('encuentra una candidatura por su id, para poder abrirla', async () => {
    const s = store(TRES);
    await s.cargar();

    expect(s.buscarPorId('c3')?.oferta.empresa).toBe('Ceta');
  });

  it('devuelve undefined si el id no existe, en vez de reventar', async () => {
    const s = store(TRES);
    await s.cargar();

    expect(s.buscarPorId('no-existe')).toBeUndefined();
  });

  it('el recuento no cambia al filtrar: las ocultas siguen contando', async () => {
    const s = store(TRES);
    await s.cargar();

    s.filtrarPor('Caducada');

    expect(s.recuentoPorEstado()).toEqual({ Pendiente: 2, Caducada: 1 });
  });
});
