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

describe('CandidaturasStore · buscar', () => {
  const VARIAS: Candidatura[] = [
    { id: 'a', estado: 'Pendiente', oferta: { id: 'a', empresa: 'Heymondo', puesto: 'Senior Frontend', idioma: 'en', ubicacion: 'España' } },
    { id: 'b', estado: 'Enviado', oferta: { id: 'b', empresa: 'Factorial', puesto: 'Product Engineer', idioma: 'en', ubicacion: 'Madrid' } },
    { id: 'c', estado: 'Pendiente', oferta: { id: 'c', empresa: 'Axpo', puesto: 'AI Engineer', idioma: 'en', ubicacion: 'Málaga' } },
  ];

  it('encuentra por empresa, puesto o ubicacion', async () => {
    const s = store(VARIAS);
    await s.cargar();

    s.buscar('factorial');
    expect(s.visibles().map((u) => u.id)).toEqual(['b']);

    s.buscar('frontend');
    expect(s.visibles().map((u) => u.id)).toEqual(['a']);

    s.buscar('madrid');
    expect(s.visibles().map((u) => u.id)).toEqual(['b']);
  });

  it('no distingue mayusculas ni tildes', async () => {
    const s = store(VARIAS);
    await s.cargar();

    s.buscar('MALAGA');
    expect(s.visibles().map((u) => u.id)).toEqual(['c']);
  });

  it('se combina con el filtro de estado', async () => {
    const s = store(VARIAS);
    await s.cargar();

    s.filtrarPor('Pendiente');
    s.buscar('engineer');
    expect(s.visibles().map((u) => u.id)).toEqual(['c']);
  });

  it('una busqueda vacia o de espacios las deja ver todas', async () => {
    const s = store(VARIAS);
    await s.cargar();

    s.buscar('   ');
    expect(s.visibles()).toHaveLength(3);
  });

  it('buscar no cambia los recuentos: siguen contando todas', async () => {
    const s = store(VARIAS);
    await s.cargar();

    s.buscar('axpo');
    expect(s.recuentoPorEstado()).toEqual({ Pendiente: 2, Enviado: 1 });
  });
});

describe('CandidaturasStore · ordenar', () => {
  const VARIAS: Candidatura[] = [
    { id: 'b', estado: 'Enviado', oferta: { id: 'b', empresa: 'beta', puesto: 'Z', idioma: 'es' } },
    { id: 'a', estado: 'Pendiente', oferta: { id: 'a', empresa: 'Álamo', puesto: 'Y', idioma: 'es' } },
    { id: 'c', estado: 'Caducada', oferta: { id: 'c', empresa: 'Ceta', puesto: 'X', idioma: 'es' } },
  ];

  it('sin orden se respeta el de la fuente', async () => {
    const s = store(VARIAS);
    await s.cargar();

    expect(s.orden()).toBeNull();
    expect(s.visibles().map((u) => u.id)).toEqual(['b', 'a', 'c']);
  });

  it('la primera vez ordena ascendente, en orden alfabetico espanol', async () => {
    const s = store(VARIAS);
    await s.cargar();

    s.ordenarPor('empresa');
    expect(s.orden()).toEqual({ columna: 'empresa', sentido: 'asc' });
    expect(s.visibles().map((u) => u.id)).toEqual(['a', 'b', 'c']);
  });

  it('la segunda vez descendente y la tercera quita el orden', async () => {
    const s = store(VARIAS);
    await s.cargar();

    s.ordenarPor('puesto');
    s.ordenarPor('puesto');
    expect(s.visibles().map((u) => u.id)).toEqual(['b', 'a', 'c']);
    expect(s.orden()?.sentido).toBe('desc');

    s.ordenarPor('puesto');
    expect(s.orden()).toBeNull();
  });

  it('cambiar de columna empieza de nuevo en ascendente', async () => {
    const s = store(VARIAS);
    await s.cargar();

    s.ordenarPor('empresa');
    s.ordenarPor('estado');
    expect(s.orden()).toEqual({ columna: 'estado', sentido: 'asc' });
  });

  it('el estado se ordena por el avance del proceso, no por el alfabeto', async () => {
    const s = store(VARIAS);
    await s.cargar();

    s.ordenarPor('estado');
    expect(s.visibles().map((u) => u.estado)).toEqual(['Pendiente', 'Enviado', 'Caducada']);
  });

  it('los huecos van siempre al final, en los dos sentidos', async () => {
    const conHueco: Candidatura[] = [
      { id: 'x', estado: 'Pendiente', oferta: { id: 'x', empresa: 'X', puesto: 'p', idioma: 'es' } },
      { id: 'y', estado: 'Pendiente', oferta: { id: 'y', empresa: 'Y', puesto: 'p', idioma: 'es', salario: '50k' } },
    ];
    const s = store(conHueco);
    await s.cargar();

    s.ordenarPor('salario');
    expect(s.visibles().map((u) => u.id)).toEqual(['y', 'x']);
    s.ordenarPor('salario');
    expect(s.visibles().map((u) => u.id)).toEqual(['y', 'x']);
  });
});

describe('CandidaturasStore · ordenar por seguimiento', () => {
  const VARIAS: Candidatura[] = [
    { id: 'a', estado: 'Enviado', fechaEnvio: '2026-09-14', viaEnvio: 'LinkedIn', oferta: { id: 'a', empresa: 'A', puesto: 'p', idioma: 'es' } },
    { id: 'b', estado: 'Enviado', fechaEnvio: '2026-10-05', viaEnvio: 'Portal empresa', oferta: { id: 'b', empresa: 'B', puesto: 'p', idioma: 'es', fechaPublicacion: '2026-10-01' } },
    { id: 'c', estado: 'Pendiente', oferta: { id: 'c', empresa: 'C', puesto: 'p', idioma: 'es', fechaPublicacion: '2026-09-20' } },
  ];

  it('ordena por fecha de envio, con las que no tienen fecha al final', async () => {
    const s = store(VARIAS);
    await s.cargar();

    s.ordenarPor('fechaEnvio');
    s.ordenarPor('fechaEnvio');
    expect(s.visibles().map((u) => u.id)).toEqual(['b', 'a', 'c']);
  });

  it('ordena por fecha de publicacion, que es de la oferta', async () => {
    const s = store(VARIAS);
    await s.cargar();

    s.ordenarPor('fechaPublicacion');
    expect(s.visibles().map((u) => u.id)).toEqual(['c', 'b', 'a']);
  });

  it('ordena por via de envio', async () => {
    const s = store(VARIAS);
    await s.cargar();

    s.ordenarPor('viaEnvio');
    expect(s.visibles().map((u) => u.id)).toEqual(['a', 'b', 'c']);
  });
});

