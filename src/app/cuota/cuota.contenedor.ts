import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';

import { Cuota, Interes } from './cuota';
import { FuenteDeCuota } from './fuente-de-cuota';
import { MedidorDeCuota } from './medidor-de-cuota';

/**
 * Lee la cuota y lleva el aviso de interes; MedidorDeCuota solo la pinta. Sin
 * cuota (dueña, cuentas exentas, demo, o un fallo) no pinta nada, pero la
 * region educada ya esta en pantalla: un lector de pantalla solo anuncia lo
 * que cambia dentro de una region que existia antes del cambio.
 *
 * La generacion es asincrona (los botones abren webhooks de n8n), asi que el
 * panel nunca ve el 429. La cuota se refresca desde /yo al volver a esta
 * pestaña, que es cuando acaba de pasar por n8n.
 */
@Component({
  selector: 'app-cuota',
  imports: [MedidorDeCuota],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:visibilitychange)': 'alVolver()' },
  template: `
    <div aria-live="polite">
      @if (cuota(); as c) {
        <app-medidor-de-cuota
          [cuota]="c"
          [enviando]="enviando()"
          [enviado]="enviado()"
          [fallo]="fallo()"
          (avisar)="avisar($event)"
        />
      }
    </div>
  `,
})
export class ContenedorDeCuota implements OnInit {
  private readonly fuente = inject(FuenteDeCuota);

  protected readonly cuota = signal<Cuota | null>(null);
  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly fallo = signal(false);

  ngOnInit(): void {
    void this.fuente
      .actual()
      .then((cuota) => this.cuota.set(cuota))
      .catch(() => this.cuota.set(null));
  }

  protected alVolver(): void {
    if (document.visibilityState !== 'visible') return;
    void this.fuente
      .refrescar()
      .then((cuota) => this.cuota.set(cuota))
      .catch(() => undefined);
  }

  protected async avisar(interes: Interes): Promise<void> {
    if (this.enviando()) return;
    this.enviando.set(true);
    this.fallo.set(false);
    try {
      await this.fuente.registrarInteres(interes);
      this.enviado.set(true);
    } catch {
      this.fallo.set(true);
    } finally {
      this.enviando.set(false);
    }
  }
}
