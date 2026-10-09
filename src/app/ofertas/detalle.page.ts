import { Component, computed, inject, input, OnInit, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { accionesPara, EnlacesDeAccion } from './acciones';
import { CandidaturasStore } from './candidaturas.store';
import { CambiosDeCandidatura } from './edicion';
import { ESTADO_DE_ENCAJE, FuenteDeEncaje } from './encaje';
import { FichaCandidatura } from './ficha-candidatura';
import { FuenteDeAcciones } from './fuente-de-acciones';
import { TuEncaje, VISTA_DE_ENCAJE, VistaDeEncaje } from './tu-encaje';

@Component({
  selector: 'app-detalle',
  imports: [RouterLink, FichaCandidatura, TuEncaje],
  templateUrl: './detalle.page.html',
  styleUrl: './detalle.page.css',
})
export class DetallePage implements OnInit {
  /** Llega de la ruta, con withComponentInputBinding. */
  readonly id = input.required<string>();

  protected readonly store = inject(CandidaturasStore);
  private readonly fuenteDeAcciones = inject(FuenteDeAcciones);
  private readonly enlaces = signal<EnlacesDeAccion | null>(null);

  protected readonly candidatura = computed(() => this.store.buscarPorId(this.id()));

  /** Las mismas reglas que la tabla: la ficha no decide por su cuenta. */
  protected readonly acciones = computed(() => {
    const una = this.candidatura();
    return una ? accionesPara(una, this.enlaces()) : [];
  });

  private readonly fuenteDeEncaje = inject(FuenteDeEncaje);

  /**
   * El encaje se pide por el id de la OFERTA (el de la candidatura es de
   * Notion). Si no hay candidatura, no se pide nada. Un fallo aqui no toca el
   * resto de la ficha: solo cambia lo que dice esta seccion.
   */
  private readonly encaje = resource({
    params: () => this.candidatura()?.oferta.id,
    loader: ({ params }) => this.fuenteDeEncaje.obtener(params),
  });

  protected readonly vistaDeEncaje = computed<VistaDeEncaje>(() => {
    if (this.encaje.error()) {
      return { estado: VISTA_DE_ENCAJE.error };
    }
    const resultado = this.encaje.hasValue() ? this.encaje.value() : undefined;
    if (!resultado) {
      return { estado: VISTA_DE_ENCAJE.cargando };
    }
    return resultado.estado === ESTADO_DE_ENCAJE.sinPerfil
      ? { estado: VISTA_DE_ENCAJE.sinPerfil }
      : { estado: VISTA_DE_ENCAJE.listo, encaje: resultado.encaje };
  });

  protected readonly guardar = (id: string, cambios: CambiosDeCandidatura) => this.store.guardarCambios(id, cambios);

  ngOnInit(): void {
    // El store se comparte con la lista: si ya cargo, esto no vuelve a pedir nada.
    void this.store.cargar();
    void this.fuenteDeAcciones.enlaces().then((enlaces) => this.enlaces.set(enlaces));
  }
}
