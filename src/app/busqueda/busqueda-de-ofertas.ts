import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { BusquedaProgresoService } from './busqueda-progreso.service';
import { EstadoDeBusqueda, EventoDeBusqueda, ResumenDeBusqueda } from './evento-de-busqueda';
import { Sesion } from '../sesion/sesion';

@Component({
  selector: 'app-busqueda-de-ofertas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './busqueda-de-ofertas.html',
  styleUrl: './busqueda-de-ofertas.css',
})
export class BusquedaDeOfertas {
  private readonly servicio = inject(BusquedaProgresoService);
  private readonly sesion = inject(Sesion);
  private readonly destroyRef = inject(DestroyRef);
  private suscripcion: Subscription | null = null;

  readonly etapa = signal<EstadoDeBusqueda>('idle');
  readonly detalle = signal<string | null>(null);
  readonly resumen = signal<ResumenDeBusqueda | null>(null);
  readonly error = signal<string | null>(null);
  readonly enCurso = signal(false);

  iniciar(): void {
    if (this.enCurso()) return;
    const usuaria = this.sesion.usuaria();
    if (usuaria === null) {
      this.error.set('sin sesión');
      this.etapa.set('error');
      return;
    }
    this.etapa.set('idle');
    this.detalle.set(null);
    this.resumen.set(null);
    this.error.set(null);
    this.enCurso.set(true);

    this.suscripcion?.unsubscribe();
    this.suscripcion = this.servicio
      .buscar({ usuarioId: usuaria.sub, topN: 5 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (evento: EventoDeBusqueda) => {
          this.etapa.set(evento.stage);
          this.detalle.set(evento.detail ?? null);
          if (evento.summary) this.resumen.set(evento.summary);
          if (evento.stage === 'done' || evento.stage === 'error') {
            this.enCurso.set(false);
            if (evento.stage === 'error') this.error.set(evento.detail ?? 'error desconocido');
          }
        },
        error: (e: unknown) => {
          this.etapa.set('error');
          this.error.set(e instanceof Error ? e.message : 'conexión interrumpida');
          this.enCurso.set(false);
        },
      });
  }

  cancelar(): void {
    this.suscripcion?.unsubscribe();
    this.suscripcion = null;
    this.enCurso.set(false);
    this.etapa.set('idle');
  }
}