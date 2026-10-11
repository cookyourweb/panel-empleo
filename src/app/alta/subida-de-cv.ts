import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { MotivoDeSubida } from './dominio';
import { ResumenDeArchivo } from './resumen-de-archivo';

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
  imports: [ResumenDeArchivo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './alta.css',
  template: `
    <section class="paso" aria-labelledby="subida-titulo">
      <h2 id="subida-titulo" tabindex="-1" data-titulo-de-paso i18n="Titulo del paso de subida@@alta.subida.titulo">Sube tu CV</h2>

      <div class="subida">
        <!-- El input real sigue en el DOM, con su etiqueta: solo se oculta a la vista.
             La tarjeta y el boton lo abren con click(). -->
        <label class="solo-lectores" for="subida-archivo" i18n="Etiqueta del campo de archivo@@alta.subida.etiqueta">
          Tu CV
        </label>
        <input
          #entrada
          id="subida-archivo"
          class="solo-lectores"
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          aria-describedby="subida-pista"
          (change)="elegir($event)"
        />
        <!-- El teclado entra por el button de dentro; el click de la tarjeta es solo para el raton. -->
        <div
          class="zona"
          data-zona
          [attr.data-arrastrando]="arrastrando() ? '' : null"
          (click)="entrada.click()"
          (dragenter)="entrarArrastrando($event)"
          (dragover)="sobrevolar($event)"
          (dragleave)="salirArrastrando($event)"
          (drop)="soltar($event)"
        >
          <svg class="zona__icono" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="M12 6h17l9 9v27H12z" />
            <path d="M29 6v9h9" />
            <path d="M24 35V22m0 0-5 5m5-5 5 5" />
          </svg>
          <p class="zona__texto">
            @if (arrastrando()) {
              <ng-container i18n="Texto de la zona al arrastrar encima@@alta.subida.soltar">Suelta tu CV aquí</ng-container>
            } @else {
              <ng-container i18n="Texto de la zona de subida@@alta.subida.arrastra">Arrastra tu CV hasta aquí o elígelo desde tu dispositivo.</ng-container>
            }
          </p>
          <button type="button" class="boton-principal" data-elegir aria-describedby="subida-pista" i18n="Boton para elegir el CV@@alta.subida.elegir">
            Elegir mi CV
          </button>
          <p id="subida-pista" class="pista" i18n="Pista del formato aceptado@@alta.subida.pista">
            PDF o DOCX, hasta 2 MB
          </p>
        </div>
      </div>

      @if (archivo(); as elegido) {
        <p class="archivo" data-archivo>
          <app-resumen-de-archivo [nombre]="elegido.name" [tamano]="elegido.size" />
        </p>
      }

      @if (mensaje(); as texto) {
        <p class="error" role="alert">{{ texto }}</p>
      }

      <div class="acciones">
        <button
          type="button"
          class="enlace"
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

  protected readonly arrastrando = signal(false);
  protected readonly archivo = signal<File | null>(null);

  protected readonly mensaje = computed(() => {
    const motivo = this.rechazo();
    return motivo === null ? null : RECHAZOS[motivo];
  });

  protected elegir(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.[0];
    if (archivo) {
      this.emitir(archivo);
      // Sin vaciarlo, volver a elegir el mismo archivo tras un error no dispararia change.
      entrada.value = '';
    }
  }

  protected entrarArrastrando(evento: Event): void {
    evento.preventDefault();
    this.arrastrando.set(true);
  }

  protected sobrevolar(evento: Event): void {
    // Sin cancelar dragover el navegador no permite soltar.
    evento.preventDefault();
  }

  protected salirArrastrando(evento: Event): void {
    const zona = evento.currentTarget as HTMLElement;
    const hacia = (evento as DragEvent).relatedTarget;
    // Pasar por encima de un hijo de la tarjeta tambien dispara dragleave: eso no es salir.
    if (hacia instanceof Node && zona.contains(hacia)) return;
    this.arrastrando.set(false);
  }

  protected soltar(evento: Event): void {
    evento.preventDefault();
    this.arrastrando.set(false);
    const archivo = (evento as DragEvent).dataTransfer?.files?.[0];
    if (archivo) {
      this.emitir(archivo);
    }
  }

  private emitir(archivo: File): void {
    this.archivo.set(archivo);
    this.elegido.emit(archivo);
  }
}
