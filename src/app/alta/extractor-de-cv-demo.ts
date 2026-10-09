import { Injectable } from '@angular/core';

import { ResultadoExtraccion } from './dominio';
import { ExtractorDeCv } from './extractor-de-cv';

/** Siempre la misma propuesta: la demo no lee el archivo ni llama a ningun servicio. */
@Injectable()
export class ExtractorDeCvDemo implements ExtractorDeCv {
  async subir(_archivo: File): Promise<void> {}

  async extraer(): Promise<ResultadoExtraccion> {
    return {
      estado: 'propuesta',
      propuestas: [
        { campo: 'rol', valor: 'Desarrolladora frontend', cita: 'Desarrolladora frontend senior' },
        { campo: 'aniosExperiencia', valor: '12', cita: 'Más de 12 años de experiencia' },
        { campo: 'stack', valor: 'Angular, TypeScript', cita: 'Angular, TypeScript, RxJS' },
      ],
    };
  }
}
