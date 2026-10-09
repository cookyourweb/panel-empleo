import { DecimalPipe } from '@angular/common';
import {
  afterRenderEffect,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  LOCALE_ID,
  OnInit,
  PendingTasks,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Accion, accionesPara, descripcionDeAccion, EnlacesDeAccion } from './acciones';
import { Candidatura, EstadoDeCandidatura, ESTADOS } from './dominio';
import { FuenteDeEncaje, ResumenDeEncaje } from './encaje';
import { CandidaturasStore, ColumnaOrdenable } from './candidaturas.store';
import { CambiosDeCandidatura } from './edicion';
import { Columna, COLUMNAS, valorDeCelda } from './columnas';
import { EtiquetaEstado } from './etiqueta-estado';
import { BarraDeSeleccion } from './barra-de-seleccion';
import { ConfirmarEliminar } from './confirmar-eliminar';
import { FichaCandidatura } from './ficha-candidatura';
import { ListaDeEliminadas } from './lista-de-eliminadas';
import { nombreDeEstado } from './nombre-de-estado';
import { plural } from './plural';
import { FuenteDeAcciones } from './fuente-de-acciones';
import { PreferenciasDeColumnas } from './preferencias-de-columnas';
import { SelectorDeColumnas } from './selector-de-columnas';

/** Cabe "Aprobar" y "Descartar" en una linea. */
const ANCHO_ACCIONES = 210;

/** La columna del check, a la izquierda de la empresa. */
const ANCHO_CHECK = 40;

/** Lo que dura un aviso: mas si se puede deshacer, para que de tiempo. */
const DURACION_AVISO = 4500;
const DURACION_AVISO_CON_DESHACER = 10000;

/** El filtro de alcanzables: apagado, esperando al servidor, listo, o roto (y entonces no se ofrece). */
const ENCAJES = {
  inactivo: 'inactivo',
  cargando: 'cargando',
  listo: 'listo',
  error: 'error',
} as const;

type EstadoDeEncajes = (typeof ENCAJES)[keyof typeof ENCAJES];

interface Aviso {
  texto: string;
  deshacer?: () => Promise<unknown>;
}

@Component({
  selector: 'app-ofertas',
  imports: [
    DecimalPipe,
    RouterLink,
    FichaCandidatura,
    EtiquetaEstado,
    SelectorDeColumnas,
    BarraDeSeleccion,
    ConfirmarEliminar,
    ListaDeEliminadas,
  ],
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
  private readonly locale = inject(LOCALE_ID);
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
  private readonly fuenteDeEncaje = inject(FuenteDeEncaje);
  private readonly tareas = inject(PendingTasks);

  protected readonly soloAlcanzables = signal(false);
  protected readonly estadoDeEncajes = signal<EstadoDeEncajes>(ENCAJES.inactivo);
  /** Lo que ya se sabe de cada oferta: no se vuelve a preguntar por ella. */
  private readonly resumenes = signal<Readonly<Record<string, ResumenDeEncaje>>>({});

  protected readonly ayudaDeAlcanzables = computed(() => {
    const estado = this.estadoDeEncajes();
    if (estado === ENCAJES.error) {
      return $localize`:Explicacion de por que el filtro de alcanzables no esta disponible@@ofertas.alcanzables.error:No hemos podido consultar tu encaje, así que este filtro no está disponible. La tabla sigue completa; recarga la página para volver a intentarlo.`;
    }
    if (estado === ENCAJES.cargando) {
      return $localize`:Aviso mientras se consulta el encaje de la lista@@ofertas.alcanzables.cargando:Consultando tu encaje…`;
    }
    if (estado !== ENCAJES.listo) {
      return '';
    }
    const ids = this.store.idsDeOfertasFiltradas();
    const alcanzables = ids.filter((id) => this.resumenes()[id]?.alcanzable).length;
    if (alcanzables === 0) {
      return $localize`:Aviso de que ninguna de las ofertas que se ven es alcanzable@@ofertas.alcanzables.ninguna:Ninguna de las ofertas que ves es alcanzable ahora mismo. Las que no mencionan tecnologías que comparar tampoco aparecen: no hay nada que medir.`;
    }
    const total = ids.length;
    return $localize`:Cuantas de las ofertas que se ven son alcanzables@@ofertas.alcanzables.cuantas:Alcanzables entre las que ves: ${alcanzables}:alcanzables: de ${total}:total:. Las que no mencionan tecnologías que comparar no aparecen.`;
  });
  /** null mientras no hay enlaces, y siempre en la demo publica. */
  protected readonly enlaces = signal<EnlacesDeAccion | null>(null);
  protected readonly anchoAcciones = ANCHO_ACCIONES;
  protected readonly anchoCheck = ANCHO_CHECK;

  /** Sin puente no hay nada que hacer con una seleccion, asi que no se ofrece. */
  protected readonly conSeleccion = computed(() => this.store.opcionesDeEdicion() !== null);
  protected readonly todasMarcadas = computed(
    () => this.store.visibles().length > 0 && this.store.seleccionadas().size === this.store.visibles().length,
  );
  protected readonly algunaMarcada = computed(() => this.store.seleccionadas().size > 0 && !this.todasMarcadas());
  protected readonly confirmando = signal<Candidatura[] | null>(null);
  protected readonly viendoEliminadas = signal(false);
  protected readonly aviso = signal<Aviso | null>(null);
  private temporizador?: ReturnType<typeof setTimeout>;
  protected readonly estados = ESTADOS;
  protected readonly nombre = nombreDeEstado;
  protected readonly descripcionDeAccion = descripcionDeAccion;
  protected readonly sinNotion = $localize`:Explica por que una fila no se puede marcar@@ofertas.sinNotion:Aún no está en Notion`;
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
    // Pregunta por lo que falta de la lista visible, en una sola llamada (la
    // fuente la parte en lotes). Apagar el filtro no tira lo ya sabido.
    effect(() => {
      if (!this.soloAlcanzables()) {
        return;
      }
      const ids = this.store.idsDeOfertasFiltradas();
      untracked(() => {
        const faltan = ids.filter((id) => !(id in this.resumenes()));
        if (faltan.length) {
          void this.consultarEncajes(faltan);
        } else if (this.estadoDeEncajes() !== ENCAJES.error) {
          this.estadoDeEncajes.set(ENCAJES.listo);
        }
      });
    });

    // Con el filtro en marcha y datos, la tabla se queda con las alcanzables.
    effect(() => {
      const conRestriccion = this.soloAlcanzables() && this.estadoDeEncajes() === ENCAJES.listo;
      const resumenes = this.resumenes();
      this.store.restringirAOfertas(
        conRestriccion ? new Set(Object.keys(resumenes).filter((id) => resumenes[id].alcanzable)) : null,
      );
    });

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
    return (
      this.anchoColumnas() + (this.conAcciones() ? ANCHO_ACCIONES : 0) + (this.conSeleccion() ? ANCHO_CHECK : 0)
    );
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

  protected alternarAlcanzables(evento: Event): void {
    const marcada = (evento.target as HTMLInputElement).checked;
    this.soloAlcanzables.set(marcada);
    if (!marcada) {
      this.estadoDeEncajes.update((estado) => (estado === ENCAJES.error ? estado : ENCAJES.inactivo));
    }
  }

  /**
   * Una sola peticion para lo que falta. Si falla, el filtro se apaga y se
   * explica: nunca una tabla vacia sin motivo. Lo que el servidor no devuelve
   * (ofertas que no son de quien mira) cuenta como no alcanzable, y asi no se
   * vuelve a preguntar por ello en bucle.
   */
  private async consultarEncajes(ids: string[]): Promise<void> {
    this.estadoDeEncajes.set(ENCAJES.cargando);
    await this.tareas.run(async () => {
      try {
        const recibidos = await this.fuenteDeEncaje.resumen(ids);
        const nuevos = Object.fromEntries(
          ids.map((id): [string, ResumenDeEncaje] => [id, recibidos[id] ?? { alcanzable: false, cobertura: 0 }]),
        );
        this.resumenes.update((antes) => ({ ...antes, ...nuevos }));
        this.estadoDeEncajes.set(this.soloAlcanzables() ? ENCAJES.listo : ENCAJES.inactivo);
      } catch {
        this.soloAlcanzables.set(false);
        this.estadoDeEncajes.set(ENCAJES.error);
      }
    });
  }

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
    return valorDeCelda(una, columna, this.locale);
  }

  protected enlaceDe(una: Candidatura, columna: Columna): string | null {
    const valor = columna.leer(una);
    return typeof valor === 'string' && /^https?:\/\//.test(valor) ? valor : null;
  }

  /** Nombres accesibles que llevan la empresa, para distinguir filas que se parecen. */
  protected descripcionDeSeleccionar(empresa: string): string {
    return $localize`:Nombre accesible de la casilla de una fila@@ofertas.seleccionar.descripcion:Seleccionar ${empresa}:empresa:`;
  }

  protected descripcionDeEnlace(columna: string, empresa: string): string {
    return $localize`:Nombre accesible de un enlace de la tabla@@ofertas.enlace.descripcion:${columna}:columna: de ${empresa}:empresa:, en una pestaña nueva`;
  }

  // ---------- Seleccion y acciones en bloque ----------

  /** Con Shift marca el tramo desde la ultima, como en la maqueta. */
  protected alternarSeleccion(id: string, evento: MouseEvent): void {
    this.store.alternarSeleccion(id, evento.shiftKey);
  }

  protected marcarTodas(evento: Event): void {
    this.store.marcarTodas((evento.target as HTMLInputElement).checked);
  }

  protected pedirEliminar(): void {
    const ids = this.store.seleccionadas();
    this.confirmando.set(this.store.visibles().filter((una) => ids.has(una.id)));
  }

  protected async eliminar(): Promise<void> {
    const ids = (this.confirmando() ?? []).map((una) => una.id);
    this.confirmando.set(null);
    await this.intentar(async () => {
      const hechas = await this.store.eliminar(ids);
      if (hechas.includes(this.ficha() ?? '')) {
        this.cerrar();
      }
      const fallidas = ids.length - hechas.length;
      this.avisar({
        texto:
          plural(
            hechas.length,
            $localize`:Una oferta eliminada, detras del numero@@ofertas.aviso.eliminada:oferta eliminada`,
            $localize`:Varias ofertas eliminadas, detras del numero@@ofertas.aviso.eliminadas:ofertas eliminadas`,
          ) +
          (fallidas
            ? `; ${plural(
                fallidas,
                $localize`:Una oferta que no se pudo eliminar, detras del numero@@ofertas.aviso.noEliminada:no se pudo eliminar`,
                $localize`:Varias ofertas que no se pudieron eliminar, detras del numero@@ofertas.aviso.noEliminadas:no se pudieron eliminar`,
              )}`
            : ''),
        deshacer: hechas.length ? () => this.restaurar(hechas) : undefined,
      });
    });
  }

  protected async restaurar(ids: string[]): Promise<void> {
    await this.intentar(async () => {
      const vueltas = await this.store.restaurar(ids);
      this.avisar({
        texto: plural(
          vueltas.length,
          $localize`:Una oferta restaurada, detras del numero@@ofertas.aviso.restaurada:oferta restaurada`,
          $localize`:Varias ofertas restauradas, detras del numero@@ofertas.aviso.restauradas:ofertas restauradas`,
        ),
      });
    });
  }

  protected async cambiarEstado(estado: EstadoDeCandidatura): Promise<void> {
    const ids = [...this.store.seleccionadas()];
    await this.intentar(async () => {
      const antes = await this.store.cambiarEstado(ids, estado);
      if (!antes.length) {
        const nuevo = nombreDeEstado(estado);
        this.avisar({
          texto: $localize`:Aviso de que ningun cambio de estado hizo falta@@ofertas.aviso.sinCambios:Ninguna cambia: ya estaban en ${nuevo}:estado:.`,
        });
        return;
      }
      this.avisar({
        texto:
          antes.length === 1
            ? $localize`:Aviso de que una ficha cambio de estado@@ofertas.aviso.cambioUna:${antes.length}:cuantas: ficha pasa a ${nombreDeEstado(estado)}:estado:.`
            : $localize`:Aviso de que varias fichas cambiaron de estado@@ofertas.aviso.cambioVarias:${antes.length}:cuantas: fichas pasan a ${nombreDeEstado(estado)}:estado:.`,
        deshacer: async () => {
          await this.store.devolverEstados(antes);
          this.avisar({ texto: $localize`:Aviso tras deshacer un cambio de estado@@ofertas.aviso.deshecho:Cambio deshecho.` });
        },
      });
    });
  }

  protected async deshacer(): Promise<void> {
    const deshacer = this.aviso()?.deshacer;
    this.aviso.set(null);
    if (deshacer) {
      await this.intentar(deshacer);
    }
  }

  protected pausarAviso(): void {
    clearTimeout(this.temporizador);
  }

  protected reanudarAviso(): void {
    this.temporizador = setTimeout(() => this.aviso.set(null), DURACION_AVISO);
  }

  private avisar(aviso: Aviso): void {
    clearTimeout(this.temporizador);
    this.aviso.set(aviso);
    this.temporizador = setTimeout(
      () => this.aviso.set(null),
      aviso.deshacer ? DURACION_AVISO_CON_DESHACER : DURACION_AVISO,
    );
  }

  /** Un fallo de Notion se dice en el aviso; la tabla se queda como estaba. */
  private async intentar(accion: () => Promise<unknown>): Promise<void> {
    try {
      await accion();
    } catch (e) {
      const motivo = e instanceof Error ? e.message : $localize`:Motivo cuando el error no trae mensaje@@ofertas.aviso.errorDesconocido:error desconocido`;
      this.avisar({ texto: $localize`:Aviso de que una accion fallo, con el motivo@@ofertas.aviso.fallo:No se pudo: ${motivo}:motivo:` });
    }
  }
}
