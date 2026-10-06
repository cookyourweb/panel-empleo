import { computed, inject, Injectable, PendingTasks, signal } from '@angular/core';

import { Candidatura, EstadoDeCandidatura, ESTADOS } from './dominio';
import { aplicarCambios, CambiosDeCandidatura, OpcionesDeEdicion, OPCIONES_FIJAS } from './edicion';
import { EditorDeCandidaturas } from './editor-de-candidaturas';
import { RepositorioDeCandidaturas } from './repositorio-de-candidaturas';

/** Las columnas por las que se puede ordenar la tabla. */
export type ColumnaOrdenable =
  | 'empresa'
  | 'puesto'
  | 'estado'
  | 'modalidad'
  | 'ubicacion'
  | 'salario'
  | 'viaEnvio'
  | 'fechaEnvio'
  | 'fechaPublicacion';

export interface Orden {
  columna: ColumnaOrdenable;
  sentido: 'asc' | 'desc';
}

/** Minusculas y sin tildes: quien busca "malaga" tiene que encontrar "Málaga". */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** Unas columnas son de la candidatura (el seguimiento) y otras de la oferta. */
function valorDe(una: Candidatura, columna: ColumnaOrdenable): string {
  switch (columna) {
    case 'estado':
      return una.estado;
    case 'viaEnvio':
    case 'fechaEnvio':
      return una[columna] ?? '';
    default:
      return una.oferta[columna] ?? '';
  }
}

const COMPARADOR = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

@Injectable()
export class CandidaturasStore {
  private readonly repositorio = inject(RepositorioDeCandidaturas);
  /** Opcional: sin editor (tests, o una pantalla que solo lee) todo sigue igual. */
  private readonly editor = inject(EditorDeCandidaturas, { optional: true });
  private readonly opciones = signal<OpcionesDeEdicion | null>(null);
  private readonly tareas = inject(PendingTasks);
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

    return orden === null ? lista : [...lista].sort((a, b) => this.comparar(a, b, orden));
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

  /** Pasar null quita el filtro y vuelve a enseñarlas todas. */
  filtrarPor(estado: EstadoDeCandidatura | null): void {
    this.filtro.set(estado);
  }

  buscar(texto: string): void {
    this.texto.set(texto);
  }

  /**
   * Como en una hoja de calculo: ascendente, descendente y vuelta al orden de
   * la fuente. Cambiar de columna empieza siempre en ascendente.
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
      const [candidaturas, opciones] = await Promise.all([
        this.repositorio.listar(),
        this.editor?.opciones() ?? null,
      ]);
      this.todas.set(candidaturas);
      this.opciones.set(opciones ? { ...opciones, ...OPCIONES_FIJAS } : null);
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
