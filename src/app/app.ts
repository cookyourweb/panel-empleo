import { Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';

import { ALTA_ACTIVA } from './configuracion';
import { CabeceraDeMarca } from './marca/cabecera-de-marca';
import { PieDeMarca } from './marca/pie-de-marca';
import { PreparandoZona } from './preparacion/preparando-zona';
import { Sesion } from './sesion/sesion';

@Component({
  imports: [CabeceraDeMarca, PieDeMarca, PreparandoZona, RouterLink, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly sesion = inject(Sesion);
  protected readonly altaActiva = inject(ALTA_ACTIVA);
  /**
   * She has a profile but the server no longer holds a current consent to keep her CV
   * (say, she only gave the v1 text). Unknown never counts as "no consent".
   */
  protected readonly faltaConsentimiento = computed(
    () => this.altaActiva && this.sesion.perfil()?.tienePerfil === true && this.sesion.consentimientos()?.almacenarCv === false,
  );
  private readonly principal = viewChild.required<ElementRef<HTMLElement>>('principal');

  constructor() {
    // Al cambiar de pantalla el foco se queda en el enlace pulsado, que ya no
    // existe: se lleva al contenido nuevo (WCAG 2.4.3). La primera navegacion
    // es la carga de la pagina y ahi el foco ya esta bien.
    inject(Router)
      .events.pipe(
        filter((evento) => evento instanceof NavigationEnd),
        skip(1),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.principal().nativeElement.focus());
  }
}
