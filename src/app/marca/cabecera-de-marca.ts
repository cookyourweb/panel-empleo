import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, LOCALE_ID, signal, viewChild } from '@angular/core';

import { EnlaceDelMenu, enlacesDeLaAgencia, raizDeLaPlataforma, URL_DE_LA_AGENCIA, URL_DE_WHATSAPP } from './enlaces-de-marca';

/** A partir de cuantos pixeles de scroll la cabecera pasa a su estado compacto. */
const SCROLL_PARA_COMPACTAR = 50;

/**
 * Cabecera de CookYourWeb AI, igual que la de www.cookyourwebai.es.
 *
 * Es presentacional: no conoce sesion ni rutas de la app. Los enlaces de la
 * agencia son absolutos (es otro dominio) y "Empleo Tech", la propia
 * plataforma, es la pagina actual. Debajo de 1024 px el menu es un panel que
 * se opera entero con teclado: Escape lo cierra y devuelve el foco al boton.
 */
@Component({
  selector: 'app-cabecera-de-marca',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './cabecera-de-marca.css',
  templateUrl: './cabecera-de-marca.html',
  host: { '(document:keydown.escape)': 'alEscape()' },
})
export class CabeceraDeMarca {
  protected readonly agencia = URL_DE_LA_AGENCIA;
  protected readonly whatsapp = URL_DE_WHATSAPP;
  protected readonly etiquetaDelMenu = $localize`:Nombre accesible del menu de navegacion principal@@cabecera.menu.principal:Principal`;
  protected readonly etiquetaDeWhatsapp = $localize`:Nombre accesible del enlace a WhatsApp@@cabecera.whatsapp.etiqueta:Contactar por WhatsApp`;
  protected readonly etiquetaDeAbrir = $localize`:Nombre accesible del boton que abre el menu movil@@cabecera.menu.abrir:Abrir menú de navegación`;
  protected readonly etiquetaDeCerrar = $localize`:Nombre accesible del boton que cierra el menu movil@@cabecera.menu.cerrar:Cerrar menú de navegación`;

  protected readonly enlaces: readonly EnlaceDelMenu[] = [
    ...enlacesDeLaAgencia().map((enlace) => ({ ...enlace, actual: false })),
    // El nombre de la plataforma no se traduce.
    { clave: 'empleo', etiqueta: 'Empleo Tech', url: raizDeLaPlataforma(inject(LOCALE_ID)), actual: true },
  ];

  protected readonly desplazada = signal(false);
  protected readonly menuAbierto = signal(false);
  private readonly alternar = viewChild.required<ElementRef<HTMLButtonElement>>('alternar');

  constructor() {
    const ventana = inject(DOCUMENT).defaultView;
    if (!ventana) return;
    const alDesplazar = () => this.desplazada.set(ventana.scrollY > SCROLL_PARA_COMPACTAR);
    alDesplazar();
    ventana.addEventListener('scroll', alDesplazar, { passive: true });
    inject(DestroyRef).onDestroy(() => ventana.removeEventListener('scroll', alDesplazar));
  }

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  protected alEscape(): void {
    if (!this.menuAbierto()) return;
    this.cerrarMenu();
    this.alternar().nativeElement.focus();
  }
}
