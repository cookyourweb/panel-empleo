import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  LOCALE_ID,
  output,
  signal,
} from '@angular/core';

import {
  agotada,
  Cuota,
  Interes,
  MAXIMO_DE_ORGANIZACION,
  mensajeDeAgotada,
  textoDeRestantes,
  TipoDeInteres,
} from './cuota';

/**
 * Cuantas candidaturas le quedan este mes y, si se le acaban, por que y que
 * puede hacer. Solo presenta: no sabe de HTTP. Quien lo usa le da la cuota y
 * el estado del envio, y recoge lo que quiere que se le avise.
 */
@Component({
  selector: 'app-medidor-de-cuota',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './medidor-de-cuota.css',
  template: `
    @if (sinSaldo()) {
      <div class="cuota agotada panel-suave">
        <p data-cuota-agotada>{{ mensajeAgotada() }}</p>

        @if (enviado()) {
          <p data-interes-enviado i18n="Confirmacion de que se guardo el aviso de interes@@cuota.interes.gracias">
            Gracias, te avisaremos.
          </p>
        } @else if (!abierto()) {
          <button
            type="button"
            class="boton boton--secundario"
            data-abrir-interes
            aria-expanded="false"
            (click)="abrir()"
            i18n="Boton que abre el formulario para que le avisen de paquetes o academia@@cuota.interes.abrir"
          >
            Avísame si hay paquetes o acceso por mi academia
          </button>
        } @else {
          <form data-formulario-interes (submit)="enviar($event)">
            <fieldset>
              <legend i18n="Pregunta del formulario de aviso@@cuota.interes.leyenda">¿Qué te interesa?</legend>
              <label for="interes-paquetes">
                <input
                  type="radio"
                  id="interes-paquetes"
                  name="interes-tipo"
                  value="paquetes"
                  [checked]="tipo() === 'paquetes'"
                  (change)="tipo.set('paquetes')"
                />
                <ng-container i18n="Opcion de interes en paquetes de candidaturas@@cuota.interes.paquetes"
                  >Paquetes de candidaturas</ng-container
                >
              </label>
              <label for="interes-academia">
                <input
                  type="radio"
                  id="interes-academia"
                  name="interes-tipo"
                  value="academia"
                  [checked]="tipo() === 'academia'"
                  (change)="tipo.set('academia')"
                />
                <ng-container i18n="Opcion de interes en acceso por una academia@@cuota.interes.academia"
                  >Acceso a través de mi academia</ng-container
                >
              </label>
            </fieldset>

            <label for="interes-organizacion" class="campo">
              <ng-container i18n="Etiqueta del campo de organizacion, que es opcional@@cuota.interes.organizacion"
                >Tu academia u organización (opcional)</ng-container
              >
              <input
                type="text"
                id="interes-organizacion"
                autocomplete="organization"
                [attr.maxlength]="maximo"
                [value]="organizacion()"
                (input)="organizacion.set($any($event.target).value)"
              />
            </label>

            @if (fallo()) {
              <p class="error" role="alert" data-error-interes i18n="Error al guardar el aviso de interes@@cuota.interes.error">
                No hemos podido guardar tu aviso. Prueba de nuevo.
              </p>
            }

            <button
              type="submit"
              class="boton boton--primario"
              data-enviar-interes
              [disabled]="enviando()"
              [attr.aria-busy]="enviando() ? 'true' : null"
            >
              @if (enviando()) {
                <ng-container i18n="Boton de enviar el aviso mientras se envia@@cuota.interes.enviando">Enviando…</ng-container>
              } @else {
                <ng-container i18n="Boton que envia el aviso de interes@@cuota.interes.enviar">Avisarme</ng-container>
              }
            </button>
          </form>
        }
      </div>
    } @else {
      <p class="cuota" data-cuota-restantes>{{ textoRestantes() }}</p>
    }
  `,
})
export class MedidorDeCuota {
  readonly cuota = input.required<Cuota>();
  readonly enviando = input(false);
  readonly enviado = input(false);
  readonly fallo = input(false);
  readonly idioma = input<string>(inject(LOCALE_ID));

  readonly avisar = output<Interes>();

  protected readonly maximo = MAXIMO_DE_ORGANIZACION;
  protected readonly abierto = signal(false);
  protected readonly tipo = signal<TipoDeInteres>('paquetes');
  protected readonly organizacion = signal('');

  protected readonly sinSaldo = computed(() => agotada(this.cuota()));
  protected readonly textoRestantes = computed(() => textoDeRestantes(this.cuota(), this.idioma()));
  protected readonly mensajeAgotada = computed(() =>
    mensajeDeAgotada(this.cuota(), this.idioma()),
  );

  private readonly anfitrion = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected abrir(): void {
    this.abierto.set(true);
    // El boton desaparece: el foco pasa al primer campo en vez de perderse.
    afterNextRender(
      () => this.anfitrion.nativeElement.querySelector<HTMLElement>('input[type=radio]')?.focus(),
      { injector: this.injector },
    );
  }

  protected enviar(evento: Event): void {
    evento.preventDefault();
    if (this.enviando()) return;
    const organizacion = this.organizacion().trim();
    this.avisar.emit(organizacion ? { tipo: this.tipo(), organizacion } : { tipo: this.tipo() });
  }
}
