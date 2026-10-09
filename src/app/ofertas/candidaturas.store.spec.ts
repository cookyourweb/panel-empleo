import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CandidaturasStore } from './candidaturas.store';
import { Candidatura, MODALIDADES } from './dominio';
import { CambiosDeCandidatura } from './edicion';
import { EditorDeCandidaturas } from './editor-de-candidaturas';
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

function store(candidaturas?: Candidatura[], locale = 'es'): CandidaturasStore {
  TestBed.configureTestingModule({
    providers: [
      { provide: LOCALE_ID, useValue: locale },
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

  it('el alfabeto es el del idioma activo: en sueco la Ä va detrás de la Z', async () => {
    const palabras: Candidatura[] = ['Zeta', 'Ärbol'].map((empresa, i) => ({
      id: `p${i}`,
      estado: 'Pendiente',
      oferta: { id: `p${i}`, empresa, puesto: 'X', idioma: 'es' },
    }));

    const espanol = store(palabras, 'es');
    await espanol.cargar();
    espanol.ordenarPor('empresa');
    expect(espanol.visibles().map((u) => u.oferta.empresa)).toEqual(['Ärbol', 'Zeta']);

    TestBed.resetTestingModule();
    const sueco = store(palabras, 'sv');
    await sueco.cargar();
    sueco.ordenarPor('empresa');
    expect(sueco.visibles().map((u) => u.oferta.empresa)).toEqual(['Zeta', 'Ärbol']);
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

  describe('vecinosDe', () => {
    it('da la anterior y la siguiente de las que se estan viendo', async () => {
      const s = store(TRES);
      await s.cargar();

      expect(s.vecinosDe('c2')).toEqual({ anterior: 'c1', siguiente: 'c3' });
    });

    it('en los extremos no hay vecina, en vez de dar la vuelta', async () => {
      const s = store(TRES);
      await s.cargar();

      expect(s.vecinosDe('c1')).toEqual({ anterior: undefined, siguiente: 'c2' });
      expect(s.vecinosDe('c3')).toEqual({ anterior: 'c2', siguiente: undefined });
    });

    it('sigue el filtro y el orden de la tabla', async () => {
      const s = store(TRES);
      await s.cargar();
      s.filtrarPor('Pendiente');
      s.ordenarPor('empresa');
      s.ordenarPor('empresa');

      expect(s.vecinosDe('c2')).toEqual({ anterior: undefined, siguiente: 'c1' });
    });

    it('una que el filtro ha dejado fuera no tiene vecinas', async () => {
      const s = store(TRES);
      await s.cargar();
      s.filtrarPor('Caducada');

      expect(s.vecinosDe('c1')).toEqual({ anterior: undefined, siguiente: undefined });
    });
  });

  describe('guardarCambios', () => {
    function conEditor(guardar: (id: string, cambios: CambiosDeCandidatura) => Promise<void>): CandidaturasStore {
      TestBed.configureTestingModule({
        providers: [
          CandidaturasStore,
          { provide: RepositorioDeCandidaturas, useValue: new RepositorioFalso(TRES) },
          {
            provide: EditorDeCandidaturas,
            useValue: {
              opciones: async () => ({ fase: ['CV enviado'] }),
              guardar,
              eliminar: async () => [],
              restaurar: async () => [],
              eliminadas: async () => [],
            },
          },
        ],
      });
      return TestBed.inject(CandidaturasStore);
    }

    it('al cargar trae las opciones de Notion, y las de modalidad del dominio', async () => {
      const s = conEditor(async () => undefined);
      await s.cargar();

      expect(s.opcionesDeEdicion()).toEqual({ fase: ['CV enviado'], modalidad: [...MODALIDADES] });
    });

    it('cuando Notion lo acepta, el cambio se ve ya en la tabla', async () => {
      const s = conEditor(async () => undefined);
      await s.cargar();

      await s.guardarCambios('c2', { salario: '70k' });

      expect(s.buscarPorId('c2')?.oferta.salario).toBe('70k');
    });

    it('si Notion lo rechaza, no se finge que se guardo', async () => {
      const s = conEditor(async () => {
        throw new Error('Notion no responde');
      });
      await s.cargar();

      await expect(s.guardarCambios('c2', { salario: '70k' })).rejects.toThrow('Notion no responde');
      expect(s.buscarPorId('c2')?.oferta).not.toHaveProperty('salario');
    });
  });

  it('sin editor no hay opciones de edicion', async () => {
    const s = store(TRES);
    await s.cargar();

    expect(s.opcionesDeEdicion()).toBeNull();
  });

  describe('seleccion y acciones en bloque', () => {
    const CUATRO: Candidatura[] = [
      ...TRES,
      { id: 'c4', estado: 'En proceso', oferta: { id: 'o4', empresa: 'Delta', puesto: 'Tech Lead', idioma: 'es' } },
    ];

    function conPapelera(): { s: CandidaturasStore; papelera: { eliminar: string[][]; restaurar: string[][]; estados: [string, CambiosDeCandidatura][] } } {
      const papelera = { eliminar: [] as string[][], restaurar: [] as string[][], estados: [] as [string, CambiosDeCandidatura][] };
      TestBed.configureTestingModule({
        providers: [
          CandidaturasStore,
          { provide: RepositorioDeCandidaturas, useValue: new RepositorioFalso(CUATRO) },
          {
            provide: EditorDeCandidaturas,
            useValue: {
              opciones: async () => ({}),
              guardar: async (id: string, cambios: CambiosDeCandidatura) => {
                papelera.estados.push([id, cambios]);
              },
              eliminar: async (ids: string[]) => {
                papelera.eliminar.push(ids);
                return ids;
              },
              restaurar: async (ids: string[]) => {
                papelera.restaurar.push(ids);
                return ids;
              },
              eliminadas: async () => [],
            },
          },
        ],
      });
      return { s: TestBed.inject(CandidaturasStore), papelera };
    }

    it('marcar y desmarcar una fila', async () => {
      const { s } = conPapelera();
      await s.cargar();

      s.alternarSeleccion('c2');
      expect([...s.seleccionadas()]).toEqual(['c2']);
      s.alternarSeleccion('c2');
      expect(s.seleccionadas().size).toBe(0);
    });

    it('con Shift marca todo el tramo desde la ultima, como en la maqueta', async () => {
      const { s } = conPapelera();
      await s.cargar();

      s.alternarSeleccion('c1');
      s.alternarSeleccion('c3', true);

      expect([...s.seleccionadas()].sort()).toEqual(['c1', 'c2', 'c3']);
    });

    it('marcar todas es marcar las que se ven, no las que el filtro esconde', async () => {
      const { s } = conPapelera();
      await s.cargar();
      s.filtrarPor('Pendiente');

      s.marcarTodas(true);

      expect([...s.seleccionadas()].sort()).toEqual(['c1', 'c2']);
    });

    it('lo que el filtro esconde deja de contar como seleccionado', async () => {
      const { s } = conPapelera();
      await s.cargar();
      s.alternarSeleccion('c3');

      s.filtrarPor('Pendiente');

      expect(s.seleccionadas().size).toBe(0);
    });

    it('eliminar las saca de la tabla y de la seleccion, y restaurar las devuelve', async () => {
      const { s, papelera } = conPapelera();
      await s.cargar();
      s.alternarSeleccion('c1');

      expect(await s.eliminar(['c1'])).toEqual(['c1']);
      expect(s.buscarPorId('c1')).toBeUndefined();
      expect(s.seleccionadas().size).toBe(0);
      expect(s.eliminadas().map((e) => e.candidatura.id)).toEqual(['c1']);

      await s.restaurar(['c1']);
      expect(s.buscarPorId('c1')?.oferta.empresa).toBe('Acme');
      expect(s.eliminadas()).toEqual([]);
      expect(papelera.eliminar).toEqual([['c1']]);
      expect(papelera.restaurar).toEqual([['c1']]);
    });

    it('cambiar el estado solo toca las que cambian, y dice como estaban para deshacer', async () => {
      const { s, papelera } = conPapelera();
      await s.cargar();

      const antes = await s.cambiarEstado(['c1', 'c3'], 'Caducada');

      expect(antes).toEqual([{ id: 'c1', estado: 'Pendiente' }]);
      expect(s.buscarPorId('c1')?.estado).toBe('Caducada');
      expect(papelera.estados).toEqual([['c1', { estado: 'Caducada' }]]);
    });
  });

  describe('orden por defecto', () => {
    const conFechas: Candidatura[] = [
      { ...TRES[0], creada: '2026-09-01T10:00:00.000Z' },
      { ...TRES[1], creada: '2026-10-05T18:00:00.000Z' },
      { ...TRES[2] },
      { id: 'c4', estado: 'Pendiente', creada: '2026-10-05T09:00:00.000Z', oferta: { id: 'o4', empresa: 'Delta', puesto: 'X', idioma: 'es' } },
    ];

    it('sin orden elegido, la ultima que entro va arriba', async () => {
      const s = store(conFechas);
      await s.cargar();

      expect(s.visibles().map((una) => una.id)).toEqual(['c2', 'c4', 'c1', 'c3']);
    });

    it('quitar el orden de una columna vuelve a la mas reciente arriba', async () => {
      const s = store(conFechas);
      await s.cargar();
      s.ordenarPor('empresa');
      s.ordenarPor('empresa');
      s.ordenarPor('empresa');

      expect(s.visibles()[0].id).toBe('c2');
    });
  });
});

describe('CandidaturasStore · restringir a ofertas', () => {
  it('sin restriccion se ven todas', async () => {
    const s = store(TRES);
    await s.cargar();

    expect(s.visibles()).toHaveLength(3);
  });

  it('con una restriccion solo quedan las candidaturas de esas ofertas', async () => {
    const s = store(TRES);
    await s.cargar();

    s.restringirAOfertas(new Set(['o1', 'o3']));

    expect(s.visibles().map((una) => una.id).sort()).toEqual(['c1', 'c3']);
  });

  it('quitar la restriccion las devuelve todas', async () => {
    const s = store(TRES);
    await s.cargar();
    s.restringirAOfertas(new Set(['o1']));

    s.restringirAOfertas(null);

    expect(s.visibles()).toHaveLength(3);
  });

  it('convive con el filtro de estado y la busqueda', async () => {
    const s = store(TRES);
    await s.cargar();

    s.restringirAOfertas(new Set(['o1', 'o2', 'o3']));
    s.filtrarPor('Pendiente');
    s.buscar('beta');

    expect(s.visibles().map((una) => una.id)).toEqual(['c2']);
  });

  it('las ofertas por las que se pregunta no dependen de la restriccion, para no pedir en bucle', async () => {
    const s = store(TRES);
    await s.cargar();

    s.restringirAOfertas(new Set(['o1']));
    s.filtrarPor('Pendiente');

    expect(s.idsDeOfertasFiltradas().sort()).toEqual(['o1', 'o2']);
  });
});
