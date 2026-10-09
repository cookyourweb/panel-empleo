import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Perfil, Propuesta } from './dominio';
import { FormularioManual } from './formulario-manual';

/**
 * El paso de revision: lo que el CV propone, con la frase que lo respalda, para
 * aceptar, editar o descartar. Nada se guarda hasta confirmar (REQ-5.5).
 */
@Component({
  selector: 'app-revision-de-campos',
  imports: [FormularioManual],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './alta.css',
  template: `
    <section class="paso" aria-labelledby="revision-titulo">
      <h2 id="revision-titulo" tabindex="-1" data-titulo-de-paso i18n="Titulo del paso de revision@@alta.revision.titulo">
        Revisa lo que hemos leído
      </h2>
      <p i18n="Explicacion del paso de revision@@alta.revision.texto">
        Te proponemos estos datos junto a la frase de tu CV que los respalda. Acepta, corrige o descarta cada uno, y
        responde a las preguntas de salario y modalidad, que nunca rellenamos por ti.
      </p>
      <app-formulario-manual
        [propuestas]="propuestas()"
        [enRevision]="true"
        [errorDeGuardado]="errorDeGuardado()"
        (guardar)="guardar.emit($event)"
      />
    </section>
  `,
})
export class RevisionDeCampos {
  readonly propuestas = input<Propuesta[]>([]);
  readonly errorDeGuardado = input(false);
  readonly guardar = output<Perfil>();
}
