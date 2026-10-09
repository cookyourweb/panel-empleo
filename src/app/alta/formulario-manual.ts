import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { AbstractControl, FormControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

import { Campo, MODALIDADES_DE_PERFIL, ModalidadDePerfil, Perfil, Propuesta } from './dominio';

const ETIQUETAS: Readonly<Record<Campo, string>> = {
  rol: $localize`:Etiqueta del rol en el formulario de perfil@@alta.formulario.rol:Rol`,
  aniosExperiencia: $localize`:Etiqueta de los anos de experiencia@@alta.formulario.anios:Años de experiencia`,
  stack: $localize`:Etiqueta de las tecnologias@@alta.formulario.stack:Tecnologías (separadas por comas)`,
  idiomas: $localize`:Etiqueta de los idiomas@@alta.formulario.idiomas:Idiomas (separados por comas)`,
  ubicacion: $localize`:Etiqueta de la ubicacion@@alta.formulario.ubicacion:Ubicación`,
};

const ETIQUETAS_DE_MODALIDAD: Readonly<Record<ModalidadDePerfil, string>> = {
  remoto: $localize`:Modalidad remoto@@alta.formulario.modalidad.remoto:Remoto`,
  hibrido: $localize`:Modalidad hibrido@@alta.formulario.modalidad.hibrido:Híbrido`,
  presencial: $localize`:Modalidad presencial@@alta.formulario.modalidad.presencial:Presencial`,
};

const MONEDAS = ['EUR', 'USD', 'GBP'] as const;

const ERRORES = {
  obligatorio: $localize`:Error de campo vacio@@alta.formulario.error.obligatorio:Este campo es obligatorio.`,
  invalido: $localize`:Error de valor no valido@@alta.formulario.error.invalido:El valor no es válido.`,
};

/** Entero entre 0 y 60 (el servidor lo comprueba tambien). */
function aniosValidos(control: AbstractControl<string>): ValidationErrors | null {
  const texto = control.value.trim();
  if (texto === '') return null;
  return /^\d{1,2}$/.test(texto) && Number(texto) <= 60 ? null : { anios: true };
}

function alMenosUna(control: AbstractControl<readonly string[]>): ValidationErrors | null {
  return control.value.length > 0 ? null : { required: true };
}

function aLista(texto: string): string[] {
  return texto
    .split(',')
    .map((elemento) => elemento.trim())
    .filter((elemento) => elemento !== '');
}

/**
 * El formulario del perfil: lo usa quien rellena a mano y, con propuestas del
 * CV como valores iniciales, quien revisa. Salario y modalidad se preguntan
 * siempre y nunca vienen rellenos (REQ-5.3); nada se emite hasta confirmar.
 */
@Component({
  selector: 'app-formulario-manual',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './alta.css',
  template: `
    <form [formGroup]="formulario" (ngSubmit)="confirmar()" novalidate>
      @for (campo of camposDeTexto; track campo) {
        <label class="campo" [for]="'campo-' + campo">{{ etiquetas[campo] }}</label>
        <input
          type="text"
          [id]="'campo-' + campo"
          [attr.data-campo]="campo"
          [formControlName]="campo"
          [attr.inputmode]="campo === 'aniosExperiencia' ? 'numeric' : null"
          [attr.aria-invalid]="invalido(campo)"
          [attr.aria-describedby]="invalido(campo) ? 'error-' + campo : null"
        />
        @if (invalido(campo)) {
          <p class="error" role="alert" [id]="'error-' + campo">{{ mensajeDeError(campo) }}</p>
        }
      }

      <fieldset class="grupo">
        <legend i18n="Pregunta por la modalidad@@alta.formulario.modalidad.pregunta">
          ¿Qué modalidades de trabajo te encajan?
        </legend>
        @for (modalidad of modalidades; track modalidad) {
          <div class="casilla">
            <input
              type="checkbox"
              [id]="'modalidad-' + modalidad"
              [attr.data-modalidad]="modalidad"
              [checked]="elegida(modalidad)"
              (change)="alternarModalidad(modalidad)"
            />
            <label [for]="'modalidad-' + modalidad">{{ etiquetasDeModalidad[modalidad] }}</label>
          </div>
        }
        @if (modalidadInvalida()) {
          <p class="error" role="alert">{{ errores.obligatorio }}</p>
        }
      </fieldset>

      <label class="campo" for="campo-salarioMin" i18n="Pregunta por el salario minimo@@alta.formulario.salario.pregunta">
        ¿Cuál es tu salario mínimo anual?
      </label>
      <input
        type="text"
        id="campo-salarioMin"
        data-campo="salarioMin"
        formControlName="salarioMin"
        inputmode="numeric"
        [attr.aria-invalid]="invalido('salarioMin')"
        [attr.aria-describedby]="invalido('salarioMin') ? 'error-salarioMin' : null"
      />
      @if (invalido('salarioMin')) {
        <p class="error" role="alert" id="error-salarioMin">{{ mensajeDeError('salarioMin') }}</p>
      }

      <label class="campo" for="campo-salarioMoneda" i18n="Etiqueta de la moneda del salario@@alta.formulario.moneda">
        Moneda
      </label>
      <select
        id="campo-salarioMoneda"
        data-campo="salarioMoneda"
        formControlName="salarioMoneda"
        [attr.aria-invalid]="invalido('salarioMoneda')"
        [attr.aria-describedby]="invalido('salarioMoneda') ? 'error-salarioMoneda' : null"
      >
        <option value="" i18n="Opcion vacia de la moneda@@alta.formulario.moneda.elegir">Elige una moneda</option>
        @for (moneda of monedas; track moneda) {
          <option [value]="moneda">{{ moneda }}</option>
        }
      </select>
      @if (invalido('salarioMoneda')) {
        <p class="error" role="alert" id="error-salarioMoneda">{{ mensajeDeError('salarioMoneda') }}</p>
      }

      @if (errorDeGuardado()) {
        <p class="error" role="alert" data-error-de-guardado i18n="Error al guardar el perfil@@alta.formulario.errorDeGuardado">
          No hemos podido guardar tu perfil. Lo que has escrito sigue aquí: prueba de nuevo.
        </p>
      }

      <div class="acciones">
        <button type="submit" data-guardar i18n="Boton que guarda el perfil@@alta.formulario.guardar">Guardar mi perfil</button>
      </div>
    </form>
  `,
})
export class FormularioManual {
  readonly propuestas = input<Propuesta[]>([]);
  readonly errorDeGuardado = input(false);
  readonly guardar = output<Perfil>();

  protected readonly camposDeTexto = ['rol', 'aniosExperiencia', 'stack', 'idiomas', 'ubicacion'] as const satisfies readonly Campo[];
  protected readonly etiquetas = ETIQUETAS;
  protected readonly modalidades = MODALIDADES_DE_PERFIL;
  protected readonly etiquetasDeModalidad = ETIQUETAS_DE_MODALIDAD;
  protected readonly monedas = MONEDAS;
  protected readonly errores = ERRORES;

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly enviado = signal(false);

  protected readonly formulario = this.fb.group({
    rol: ['', Validators.required],
    aniosExperiencia: ['', [Validators.required, aniosValidos]],
    stack: ['', Validators.required],
    idiomas: [''],
    ubicacion: ['', Validators.required],
    modalidad: new FormControl<ModalidadDePerfil[]>([], { nonNullable: true, validators: alMenosUna }),
    // Never pre-filled: they are questions for the person, not CV data.
    salarioMin: ['', [Validators.required, Validators.pattern(/^[1-9]\d*$/)]],
    salarioMoneda: ['', Validators.required],
  });

  constructor() {
    // Proposals arrive after construction (inputs): they only seed the fields.
    effect(() => {
      const propuestas = this.propuestas();
      untracked(() => {
        for (const { campo, valor } of propuestas) {
          this.formulario.controls[campo].setValue(valor);
        }
      });
    });
  }

  protected invalido(nombre: keyof typeof this.formulario.controls): boolean {
    const control = this.formulario.controls[nombre];
    return control.invalid && (control.touched || this.enviado());
  }

  protected mensajeDeError(nombre: keyof typeof this.formulario.controls): string {
    return this.formulario.controls[nombre].hasError('required') ? ERRORES.obligatorio : ERRORES.invalido;
  }

  protected modalidadInvalida(): boolean {
    return this.formulario.controls.modalidad.invalid && this.enviado();
  }

  protected elegida(modalidad: ModalidadDePerfil): boolean {
    return this.formulario.controls.modalidad.value.includes(modalidad);
  }

  protected alternarModalidad(modalidad: ModalidadDePerfil): void {
    const control = this.formulario.controls.modalidad;
    control.setValue(
      control.value.includes(modalidad) ? control.value.filter((m) => m !== modalidad) : [...control.value, modalidad],
    );
  }

  protected confirmar(): void {
    this.enviado.set(true);
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;
    const valores = this.formulario.getRawValue();
    this.guardar.emit({
      rol: valores.rol.trim(),
      aniosExperiencia: Number(valores.aniosExperiencia),
      stack: aLista(valores.stack),
      idiomas: aLista(valores.idiomas),
      ubicacion: valores.ubicacion.trim(),
      modalidad: valores.modalidad,
      salarioMin: Number(valores.salarioMin),
      salarioMoneda: valores.salarioMoneda,
    });
  }
}
