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
  WritableSignal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';

import { MotivoDeSubida, SubidaRechazada, TIPOS_DE_CONSENTIMIENTO, TipoDeConsentimiento, VERSION_DE_CONSENTIMIENTO } from '../alta/dominio';
import { SubidaDeCv } from '../compartido/subida-de-cv';
import { TextoDeConsentimiento } from '../compartido/texto-de-consentimiento';
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

const REGISTRANDO = $localize`:Aviso de que se registra el consentimiento@@alta.anuncio.registrando:Registrando tu consentimiento…`;
const SUBIENDO = $localize`:Aviso de que se esta subiendo el CV@@alta.extrayendo.subiendo:Subiendo tu CV…`;
const GUARDADO = $localize`:Resultado de subir un CV desde la cuenta@@cuenta.subir.hecho:Hemos guardado tu CV cifrado. Tu perfil se queda como está.`;

/**
 * Tu cuenta: subir o borrar un CV, retirar un consentimiento o borrar la cuenta entera.
 *
 * Nada se hace de un clic ni con los dialogos del navegador: cada accion abre
 * una confirmacion dentro de la propia pagina que explica el efecto, se opera
 * con teclado (Escape cancela) y su resultado se anuncia en una region educada.
 * Lo que se muestra es lo que el servidor confirmo: si falla, no cambia nada.
 */
@Component({
  selector: 'app-cuenta',
  imports: [NgTemplateOutlet, SubidaDeCv, TextoDeConsentimiento],
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

  /** Que consentimiento se esta registrando desde su boton, o null. */
  protected readonly dandoConsentimiento = signal<TipoDeConsentimiento | null>(null);
  protected readonly errorAlConsentir = signal(false);

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
  // Subir un CV desde aqui (sin pasar por /alta, que con perfil esta cerrada).
  protected readonly marcaGuardar = signal(false);
  protected readonly marcaIa = signal(false);
  protected readonly marcaMayor = signal(false);
  protected readonly subiendo = signal(false);
  protected readonly errorDeConsentimiento = signal(false);
  protected readonly rechazoDeSubida = signal<MotivoDeSubida | null>(null);
  protected readonly faltaConsentimiento = signal(false);
  /** El servidor dijo que falta un consentimiento vigente aunque haya CV (p. ej. uno dado con el texto v1). */
  private readonly consentimientoForzado = signal(false);

  /** Sin ningun CV guardado (ella retiro el consentimiento o los borro) se vuelve a pedir; con CV ya hay consentimiento vigente. */
  protected readonly necesitaConsentimiento = computed(
    () => this.cvs().length === 0 || this.consentimientoForzado() || this.sesion.consentimientos()?.almacenarCv === false,
  );
  protected readonly puedeElegirArchivo = computed(
    () => !this.necesitaConsentimiento() || (this.marcaGuardar() && this.marcaMayor()),
  );

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

  protected alternar(marca: WritableSignal<boolean>, evento: Event): void {
    marca.set((evento.target as HTMLInputElement).checked);
  }

  /** Consiente si hace falta, sube el CV y vuelve a leer la lista. No lee el perfil. */
  protected async subirCv(archivo: File): Promise<void> {
    if (this.subiendo()) return;
    this.subiendo.set(true);
    this.errorDeConsentimiento.set(false);
    this.rechazoDeSubida.set(null);
    this.faltaConsentimiento.set(false);
    this.resultado.set('');
    const consentidos: TipoDeConsentimiento[] = [];
    try {
      if (this.necesitaConsentimiento()) {
        this.resultado.set(REGISTRANDO);
        try {
          await this.repositorio.consentir(TIPOS_DE_CONSENTIMIENTO.almacenarCv, VERSION_DE_CONSENTIMIENTO);
          consentidos.push(TIPOS_DE_CONSENTIMIENTO.almacenarCv);
          if (this.marcaIa()) {
            await this.repositorio.consentir(TIPOS_DE_CONSENTIMIENTO.enviarCvAIa, VERSION_DE_CONSENTIMIENTO);
            consentidos.push(TIPOS_DE_CONSENTIMIENTO.enviarCvAIa);
          }
        } catch {
          this.resultado.set('');
          this.errorDeConsentimiento.set(true);
          return;
        } finally {
          // Lo que el servidor si registro ya no esta retirado, aunque lo siguiente falle.
          this.retirados.update((actuales) => new Set([...actuales].filter((tipo) => !consentidos.includes(tipo))));
        }
      }
      this.resultado.set(SUBIENDO);
      try {
        await this.repositorio.subirCv(archivo);
      } catch (error) {
        const motivo = error instanceof SubidaRechazada ? error.motivo : 'servidor';
        this.resultado.set('');
        if (motivo === 'sinConsentimiento') {
          this.consentimientoForzado.set(true);
          this.faltaConsentimiento.set(true);
        } else {
          this.rechazoDeSubida.set(motivo);
        }
        return;
      }
      this.consentimientoForzado.set(false);
      this.marcaGuardar.set(false);
      this.marcaIa.set(false);
      this.marcaMayor.set(false);
      await this.cargarCvs();
      await this.refrescarSesion();
      this.resultado.set(GUARDADO);
      this.enfocar('[data-titulo-seccion="cv"]');
    } finally {
      this.subiendo.set(false);
    }
  }

  /** Vigente segun /yo; si /yo no lo dijo, se supone vigente salvo que ella lo retirara en esta visita. */
  protected vigente(tipo: TipoDeConsentimiento): boolean {
    const real = this.sesion.consentimientos();
    if (real === null) return !this.retirados().has(tipo);
    return tipo === TIPOS_DE_CONSENTIMIENTO.almacenarCv ? real.almacenarCv : real.enviarCvAIa;
  }

  /** Dar consentimiento solo se ofrece cuando se sabe que no esta vigente. */
  protected puedeDarConsentimiento(tipo: TipoDeConsentimiento): boolean {
    return !this.vigente(tipo) && (this.sesion.consentimientos() !== null || this.retirados().has(tipo));
  }

  protected async darConsentimiento(tipo: TipoDeConsentimiento): Promise<void> {
    if (this.ocupado() || this.dandoConsentimiento() !== null) return;
    this.dandoConsentimiento.set(tipo);
    this.errorAlConsentir.set(false);
    this.resultado.set(REGISTRANDO);
    try {
      await this.repositorio.consentir(tipo, VERSION_DE_CONSENTIMIENTO);
    } catch {
      this.resultado.set('');
      this.errorAlConsentir.set(true);
      this.dandoConsentimiento.set(null);
      return;
    }
    this.retirados.update((actuales) => new Set([...actuales].filter((t) => t !== tipo)));
    this.consentimientoForzado.set(false);
    await this.refrescarSesion();
    this.resultado.set(
      tipo === TIPOS_DE_CONSENTIMIENTO.almacenarCv
        ? $localize`:Resultado de dar de nuevo el consentimiento de guardar el CV@@cuenta.consentimientos.almacenar.dado:Gracias, hemos registrado de nuevo tu consentimiento para guardar tu CV.`
        : $localize`:Resultado de dar de nuevo el consentimiento de usar la IA@@cuenta.consentimientos.ia.dado:Gracias, hemos registrado de nuevo tu consentimiento para usar IA con tu CV.`,
    );
    this.dandoConsentimiento.set(null);
    this.enfocar('[data-titulo-seccion="consentimientos"]');
  }

  /** Vuelve a leer /yo para que el aviso y los botones digan la verdad; si falla, no es un fallo del cambio. */
  private async refrescarSesion(): Promise<void> {
    try {
      await this.sesion.refrescar();
    } catch {
      // El cambio ya esta hecho en el servidor; /yo se leera en la siguiente ocasion.
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
        await this.refrescarSesion();
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
