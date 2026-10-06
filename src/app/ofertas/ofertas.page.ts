import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Accion, accionesPara, EnlacesDeAccion } from './acciones';
import { Candidatura, EstadoDeCandidatura, ESTADOS } from './dominio';
import { CandidaturasStore, ColumnaOrdenable } from './candidaturas.store';
import { CambiosDeCandidatura } from './edicion';
import { Columna, COLUMNAS, valorDeCelda } from './columnas';
import { EtiquetaEstado } from './etiqueta-estado';
import { FichaCandidatura } from './ficha-candidatura';
import { FuenteDeAcciones } from './fuente-de-acciones';
import { PreferenciasDeColumnas } from './preferencias-de-columnas';
import { SelectorDeColumnas } from './selector-de-columnas';

/** Cabe "Aprobar" y "Descartar" en una linea. */
const ANCHO_ACCIONES = 210;

@Component({
  selector: 'app-ofertas',
  imports: [RouterLink, FichaCandidatura, EtiquetaEstado, SelectorDeColumnas],
  templateUrl: './ofertas.page.html',
  styleUrl: './ofertas.page.css',
  host: { '(document:keydown.escape)': 'cerrar()' },
})
export class OfertasPage implements OnInit {
  /**
   * La que se ve en el panel lateral, de ?ficha= en la direccion. En la URL y
   * no en una signal suelta: se puede enlazar, y Atras del navegador lo cierra.
   */
  readonly ficha = input<string>();

  protected readonly store = inject(CandidaturasStore);
  private readonly router = inject(Router);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly abierta = computed(() => {
    const id = this.ficha();
    return id ? this.store.buscarPorId(id) : undefined;
  });

  protected readonly vecinos = computed(() => {
    const id = this.ficha();
    return id ? this.store.vecinosDe(id) : {};
  });
  private readonly fuenteDeAcciones = inject(FuenteDeAcciones);
  /** null mientras no hay enlaces, y siempre en la demo publica. */
  protected readonly enlaces = signal<EnlacesDeAccion | null>(null);
  protected readonly anchoAcciones = ANCHO_ACCIONES;
  protected readonly estados = ESTADOS;
  private readonly preferencias = inject(PreferenciasDeColumnas);

  /**
   * Las columnas elegidas, siempre en el orden del catalogo: una que se añade
   * aparece en su sitio, no al final. Cada una con su ancho, y la tabla tan
   * ancha como sumen: si no cabe, scroll horizontal en vez de aplastarlas.
   */
  protected readonly columnas = computed(() => COLUMNAS.filter((c) => this.preferencias.visibles().has(c.clave)));
  private readonly anchoColumnas = computed(() => this.columnas().reduce((suma, c) => suma + c.ancho, 0));
  protected readonly hayEstado = computed(() => this.columnas().some((c) => c.clave === 'estado'));

  constructor() {
    // Al abrirse, el foco entra en el panel para que el teclado siga ahi. Solo
    // al abrirse: al pasar a la siguiente, el foco se queda en el boton.
    let estabaAbierto = false;
    afterRenderEffect(() => {
      const panel = this.panel();
      if (panel && !estabaAbierto) {
        panel.nativeElement.focus();
      }
      estabaAbierto = !!panel;
    });
  }

  ngOnInit(): void {
    void this.store.cargar();
    void this.fuenteDeAcciones.enlaces().then((enlaces) => this.enlaces.set(enlaces));
  }

  protected anchoTotal(): number {
    return this.anchoColumnas() + (this.conAcciones() ? ANCHO_ACCIONES : 0);
  }

  /** La columna de acciones va pegada a la de estado: sin estado a la vista, no sale. */
  protected conAcciones(): boolean {
    return !!this.enlaces() && this.hayEstado();
  }

  protected acciones(una: Candidatura): Accion[] {
    return accionesPara(una, this.enlaces());
  }

  /** Cambiar de ficha sustituye la entrada del historial: Atras cierra el panel, no recorre las vistas. */
  protected irA(id: string | undefined): void {
    if (id) {
      void this.router.navigate([], { queryParams: { ficha: id }, replaceUrl: true });
    }
  }

  protected cerrar(): void {
    if (this.ficha()) {
      void this.router.navigate([], { queryParams: {} });
    }
  }

  /** Lo que la ficha llama al guardar. Funcion flecha para no perder el this. */
  protected readonly guardar = (id: string, cambios: CambiosDeCandidatura) => this.store.guardarCambios(id, cambios);

  protected filtrarPor(estado: EstadoDeCandidatura | null): void {
    this.store.filtrarPor(estado);
  }

  protected buscar(evento: Event): void {
    this.store.buscar((evento.target as HTMLInputElement).value);
  }

  protected ordenarPor(columna: ColumnaOrdenable): void {
    this.store.ordenarPor(columna);
  }

  /** Lo que anuncia el lector de pantalla en cada cabecera. */
  protected ariaSort(columna: ColumnaOrdenable): 'ascending' | 'descending' | 'none' {
    const orden = this.store.orden();
    if (orden?.columna !== columna) {
      return 'none';
    }
    return orden.sentido === 'asc' ? 'ascending' : 'descending';
  }

  protected celda(una: Candidatura, columna: Columna): string {
    return valorDeCelda(una, columna);
  }

  protected enlaceDe(una: Candidatura, columna: Columna): string | null {
    const valor = columna.leer(una);
    return typeof valor === 'string' && /^https?:\/\//.test(valor) ? valor : null;
  }
}
