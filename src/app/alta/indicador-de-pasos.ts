import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Where the user is in the sign-up: a plain "Step 2 of 4: ..." sentence plus the
 * list of steps with aria-current on the current one. The sentence is text, so
 * the position never depends on colour alone.
 */
@Component({
  selector: 'app-indicador-de-pasos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './alta.css',
  template: `
    <nav class="indicador" [attr.aria-label]="nombre">
      <p class="indicador__actual" data-paso-actual>{{ frase() }}</p>
      <ol class="indicador__lista">
        @for (etiqueta of etiquetas(); track $index) {
          <li
            class="indicador__paso"
            [attr.aria-current]="$index + 1 === actual() ? 'step' : null"
            [attr.data-completado]="$index + 1 < actual() ? '' : null"
          >
            {{ etiqueta }}
          </li>
        }
      </ol>
    </nav>
  `,
})
export class IndicadorDePasos {
  /** The step labels, in order. */
  readonly etiquetas = input.required<readonly string[]>();
  /** The current step, counting from 1. */
  readonly actual = input.required<number>();

  protected readonly nombre = $localize`:Nombre accesible del indicador de pasos@@alta.pasos.nombre:Progreso de tu alta`;

  protected readonly frase = computed(() => {
    const numero = this.actual();
    const total = this.etiquetas().length;
    const etiqueta = this.etiquetas()[numero - 1] ?? '';
    return $localize`:Frase que dice en que paso esta la usuaria@@alta.pasos.frase:Paso ${numero}:numero: de ${total}:total:: ${etiqueta}:etiqueta:`;
  });
}
