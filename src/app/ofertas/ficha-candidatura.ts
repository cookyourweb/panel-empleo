import { Component, computed, effect, inject, input, LOCALE_ID, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { Accion } from './acciones';
import { Bloque, Candidatura } from './dominio';
import {
  CAMPOS_EDITABLES,
  CambiosDeCandidatura,
  cambiosEntre,
  CampoEditable,
  OpcionesDeEdicion,
  valoresEditables,
} from './edicion';
import { EtiquetaEstado } from './etiqueta-estado';
import { agruparBloques, GrupoDeBloques, seccionesDeFicha } from './ficha-campos';

/**
 * Lo que se sabe de una candidatura, sin saber donde se pinta.
 *
 * La usan la pagina de detalle y el panel lateral de la tabla: si cada una
 * tuviera su copia, acabarian enseñando cosas distintas de la misma oferta.
 * Sigue la ficha de la maqueta aprobada: cabecera, tres grupos de campos y
 * el contenido de la pagina de Notion.
 */
@Component({
  selector: 'app-ficha-candidatura',
  imports: [EtiquetaEstado],
  templateUrl: './ficha-candidatura.html',
  styleUrl: './ficha-candidatura.css',
})
export class FichaCandidatura {
  readonly candidatura = input.required<Candidatura>();
  readonly acciones = input<Accion[]>([]);
  /** Para que quien la contiene pueda nombrarse con el titulo (aria-labelledby). */
  readonly idTitulo = input('titulo-ficha');

  /** Sin opciones no hay puente, y sin puente no se ofrece editar. */
  readonly opciones = input<OpcionesDeEdicion | null>(null);
  /** Quien la contiene decide donde se guarda: la ficha solo entrega los cambios. */
  readonly alGuardar = input<((id: string, cambios: CambiosDeCandidatura) => Promise<void>) | null>(null);

  protected readonly editable = computed(
    () => !!this.opciones() && !!this.alGuardar() && !this.candidatura().id.startsWith('local-'),
  );
  protected readonly editando = signal(false);
  /** Solo el id: que la misma ficha se refresque al guardar no cuenta como cambiar de ficha. */
  private readonly idActual = computed(() => this.candidatura().id);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly borrador = signal<CambiosDeCandidatura>({});

  /** Los campos editables por secciones, en el mismo orden que la lectura. */
  protected readonly gruposEditables = ['Cabecera', 'Oferta', 'Candidatura', 'Documentos'].map((seccion) => ({
    seccion,
    campos: CAMPOS_EDITABLES.filter((c) => c.seccion === seccion),
  }));

  constructor() {
    // Pasar a otra ficha (Anterior, Siguiente) sale de la edicion: un borrador
    // de una oferta no puede acabar guardado en otra.
    effect(() => {
      this.idActual();
      this.editando.set(false);
      this.error.set(null);
    });
  }

  private readonly locale = inject(LOCALE_ID);
  protected readonly ficha = computed(() => seccionesDeFicha(this.candidatura(), this.locale));
  protected readonly grupos = computed(() => agruparBloques(this.candidatura().cuerpo ?? []));

  /** La plantilla no estrecha el tipo en el @else de una lista. */
  protected comoBloque(grupo: GrupoDeBloques): Bloque {
    return grupo as Bloque;
  }

  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Angular no deja poner una direccion en un iframe sin decirle que es de
   * fiar. Solo llegan aqui las que monta vistaPreviaDeCv, nunca una de Notion.
   */
  protected incrustable(vistaPrevia: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(vistaPrevia);
  }

  protected editar(): void {
    this.borrador.set(valoresEditables(this.candidatura()));
    this.error.set(null);
    this.editando.set(true);
  }

  protected cancelar(): void {
    this.editando.set(false);
    this.error.set(null);
  }

  protected cambiar(clave: string, evento: Event): void {
    const elemento = evento.target as HTMLInputElement;
    const valor = elemento.type === 'checkbox' ? elemento.checked : elemento.value;
    this.borrador.update((b) => ({ ...b, [clave]: valor }));
  }

  /** Las opciones del desplegable, con el valor actual aunque Notion ya no lo tenga. */
  protected opcionesDe(campo: CampoEditable): string[] {
    const lista = this.opciones()?.[campo.clave] ?? [];
    const actual = this.borrador()[campo.clave];
    return typeof actual === 'string' && actual && !lista.includes(actual) ? [actual, ...lista] : lista;
  }

  protected texto(clave: string): string {
    const valor = this.borrador()[clave];
    return typeof valor === 'string' ? valor : '';
  }

  protected async guardar(): Promise<void> {
    const guardar = this.alGuardar();
    const cambios = cambiosEntre(valoresEditables(this.candidatura()), this.borrador());
    if (!guardar || !Object.keys(cambios).length) {
      this.editando.set(false);
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    try {
      await guardar(this.candidatura().id, cambios);
      this.editando.set(false);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      this.guardando.set(false);
    }
  }

  protected tipoDeEntrada(campo: CampoEditable): string {
    return { fecha: 'date', email: 'email', tel: 'tel', enlace: 'url' }[campo.tipo as string] ?? 'text';
  }

  protected sinEspacios(telefono: string): string {
    return telefono.replace(/\s+/g, '');
  }
}
