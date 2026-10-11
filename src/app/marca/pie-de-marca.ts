import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ClaveLegal, ENLACES_LEGALES, URL_DE_LA_AGENCIA } from './enlaces-de-marca';

/** Marca el sitio del corazon dentro del mensaje, para pintarlo con su propio color. */
const CORAZON = '❤';

/**
 * Pie de CookYourWeb AI, igual que el de www.cookyourwebai.es mas la linea
 * "Un proyecto de CookYourWeb AI".
 *
 * Los enlaces legales salen de ENLACES_LEGALES (ver enlaces-de-marca.ts): con la
 * lista vacia, que es hoy, la fila no se pinta.
 */
@Component({
  selector: 'app-pie-de-marca',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './pie-de-marca.css',
  templateUrl: './pie-de-marca.html',
})
export class PieDeMarca {
  protected readonly agencia = URL_DE_LA_AGENCIA;
  protected readonly legales = inject(ENLACES_LEGALES).map((enlace) => ({
    ...enlace,
    etiqueta: etiquetaLegal(enlace.clave),
  }));
  protected readonly etiquetaLegales = $localize`:Nombre accesible de la fila de enlaces legales del pie@@pie.legal.etiqueta:Información legal`;

  private readonly anio = new Date().getFullYear();
  protected readonly derechos = $localize`:Aviso de derechos reservados del pie@@pie.derechos:© ${this.anio}:anio: CookYourWeb. Todos los derechos reservados.`;
  /** [antes, despues] del corazon. */
  protected readonly hechoCon = $localize`:Frase de cierre del pie, con un corazon en medio@@pie.hechoCon:Hecho con ${CORAZON}:corazon: y mucha AI`.split(CORAZON);
}

function etiquetaLegal(clave: ClaveLegal): string {
  switch (clave) {
    case 'privacidad':
      return $localize`:Enlace del pie a la politica de privacidad@@pie.legal.privacidad:Política de Privacidad`;
    case 'cookies':
      return $localize`:Enlace del pie a la politica de cookies@@pie.legal.cookies:Política de Cookies`;
    case 'avisoLegal':
      return $localize`:Enlace del pie al aviso legal@@pie.legal.avisoLegal:Aviso Legal`;
    case 'baja':
      return $localize`:Enlace del pie a la pagina de baja@@pie.legal.baja:Darme de baja`;
  }
}
