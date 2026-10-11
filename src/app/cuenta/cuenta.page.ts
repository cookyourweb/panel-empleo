import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';

import { TIPOS_DE_CONSENTIMIENTO, TipoDeConsentimiento } from '../alta/dominio';
import { IDIOMAS } from '../idioma/idiomas';
import { Sesion } from '../sesion/sesion';
import { CvGuardado, IdiomaDeCv, RepositorioDeCuenta } from './repositorio-de-cuenta';

type AccionPendiente =
  | { readonly clase: 'cv'; readonly idioma: IdiomaDeCv }
  | { readonly clase: 'consentimiento'; readonly tipo: TipoDeConsentimiento };

/** Lo que el panel puede retirar, en el orden en que se pinta. */
const CONSENTIMIENTOS: readonly { readonly tipo: TipoDeConsentimiento; readonly descripcion: string }[] = [
  {
    tipo: TIPOS_DE_CONSENTIMIENTO.almacenarCv,
    descripcion: $localize`:Descripcion del consentimiento de guardar el CV@@cuenta.consentimientos.almacenar:Guardar mi CV cifrado`,
  },
  {
    tipo: TIPOS_DE_CONSENTIMIENTO.enviarCvAIa,
    descripcion: $localize`:Descripcion del consentimiento de enviar el CV a la IA@@cuenta.consentimientos.ia:Enviar mi CV a Anthropic y Groq (Estados Unidos) para extraer mi perfil y para generar mis CV y cartas cuando lo pida`,
  },
];

/**
 * Tu cuenta: borrar un CV, retirar un consentimiento o borrar la cuenta entera.
 *
 * Nada se hace de un clic ni con los dialogos del navegador: cada accion abre
 * una confirmacion dentro de la propia pagina que explica el efecto, se opera
 * con teclado (Escape cancela) y su resultado se anuncia en una region educada.
 * Lo que se muestra es lo que el servidor confirmo: si falla, no cambia nada.
 */
@Component({
  selector: 'app-cuenta',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../alta/alta.css', './cuenta.css'],
  templateUrl: './cuenta.page.html',
})
export class CuentaPage {
  private readonly repositorio = inject(RepositorioDeCuenta);
  private readonly sesion = inject(Sesion);
  private readonly router = inject(Router);
  private readonly anfitrion = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly confirmando = signal(false);
  protected readonly borrando = signal(false);
  protected readonly error = signal(false);
  /** The server deleted everything; the session stays open until the user continues. */
  protected readonly borrada = signal(false);

  protected readonly consentimientos = CONSENTIMIENTOS;
  private readonly injector = inject(Injector);

  /** null mientras no se ha leido; [] es "no tiene ningun CV", que es otra cosa. */
  private readonly _cvs = signal<readonly CvGuardado[] | null>(null);
  protected readonly cvs = computed(() => this._cvs() ?? []);
  protected readonly cargandoCvs = signal(true);
  protected readonly errorDeCvs = signal(false);
  /** Lo retirado en esta visita: no hay forma de leer el estado de un consentimiento, solo de retirarlo. */
  protected readonly retirados = signal<ReadonlySet<TipoDeConsentimiento>>(new Set());

  protected readonly accion = signal<AccionPendiente | null>(null);
  protected readonly accionCv = computed(() => {
    const accion = this.accion();
    return accion?.clase === 'cv' ? accion.idioma : null;
  });
  protected readonly accionConsentimiento = computed(() => {
    const accion = this.accion();
    return accion?.clase === 'consentimiento' ? accion.tipo : null;
  });
  protected readonly ocupado = signal(false);
  protected readonly errorDeAccion = signal(false);
  /** Texto de la region educada: lo ultimo que el servidor confirmo. */
  protected readonly resultado = signal('');

  /** El boton que abrio la confirmacion, para devolverle el foco al cancelar. */
  private disparador: HTMLElement | null = null;
  private primerPaso = true;

  constructor() {
    void this.cargarCvs();
    afterRenderEffect(() => {
      this.confirmando();
      this.borrada();
      if (this.primerPaso) {
        this.primerPaso = false;
        return;
      }
      this.anfitrion.nativeElement.querySelector<HTMLElement>('[data-titulo-de-paso]')?.focus();
    });
  }

  protected async cargarCvs(): Promise<void> {
    this.cargandoCvs.set(true);
    this.errorDeCvs.set(false);
    try {
      this._cvs.set(await this.repositorio.listarCvs());
    } catch {
      // No se pudo leer: no se afirma que no haya CV.
      this._cvs.set(null);
      this.errorDeCvs.set(true);
    } finally {
      this.cargandoCvs.set(false);
    }
  }

  protected nombreDeIdioma(idioma: IdiomaDeCv): string {
    return IDIOMAS.find((i) => i.codigo === idioma)?.nombre ?? idioma;
  }

  protected tituloDeBorrarCv(idioma: IdiomaDeCv): string {
    const nombre = this.nombreDeIdioma(idioma);
    return $localize`:Titulo de la confirmacion de borrar un CV@@cuenta.cv.confirmar.titulo:¿Borrar tu CV en ${nombre}:nombre:?`;
  }

  protected textosDeRetirar(tipo: TipoDeConsentimiento): { titulo: string; efecto: string; confirmar: string } {
    return tipo === TIPOS_DE_CONSENTIMIENTO.almacenarCv
      ? {
          titulo: $localize`:Titulo de la confirmacion de retirar el consentimiento de guardar el CV@@cuenta.consentimientos.almacenar.confirmar.titulo:¿Retirar el consentimiento para guardar tu CV?`,
          efecto: $localize`:Efecto de retirar el consentimiento de guardar el CV@@cuenta.consentimientos.almacenar.confirmar.texto:Si lo retiras, borramos tu CV guardado en todos los idiomas y no podremos generar CV adaptados a partir del tuyo. Tu perfil se queda como está.`,
          confirmar: $localize`:Boton que confirma retirar el consentimiento de guardar el CV@@cuenta.consentimientos.almacenar.confirmar.si:Sí, retirar y borrar mi CV`,
        }
      : {
          titulo: $localize`:Titulo de la confirmacion de retirar el consentimiento de usar la IA@@cuenta.consentimientos.ia.confirmar.titulo:¿Retirar el consentimiento para usar IA con tu CV?`,
          efecto: $localize`:Efecto de retirar el consentimiento de usar la IA@@cuenta.consentimientos.ia.confirmar.texto:Si lo retiras, dejamos de enviar tu CV a Anthropic y Groq, así que no podremos extraer tu perfil ni generar CV y cartas adaptados. Tu perfil se queda como está.`,
          confirmar: $localize`:Boton que confirma retirar el consentimiento de usar la IA@@cuenta.consentimientos.ia.confirmar.si:Sí, retirar consentimiento`,
        };
  }

  protected pedirBorrarCv(idioma: IdiomaDeCv, evento: Event): void {
    this.abrirAccion({ clase: 'cv', idioma }, evento);
  }

  protected pedirRetirar(tipo: TipoDeConsentimiento, evento: Event): void {
    this.abrirAccion({ clase: 'consentimiento', tipo }, evento);
  }

  private abrirAccion(accion: AccionPendiente, evento: Event): void {
    if (this.ocupado()) return;
    this.disparador = evento.currentTarget as HTMLElement;
    this.errorDeAccion.set(false);
    this.resultado.set('');
    this.accion.set(accion);
    this.enfocar('[data-titulo-confirmacion]');
  }

  protected cancelarAccion(): void {
    if (this.ocupado()) return;
    const disparador = this.disparador;
    this.disparador = null;
    this.errorDeAccion.set(false);
    this.accion.set(null);
    afterNextRender(() => (disparador?.isConnected ? disparador.focus() : undefined), { injector: this.injector });
  }

  /** Solo cambia lo que el servidor confirmo; si falla, la pantalla sigue diciendo la verdad de antes. */
  protected async confirmarAccion(): Promise<void> {
    const accion = this.accion();
    if (!accion || this.ocupado()) return;
    this.ocupado.set(true);
    this.errorDeAccion.set(false);
    try {
      if (accion.clase === 'cv') {
        await this.repositorio.borrarCv(accion.idioma);
        this._cvs.update((lista) => lista?.filter((cv) => cv.idioma !== accion.idioma) ?? lista);
        const nombre = this.nombreDeIdioma(accion.idioma);
        this.resultado.set($localize`:Resultado de borrar un CV@@cuenta.cv.borrado:Hemos borrado tu CV en ${nombre}:nombre:.`);
      } else {
        await this.repositorio.retirarConsentimiento(accion.tipo);
        this.retirados.update((actuales) => new Set(actuales).add(accion.tipo));
        if (accion.tipo === TIPOS_DE_CONSENTIMIENTO.almacenarCv) {
          // El servidor borra los CV al retirar este consentimiento: se vuelve a leer, no se supone.
          await this.cargarCvs();
          this.resultado.set($localize`:Resultado de retirar el consentimiento de guardar el CV@@cuenta.consentimientos.almacenar.hecho:Has retirado el consentimiento para guardar tu CV y hemos borrado tus CV.`);
        } else {
          this.resultado.set($localize`:Resultado de retirar el consentimiento de usar la IA@@cuenta.consentimientos.ia.hecho:Has retirado el consentimiento para usar IA con tu CV. Tu perfil se queda como está.`);
        }
      }
    } catch {
      this.errorDeAccion.set(true);
      this.ocupado.set(false);
      return;
    }
    this.ocupado.set(false);
    this.accion.set(null);
    this.disparador = null;
    // El boton que se pulso puede haber desaparecido: el foco pasa al titulo de su seccion.
    this.enfocar(accion.clase === 'cv' ? '[data-titulo-seccion="cv"]' : '[data-titulo-seccion="consentimientos"]');
  }

  private enfocar(selector: string): void {
    afterNextRender(() => this.anfitrion.nativeElement.querySelector<HTMLElement>(selector)?.focus(), {
      injector: this.injector,
    });
  }

  protected pedirConfirmacion(): void {
    this.confirmando.set(true);
  }

  protected cancelar(): void {
    this.error.set(false);
    this.confirmando.set(false);
  }

  protected async confirmar(): Promise<void> {
    if (this.borrando()) return;
    this.borrando.set(true);
    this.error.set(false);
    try {
      await this.repositorio.borrar();
    } catch {
      this.error.set(true);
      this.borrando.set(false);
      return;
    }
    // Show what was deleted before signing out: leaving at once would hide it.
    this.borrando.set(false);
    this.borrada.set(true);
  }

  protected async salir(): Promise<void> {
    this.sesion.cerrar();
    await this.router.navigateByUrl('/');
  }
}
