import { computed, inject, Injectable, PendingTasks, signal } from '@angular/core';

import { columnaPorClave, valorParaOrdenar } from './columnas';
import { Candidatura, EstadoDeCandidatura, ESTADOS } from './dominio';
import { candidaturaDesdeRegistro } from './desde-notion';
import { aplicarCambios, CambiosDeCandidatura, OpcionesDeEdicion, OPCIONES_FIJAS } from './edicion';
import { EditorDeCandidaturas } from './editor-de-candidaturas';
import { RepositorioDeCandidaturas } from './repositorio-de-candidaturas';

/** La clave de una columna del catalogo (columnas.ts). Cualquiera se puede ordenar. */
export type ColumnaOrdenable = string;

/** Una candidatura eliminada desde el panel, con cuando se elimino. */
export interface Eliminada {
  cuando: string;
  candidatura: Candidatura;
}

export interface Orden {
  columna: ColumnaOrdenable;
  sentido: 'asc' | 'desc';
}

/** Minusculas y sin tildes: quien busca "malaga" tiene que encontrar "Málaga". */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** Lo que vale una columna para ordenar. Una clave que no existe ordena como vacia. */
function valorDe(una: Candidatura, clave: ColumnaOrdenable): string {
  const columna = columnaPorClave(clave);
  return columna ? valorParaOrdenar(una, columna) : '';
}

/**
 * El orden sin columna elegida: la ultima que entro, arriba. Es lo que se
 * mira al abrir el panel: que hay nuevo. Sin fecha, al final.
 */
function masRecientePrimero(a: Candidatura, b: Candidatura): number {
  if (!a.creada || !b.creada) {
    return a.creada ? -1 : b.creada ? 1 : 0;
  }
  return b.creada.localeCompare(a.creada);
}

const COMPARADOR = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

@Injectable()
export class CandidaturasStore {
  private readonly repositorio = inject(RepositorioDeCandidaturas);
  /** Opcional: sin editor (tests, o una pantalla que solo lee) todo sigue igual. */
  private readonly editor = inject(EditorDeCandidaturas, { optional: true });
  private readonly opciones = signal<OpcionesDeEdicion | null>(null);
  private readonly tareas = inject(PendingTasks);
  private readonly marcadas = signal<ReadonlySet<string>>(new Set());
  /** La ultima marcada a mano, para el tramo con Shift. */
  private ultimaMarcada: string | null = null;
  private readonly papelera = signal<Eliminada[]>([]);
  private readonly todas = signal<Candidatura[]>([]);
  private readonly filtro = signal<EstadoDeCandidatura | null>(null);
  private readonly texto = signal('');
  private readonly ordenActual = signal<Orden | null>(null);

  readonly candidaturas = this.todas.asReadonly();
  readonly filtroActivo = this.filtro.asReadonly();
  readonly busqueda = this.texto.asReadonly();
  readonly orden = this.ordenActual.asReadonly();
  /** null mientras no se pueda editar. Con datos, la ficha ofrece el boton. */
  readonly opcionesDeEdicion = this.opciones.asReadonly();
  readonly eliminadas = this.papelera.asReadonly();

  /**
   * Las que se estan viendo ahora mismo: filtradas por estado, por texto y en
   * el orden elegido.
   *
   * Filtrar no descarta nada: las caducadas dejan de estorbar sin borrarse, y
   * siguen contando en el recuento.
   */
  readonly visibles = computed(() => {
    const estado = this.filtro();
    const texto = normalizar(this.texto().trim());
    const orden = this.ordenActual();

    let lista = estado === null ? this.todas() : this.todas().filter((una) => una.estado === estado);

    if (texto) {
      lista = lista.filter((una) =>
        [una.oferta.empresa, una.oferta.puesto, una.oferta.ubicacion ?? ''].some((campo) =>
          normalizar(campo).includes(texto),
        ),
      );
    }

    return [...lista].sort((a, b) => (orden === null ? masRecientePrimero(a, b) : this.comparar(a, b, orden)));
  });

  /**
   * Las marcadas que se estan viendo. Lo que el filtro o la busqueda esconden
   * deja de contar: eliminar "3 seleccionadas" no puede llevarse una cuarta
   * que no esta en pantalla.
   */
  readonly seleccionadas = computed<ReadonlySet<string>>(() => {
    const marcadas = this.marcadas();
    return new Set(this.visibles().filter((una) => marcadas.has(una.id)).map((una) => una.id));
  });

  /**
   * Cuantas hay en cada estado.
   *
   * No es un adorno del filtro: es lo que deja ver de un vistazo que un estado
   * tiene mas de las que deberia, que es como se nota que el seguimiento se ha
   * quedado atras. Por eso no cambia al buscar: cuenta todas.
   */
  readonly recuentoPorEstado = computed(() => {
    const recuento: Partial<Record<EstadoDeCandidatura, number>> = {};
    for (const una of this.todas()) {
      recuento[una.estado] = (recuento[una.estado] ?? 0) + 1;
    }
    return recuento;
  });

  /** La candidatura con ese id, o undefined si no esta cargada. */
  buscarPorId(id: string): Candidatura | undefined {
    return this.todas().find((una) => una.id === id);
  }

  /**
   * La de encima y la de debajo entre las que se estan viendo, para recorrerlas
   * desde la ficha sin volver a la tabla. En los extremos no da la vuelta: saltar
   * de la ultima a la primera despista sobre donde se esta.
   */
  vecinosDe(id: string): { anterior?: string; siguiente?: string } {
    const lista = this.visibles();
    const posicion = lista.findIndex((una) => una.id === id);
    if (posicion === -1) {
      return { anterior: undefined, siguiente: undefined };
    }
    return { anterior: lista[posicion - 1]?.id, siguiente: lista[posicion + 1]?.id };
  }

  /** Marca o desmarca una. Con tramo, todas las de en medio quedan como esta. */
  alternarSeleccion(id: string, tramo = false): void {
    const visibles = this.visibles().map((una) => una.id);
    const marcar = !this.seleccionadas().has(id);
    const desde = this.ultimaMarcada ? visibles.indexOf(this.ultimaMarcada) : -1;
    const hasta = visibles.indexOf(id);
    const ids = tramo && desde >= 0 && hasta >= 0 ? visibles.slice(Math.min(desde, hasta), Math.max(desde, hasta) + 1) : [id];
    this.marcadas.update((actual) => {
      const nuevas = new Set(this.seleccionadas());
      for (const una of ids) {
        if (marcar) {
          nuevas.add(una);
        } else {
          nuevas.delete(una);
        }
      }
      return actual === nuevas ? actual : nuevas;
    });
    this.ultimaMarcada = id;
  }

  /** Todas las que se ven, o ninguna. */
  marcarTodas(marcar: boolean): void {
    this.marcadas.set(marcar ? new Set(this.visibles().map((una) => una.id)) : new Set());
  }

  /**
   * A la papelera de Notion. Solo salen de la tabla las que de verdad fueron:
   * si Notion falla con alguna, sigue a la vista.
   */
  async eliminar(ids: string[]): Promise<string[]> {
    const editor = this.editorObligatorio();
    const hechas = new Set(await editor.eliminar(ids));
    const cuando = new Date().toISOString();
    const salen = this.todas().filter((una) => hechas.has(una.id));
    this.todas.update((todas) => todas.filter((una) => !hechas.has(una.id)));
    this.papelera.update((p) => [...salen.map((candidatura) => ({ cuando, candidatura })), ...p]);
    this.marcadas.update((m) => new Set([...m].filter((id) => !hechas.has(id))));
    return [...hechas];
  }

  async restaurar(ids: string[]): Promise<string[]> {
    const editor = this.editorObligatorio();
    const vuelven = new Set(await editor.restaurar(ids));
    const devueltas = this.papelera().filter((e) => vuelven.has(e.candidatura.id)).map((e) => e.candidatura);
    this.papelera.update((p) => p.filter((e) => !vuelven.has(e.candidatura.id)));
    this.todas.update((todas) => [...todas, ...devueltas.filter((d) => !todas.some((una) => una.id === d.id))]);
    return [...vuelven];
  }

  /**
   * Cambia el estado de varias de una vez. Devuelve como estaban las que
   * cambiaron, que es justo lo que hace falta para deshacerlo.
   */
  async cambiarEstado(ids: string[], estado: EstadoDeCandidatura): Promise<{ id: string; estado: EstadoDeCandidatura }[]> {
    const antes = this.todas()
      .filter((una) => ids.includes(una.id) && una.estado !== estado)
      .map((una) => ({ id: una.id, estado: una.estado }));
    const cambiadas: typeof antes = [];
    for (const una of antes) {
      await this.editorObligatorio().guardar(una.id, { estado });
      cambiadas.push(una);
      this.todas.update((todas) => todas.map((t) => (t.id === una.id ? { ...t, estado } : t)));
    }
    return cambiadas;
  }

  /** Para deshacer un cambio de estado en bloque: cada una vuelve al suyo. */
  async devolverEstados(antes: { id: string; estado: EstadoDeCandidatura }[]): Promise<void> {
    for (const una of antes) {
      await this.editorObligatorio().guardar(una.id, { estado: una.estado });
      this.todas.update((todas) => todas.map((t) => (t.id === una.id ? { ...t, estado: una.estado } : t)));
    }
  }

  private editorObligatorio(): EditorDeCandidaturas {
    if (!this.editor) {
      throw new Error('No se puede editar desde aqui');
    }
    return this.editor;
  }

  /** Pasar null quita el filtro y vuelve a enseñarlas todas. */
  filtrarPor(estado: EstadoDeCandidatura | null): void {
    this.filtro.set(estado);
  }

  buscar(texto: string): void {
    this.texto.set(texto);
  }

  /**
   * Como en una hoja de calculo: ascendente, descendente y vuelta al orden por
   * defecto (la mas reciente arriba). Cambiar de columna empieza en ascendente.
   */
  ordenarPor(columna: ColumnaOrdenable): void {
    const actual = this.ordenActual();
    if (actual?.columna !== columna) {
      this.ordenActual.set({ columna, sentido: 'asc' });
    } else if (actual.sentido === 'asc') {
      this.ordenActual.set({ columna, sentido: 'desc' });
    } else {
      this.ordenActual.set(null);
    }
  }

  /**
   * Va como tarea pendiente de Angular: asi "la aplicacion esta estable" quiere
   * decir de verdad que los datos ya llegaron, y no solo que no queda nada
   * pintandose.
   */
  async cargar(): Promise<void> {
    await this.tareas.run(async () => {
      const [candidaturas, opciones, eliminadas] = await Promise.all([
        this.repositorio.listar(),
        this.editor?.opciones() ?? null,
        this.editor?.eliminadas() ?? [],
      ]);
      this.todas.set(candidaturas);
      this.opciones.set(opciones ? { ...opciones, ...OPCIONES_FIJAS } : null);
      this.papelera.set(
        eliminadas.flatMap(({ cuando, registro }) => {
          const candidatura = candidaturaDesdeRegistro(registro);
          return candidatura ? [{ cuando, candidatura }] : [];
        }),
      );
    });
  }

  /**
   * Guarda en la fuente y, solo si la fuente lo acepta, lo pone en la tabla.
   * Al reves, un fallo dejaria en pantalla un dato que en Notion no esta.
   */
  async guardarCambios(id: string, cambios: CambiosDeCandidatura): Promise<void> {
    if (!this.editor) {
      throw new Error('No se puede editar desde aqui');
    }
    await this.editor.guardar(id, cambios);
    this.todas.update((todas) => todas.map((una) => (una.id === id ? aplicarCambios(una, cambios) : una)));
  }

  /**
   * El estado se ordena por el avance del proceso, que es lo util; el resto,
   * alfabeticamente en espanol. Los huecos van al final en los dos sentidos:
   * una columna vacia arriba no dice nada.
   */
  private comparar(a: Candidatura, b: Candidatura, { columna, sentido }: Orden): number {
    const signo = sentido === 'asc' ? 1 : -1;
    if (columna === 'estado') {
      return signo * (ESTADOS.indexOf(a.estado) - ESTADOS.indexOf(b.estado));
    }
    const va = valorDe(a, columna);
    const vb = valorDe(b, columna);
    if (!va || !vb) {
      return va ? -1 : vb ? 1 : 0;
    }
    return signo * COMPARADOR.compare(va, vb);
  }
}
