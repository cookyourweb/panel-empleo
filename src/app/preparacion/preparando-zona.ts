import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';

import { Preparacion } from './preparacion';

/** Delay before explaining why the wait can be long (cold server start). */
export const AVISO_DE_ARRANQUE_TRAS_MS = 3_000;

const MOVIMIENTO_REDUCIDO = '(prefers-reduced-motion: reduce)';

/**
 * Friendly notice shown while the user's area is being prepared. The live
 * region is always in the DOM and only its content changes: a role="status"
 * that is born already filled is not reliably announced. It never takes focus.
 */
@Component({
  selector: 'app-preparando-zona',
  templateUrl: './preparando-zona.html',
  styleUrl: './preparando-zona.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreparandoZona {
  protected readonly visible = inject(Preparacion).visible;
  protected readonly conAvisoDeArranque = signal(false);
  protected readonly movimientoReducido = signal(false);

  constructor() {
    this.seguirMovimientoReducido();

    effect((alLimpiar) => {
      if (!this.visible()) return;
      const plazo = setTimeout(() => this.conAvisoDeArranque.set(true), AVISO_DE_ARRANQUE_TRAS_MS);
      alLimpiar(() => {
        clearTimeout(plazo);
        this.conAvisoDeArranque.set(false);
      });
    });
  }

  private seguirMovimientoReducido(): void {
    if (typeof matchMedia !== 'function') return;
    const consulta = matchMedia(MOVIMIENTO_REDUCIDO);
    this.movimientoReducido.set(consulta.matches);
    const alCambiar = (evento: MediaQueryListEvent) => this.movimientoReducido.set(evento.matches);
    consulta.addEventListener('change', alCambiar);
    inject(DestroyRef).onDestroy(() => consulta.removeEventListener('change', alCambiar));
  }
}
