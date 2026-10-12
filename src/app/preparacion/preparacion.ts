import { computed, inject, Injectable, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
} from '@angular/router';

/**
 * How long a wait must last before the user is told about it. Shorter waits
 * (most navigations) finish first, so the notice never flashes on and off.
 */
export const DEMORA_DE_AVISO_MS = 300;

/**
 * Knows whether the app is making the user wait: a pending router navigation
 * (guards included) or any piece of work wrapped in `mientras`. It only reports
 * the wait once it outlasts `DEMORA_DE_AVISO_MS`. It never decides anything
 * about the wait itself: timeouts and fallbacks stay where they already live.
 */
@Injectable({ providedIn: 'root' })
export class Preparacion {
  private readonly navegaciones = signal(0);
  private readonly trabajos = signal(0);
  private readonly ocupada = computed(() => this.navegaciones() > 0 || this.trabajos() > 0);
  private readonly _visible = signal(false);
  private plazo: ReturnType<typeof setTimeout> | null = null;

  /** True once a wait has lasted longer than the grace period. */
  readonly visible = this._visible.asReadonly();

  constructor() {
    inject(Router).events.subscribe((evento) => {
      if (evento instanceof NavigationStart) this.navegaciones.update((n) => n + 1);
      else if (
        evento instanceof NavigationEnd ||
        evento instanceof NavigationCancel ||
        evento instanceof NavigationError ||
        evento instanceof NavigationSkipped
      ) {
        // Every start has exactly one of these, including the old navigation
        // that a newer one supersedes, so the count only reaches zero at rest.
        this.navegaciones.update((n) => Math.max(0, n - 1));
      } else return;
      this.actualizar();
    });
  }

  /** Reports a wait for as long as `trabajo` is pending, whatever its outcome. */
  async mientras<T>(trabajo: Promise<T>): Promise<T> {
    this.trabajos.update((n) => n + 1);
    this.actualizar();
    try {
      return await trabajo;
    } finally {
      this.trabajos.update((n) => n - 1);
      this.actualizar();
    }
  }

  private actualizar(): void {
    if (!this.ocupada()) {
      this.limpiarPlazo();
      this._visible.set(false);
      return;
    }
    if (this._visible() || this.plazo !== null) return;
    this.plazo = setTimeout(() => {
      this.plazo = null;
      if (this.ocupada()) this._visible.set(true);
    }, DEMORA_DE_AVISO_MS);
  }

  private limpiarPlazo(): void {
    if (this.plazo === null) return;
    clearTimeout(this.plazo);
    this.plazo = null;
  }
}
