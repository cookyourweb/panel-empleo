import { ChangeDetectionStrategy, Component, inject, LOCALE_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { IDIOMAS } from './idiomas';

/**
 * Un enlace por idioma, a la misma pantalla bajo el prefijo del otro.
 *
 * Son enlaces normales y no routerLink: cada idioma es una build distinta, asi
 * que cambiar de idioma es cargar otra pagina, no navegar dentro de esta.
 */
@Component({
  selector: 'app-selector-de-idioma',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './selector-de-idioma.css',
  template: `
    <nav aria-label="Idioma" i18n-aria-label="Etiqueta accesible de la navegación entre idiomas@@selectorIdioma.etiqueta">
      <ul>
        @for (idioma of idiomas; track idioma.codigo) {
          <li>
            <a
              [href]="'/' + idioma.codigo + ruta()"
              [attr.lang]="idioma.codigo"
              [attr.hreflang]="idioma.codigo"
              [attr.aria-current]="idioma.codigo === actual ? 'true' : null"
              >{{ idioma.nombre }}</a
            >
          </li>
        }
      </ul>
    </nav>
  `,
})
export class SelectorDeIdioma {
  private readonly router = inject(Router);

  protected readonly idiomas = IDIOMAS;
  /** Solo el idioma: en-GB es inglés aunque la región no esté en la lista. */
  protected readonly actual = new Intl.Locale(inject(LOCALE_ID)).language;
  /** Camino, consulta y fragmento tal como estan ahora: lo que hay que conservar al cambiar. */
  protected readonly ruta = signal(this.router.url);

  constructor() {
    this.router.events
      .pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.ruta.set(this.router.url));
  }
}
