import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Candidatura } from './dominio';
import { CambiosDeCandidatura, OpcionesDeEdicion } from './edicion';
import { FichaCandidatura } from './ficha-candidatura';

const BASE: Candidatura = {
  id: 'n1',
  estado: 'En proceso',
  oferta: { id: 'o1', empresa: 'Acme', puesto: 'Frontend', idioma: 'en' },
};

async function pintar(
  una: Candidatura,
  edicion?: { opciones: OpcionesDeEdicion; alGuardar: (id: string, cambios: CambiosDeCandidatura) => Promise<void> },
): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(FichaCandidatura);
  fixture.componentRef.setInput('candidatura', una);
  if (edicion) {
    fixture.componentRef.setInput('opciones', edicion.opciones);
    fixture.componentRef.setInput('alGuardar', edicion.alGuardar);
  }
  await fixture.whenStable();
  pintada = fixture;
  return fixture.nativeElement as HTMLElement;
}

let pintada: ComponentFixture<FichaCandidatura>;

async function estable(): Promise<void> {
  await pintada.whenStable();
}

function escribir(ficha: HTMLElement, clave: string, valor: string): void {
  const campo = ficha.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`#editar-${clave}`)!;
  campo.value = valor;
  campo.dispatchEvent(new Event(campo instanceof HTMLSelectElement ? 'change' : 'input'));
}

describe('FichaCandidatura', () => {
  it('enseña el CV generado dentro de la ficha, para revisarlo sin salir', async () => {
    const ficha = await pintar({ ...BASE, cv: 'https://docs.google.com/document/d/abc/edit' });

    const visor = ficha.querySelector<HTMLIFrameElement>('[data-campo="cv"] iframe');

    expect(visor?.src).toBe('https://docs.google.com/document/d/abc/preview');
    expect(visor?.title).toContain('CV');
    // Y el enlace sigue, para abrirlo en grande o editarlo.
    expect(ficha.querySelector('[data-campo="cv"] a')?.getAttribute('href')).toBe(
      'https://docs.google.com/document/d/abc/edit',
    );
  });

  it('un CV fuera de Google se enlaza pero no se incrusta', async () => {
    const ficha = await pintar({ ...BASE, cv: 'https://ejemplo.test/cv' });

    expect(ficha.querySelector('[data-campo="cv"] iframe')).toBeNull();
    expect(ficha.querySelector('[data-campo="cv"] a')).not.toBeNull();
  });

  describe('edicion', () => {
    const OPCIONES: OpcionesDeEdicion = { fase: ['CV enviado', 'Entrevista técnica'] };

    it('sin puente no se ofrece editar', async () => {
      const ficha = await pintar(BASE);

      expect(ficha.querySelector('[data-editar]')).toBeNull();
    });

    it('una candidatura que aun no esta en Notion no se puede editar', async () => {
      const ficha = await pintar({ ...BASE, id: 'local-2026-10-05-x' }, { opciones: OPCIONES, alGuardar: async () => undefined });

      expect(ficha.querySelector('[data-editar]')).toBeNull();
    });

    it('Editar convierte la ficha en formulario, con los campos vacios incluidos', async () => {
      const ficha = await pintar(BASE, { opciones: OPCIONES, alGuardar: async () => undefined });

      ficha.querySelector<HTMLButtonElement>('[data-editar]')!.click();
      await estable();

      expect(ficha.querySelector<HTMLInputElement>('#editar-empresa')?.value).toBe('Acme');
      expect(ficha.querySelector<HTMLInputElement>('#editar-ubicacion')?.value).toBe('');
      expect(ficha.querySelector<HTMLInputElement>('#editar-seguimiento')?.type).toBe('date');
      expect(ficha.querySelector('label[for="editar-notas"]')?.textContent).toContain('Notas');
      const fases = [...ficha.querySelectorAll<HTMLOptionElement>('#editar-fase option')].map((o) => o.value);
      expect(fases).toEqual(['', 'CV enviado', 'Entrevista técnica']);
    });

    it('Guardar manda solo lo cambiado y vuelve a la lectura', async () => {
      const guardadas: [string, CambiosDeCandidatura][] = [];
      const ficha = await pintar(BASE, {
        opciones: OPCIONES,
        alGuardar: async (id, cambios) => {
          guardadas.push([id, cambios]);
        },
      });
      ficha.querySelector<HTMLButtonElement>('[data-editar]')!.click();
      await estable();

      escribir(ficha, 'notas', 'Llamar el lunes');
      escribir(ficha, 'fase', 'Entrevista técnica');
      ficha.querySelector<HTMLButtonElement>('[data-guardar]')!.click();
      await estable();

      expect(guardadas).toEqual([['n1', { notas: 'Llamar el lunes', fase: 'Entrevista técnica' }]]);
      expect(ficha.querySelector('form')).toBeNull();
    });

    it('si no se pudo guardar, lo dice y no pierde lo escrito', async () => {
      const ficha = await pintar(BASE, {
        opciones: OPCIONES,
        alGuardar: async () => {
          throw new Error('Notion no responde');
        },
      });
      ficha.querySelector<HTMLButtonElement>('[data-editar]')!.click();
      await estable();

      escribir(ficha, 'notas', 'Algo importante');
      ficha.querySelector<HTMLButtonElement>('[data-guardar]')!.click();
      await estable();

      expect(ficha.querySelector('[role="alert"]')?.textContent).toContain('Notion no responde');
      expect(ficha.querySelector<HTMLTextAreaElement>('#editar-notas')?.value).toBe('Algo importante');
    });

    it('Cancelar descarta lo escrito', async () => {
      const ficha = await pintar(BASE, { opciones: OPCIONES, alGuardar: async () => undefined });
      ficha.querySelector<HTMLButtonElement>('[data-editar]')!.click();
      await estable();

      escribir(ficha, 'notas', 'No quiero esto');
      ficha.querySelector<HTMLButtonElement>('[data-cancelar]')!.click();
      await estable();

      expect(ficha.querySelector('form')).toBeNull();
      expect(ficha.textContent).not.toContain('No quiero esto');
    });
  });
});
