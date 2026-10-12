import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ListaDeEspera } from '../espera/lista-de-espera';
import { URL_DE_PRIVACIDAD, urlDePrivacidadDeLaLista } from '../marca/enlaces-de-marca';

/** Public front door: says what the product is and signs people up to the waiting list. */
@Component({
  imports: [RouterLink],
  selector: 'app-bienvenida',
  templateUrl: './bienvenida.page.html',
  styleUrl: './bienvenida.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BienvenidaPage {
  private readonly lista = inject(ListaDeEspera);

  protected readonly urlDePrivacidad = urlDePrivacidadDeLaLista(inject(URL_DE_PRIVACIDAD));
  protected readonly nombre = signal('');
  protected readonly email = signal('');
  protected readonly aceptada = signal(false);
  protected readonly enviando = signal(false);
  protected readonly apuntada = signal(false);
  protected readonly fallo = signal(false);

  private readonly exito = viewChild<ElementRef<HTMLElement>>('exito');

  constructor() {
    // The message replaces the form, so focus would be lost: move it to the message.
    effect(() => this.exito()?.nativeElement.focus());
  }

  protected async enviar(): Promise<void> {
    const nombre = this.nombre().trim();
    const email = this.email().trim();
    if (this.enviando() || !nombre || !email || !this.aceptada()) {
      return;
    }
    this.enviando.set(true);
    this.fallo.set(false);
    try {
      await this.lista.apuntar({ nombre, email });
      this.apuntada.set(true);
    } catch {
      this.fallo.set(true);
    } finally {
      this.enviando.set(false);
    }
  }
}
