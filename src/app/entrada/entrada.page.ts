import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ProveedorDeIdentidad } from '../sesion/proveedor-de-identidad';
import { RESULTADO_DE_ENTRADA, ResultadoDeEntrada, Sesion } from '../sesion/sesion';
import { Servidor } from '../sesion/servidor';

const MENSAJES = {
  [RESULTADO_DE_ENTRADA.dentro]: null,
  [RESULTADO_DE_ENTRADA.rechazada]: 'No se pudo comprobar tu cuenta',
  [RESULTADO_DE_ENTRADA.noInvitada]: 'Tu cuenta no está invitada',
  [RESULTADO_DE_ENTRADA.sinServidor]: 'El servidor no puede comprobar la identidad ahora',
} as const satisfies Record<ResultadoDeEntrada, string | null>;

const SIN_GOOGLE =
  'No se pudo cargar el acceso con Google. Revisa la conexión o desactiva el bloqueador y recarga la página.';

const AVISO_TRAS_MS = 3_000;
const RENDICION_TRAS_MS = 90_000;

/** Solo rutas internas: evita que un enlace de entrada nos mande a otro sitio. */
function rutaInterna(volver: string | null): string {
  const esInterna =
    volver !== null && volver.startsWith('/') && !volver.startsWith('//') && !volver.includes('\\');
  return esInterna ? volver : '/';
}

@Component({
  selector: 'app-entrada',
  templateUrl: './entrada.page.html',
  styleUrl: './entrada.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntradaPage {
  private readonly proveedor = inject(ProveedorDeIdentidad);
  private readonly sesion = inject(Sesion);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly servidor = inject(Servidor);
  private readonly destruccion = inject(DestroyRef);
  private readonly anfitrion = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly acceso = viewChild.required<ElementRef<HTMLElement>>('acceso');

  protected readonly error = signal<string | null>(null);
  protected readonly despertando = signal(false);
  protected readonly sinRespuesta = signal(false);

  private plazos: ReturnType<typeof setTimeout>[] = [];
  private intento = 0;
  private cancelacion = new AbortController();

  constructor() {
    this.destruccion.onDestroy(() => this.cancelar());
    afterNextRender(() => void this.comprobar());
  }

  protected reintentar(): void {
    // El boton va a desaparecer: sin esto el foco cae al body (WCAG 2.4.3).
    this.anfitrion.nativeElement.closest('main')?.focus();
    void this.comprobar();
  }

  private cancelar(): void {
    this.intento++;
    this.cancelacion.abort();
    this.plazos.forEach(clearTimeout);
    this.plazos = [];
  }

  /** Render duerme el servidor: avisamos si tarda y damos salida si no llega. */
  private async comprobar(): Promise<void> {
    this.cancelar();
    const actual = this.intento;
    this.sinRespuesta.set(false);
    this.error.set(null);
    this.plazos = [
      setTimeout(() => this.despertando.set(true), AVISO_TRAS_MS),
      setTimeout(() => this.rendirse(), RENDICION_TRAS_MS),
    ];

    const despierto = await this.servidor.comprobar();
    if (actual !== this.intento) return;

    if (!despierto) {
      this.rendirse();
      return;
    }
    this.cancelar();
    this.despertando.set(false);
    this.cancelacion = new AbortController();
    const { signal } = this.cancelacion;
    try {
      await this.proveedor.preparar(
        this.acceso().nativeElement,
        (credencial) => void this.entrar(credencial),
        signal,
      );
    } catch {
      // Si la pantalla ya no existe o hay un intento nuevo, nadie espera este error.
      if (!signal.aborted) this.error.set(SIN_GOOGLE);
    }
  }

  private rendirse(): void {
    this.cancelar();
    this.despertando.set(false);
    this.sinRespuesta.set(true);
  }

  private async entrar(credencial: string): Promise<void> {
    this.error.set(null);
    const resultado = await this.sesion.entrar(credencial);
    if (resultado === RESULTADO_DE_ENTRADA.dentro) {
      await this.router.navigateByUrl(rutaInterna(this.ruta.snapshot.queryParamMap.get('volver')));
      return;
    }
    if (resultado === RESULTADO_DE_ENTRADA.noInvitada) this.proveedor.olvidar();
    this.error.set(MENSAJES[resultado]);
  }
}
