import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { MotivoDeSubida } from './dominio';

const RECHAZOS: Readonly<Record<MotivoDeSubida, string>> = {
  tamano: $localize`:Rechazo de la subida, archivo grande@@alta.subida.rechazo.tamano:El archivo es demasiado grande. El máximo son 2 MB.`,
  tipo: $localize`:Rechazo de la subida, tipo de archivo@@alta.subida.rechazo.tipo:Solo se aceptan archivos PDF o DOCX.`,
  ilegible: $localize`:Rechazo de la subida, sin texto legible@@alta.subida.rechazo.ilegible:No hemos podido leer texto en el archivo. Prueba con otro o rellena el perfil a mano.`,
  sinConsentimiento: $localize`:Rechazo de la subida, falta consentimiento@@alta.subida.rechazo.sinConsentimiento:Falta tu consentimiento. Vuelve a empezar para darlo.`,
  servidor: $localize`:Rechazo de la subida, fallo del servidor@@alta.subida.rechazo.servidor:El servidor no ha podido recibir el archivo ahora. Prueba de nuevo o rellena el perfil a mano.`,
};

/**
 * Elegir el CV. Lo de "PDF o DOCX, 2 MB" es una pista (accept y texto), no una
 * barrera: quien decide si el archivo vale es el servidor.
 */
@Component({
  selector: 'app-subida-de-cv',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './alta.css',
  template: `
    <section class="paso" aria-labelledby="subida-titulo">
      <h2 id="subida-titulo" tabindex="-1" data-titulo-de-paso i18n="Titulo del paso de subida@@alta.subida.titulo">Sube tu CV</h2>

      <label class="campo" for="subida-archivo" i18n="Etiqueta del campo de archivo@@alta.subida.etiqueta">
        Tu CV
      </label>
      <input
        id="subida-archivo"
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        aria-describedby="subida-pista"
        (change)="elegir($event)"
      />
      <p id="subida-pista" class="pista" i18n="Pista del formato aceptado@@alta.subida.pista">
        PDF o DOCX, hasta 2 MB.
      </p>

      @if (mensaje(); as texto) {
        <p class="error" role="alert">{{ texto }}</p>
      }

      <div class="acciones">
        <button
          type="button"
          data-a-mano
          (click)="aMano.emit()"
          i18n="Boton para rellenar el perfil sin subir CV@@alta.subida.aMano"
        >
          Prefiero rellenar el perfil a mano
        </button>
      </div>
    </section>
  `,
})
export class SubidaDeCv {
  readonly rechazo = input<MotivoDeSubida | null>(null);
  readonly elegido = output<File>();
  readonly aMano = output<void>();

  protected readonly mensaje = computed(() => {
    const motivo = this.rechazo();
    return motivo === null ? null : RECHAZOS[motivo];
  });

  protected elegir(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (archivo) {
      this.elegido.emit(archivo);
    }
  }
}
