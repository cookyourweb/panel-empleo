import { formatNumber } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, LOCALE_ID } from '@angular/core';

const KB = 1024;
const MB = KB * KB;

/** El archivo que Vero ha elegido: nombre y tamaño, nunca su contenido. */
@Component({
  selector: 'app-resumen-de-archivo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../alta/alta.css',
  template: `
    <span class="archivo__etiqueta" i18n="Etiqueta del archivo elegido@@alta.subida.archivoElegido">Archivo elegido:</span>
    <strong class="archivo__nombre">{{ nombre() }}</strong>
    <span class="archivo__tamano">({{ tamanoLegible() }})</span>
  `,
})
export class ResumenDeArchivo {
  readonly nombre = input.required<string>();
  readonly tamano = input.required<number>();

  private readonly idioma = inject(LOCALE_ID);

  protected readonly tamanoLegible = computed(() => {
    const bytes = this.tamano();
    return bytes >= MB
      ? `${formatNumber(bytes / MB, this.idioma, '1.0-1')} MB`
      : `${formatNumber(Math.max(1, Math.round(bytes / KB)), this.idioma, '1.0-0')} KB`;
  });
}
