import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';

import { ALTA_ACTIVA } from './configuracion';
import { SelectorDeIdioma } from './idioma/selector-de-idioma';
import { CabeceraDeMarca } from './marca/cabecera-de-marca';
import { PieDeMarca } from './marca/pie-de-marca';
import { PreparandoZona } from './preparacion/preparando-zona';
import { Sesion } from './sesion/sesion';

@Component({
  imports: [CabeceraDeMarca, PieDeMarca, PreparandoZona, RouterLink, RouterOutlet, SelectorDeIdioma],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly titulo = signal($localize`:Nombre de la aplicacion, titulo de la cabecera@@app.titulo:Panel de empleo`);
  protected readonly sesion = inject(Sesion);
  protected readonly altaActiva = inject(ALTA_ACTIVA);
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
