import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Public front door: says what the product is and sends people to the waiting list. */
@Component({
  imports: [RouterLink],
  selector: 'app-bienvenida',
  templateUrl: './bienvenida.page.html',
  styleUrl: './bienvenida.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BienvenidaPage {
  // The form lives in Tally, so nothing is collected or stored by this app.
  protected readonly listaDeEspera = 'https://tally.so/r/n0YDZ0';
}
