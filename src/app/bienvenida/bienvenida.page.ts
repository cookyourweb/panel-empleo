import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

const CORREO_DE_ACCESO = 'hello.cookyourweb@gmail.com';
const ASUNTO = $localize`:Asunto del correo con el que se pide acceso@@bienvenida.asunto:Acceso al panel de empleo`;

/** Puerta publica: cuenta que es el producto y como pedir acceso, sin recoger datos. */
@Component({
  imports: [RouterLink],
  selector: 'app-bienvenida',
  templateUrl: './bienvenida.page.html',
  styleUrl: './bienvenida.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BienvenidaPage {
  // Un mailto: no hay formulario ni se guarda nada, el correo lo envia la persona.
  protected readonly pedirAcceso = `mailto:${CORREO_DE_ACCESO}?subject=${encodeURIComponent(ASUNTO)}`;
}
