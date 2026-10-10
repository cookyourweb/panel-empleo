import { TestBed } from '@angular/core/testing';

import { Perfil, Propuesta } from './dominio';
import { FormularioManual } from './formulario-manual';

describe('FormularioManual', () => {
  async function pintar(opciones: { propuestas?: Propuesta[]; errorDeGuardado?: boolean } = {}) {
    const fixture = TestBed.createComponent(FormularioManual);
    fixture.componentRef.setInput('propuestas', opciones.propuestas ?? []);
    fixture.componentRef.setInput('errorDeGuardado', opciones.errorDeGuardado ?? false);
    const guardar = vi.fn<(perfil: Perfil) => void>();
    fixture.componentInstance.guardar.subscribe(guardar);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    const control = (nombre: string) => raiz.querySelector<HTMLInputElement>(`[data-campo="${nombre}"]`)!;
    const escribir = async (nombre: string, valor: string) => {
      const entrada = control(nombre);
      entrada.value = valor;
      entrada.dispatchEvent(new Event('input'));
      entrada.dispatchEvent(new Event('change'));
      await fixture.whenStable();
    };
    const enviar = async () => {
      raiz.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };
    const marcarModalidad = async (valor: string) => {
      raiz.querySelector<HTMLInputElement>(`[data-modalidad="${valor}"]`)!.click();
      await fixture.whenStable();
    };
    return { fixture, raiz, guardar, control, escribir, enviar, marcarModalidad };
  }

  async function rellenarTodo(p: Awaited<ReturnType<typeof pintar>>) {
    await p.escribir('rol', 'Frontend senior');
    await p.escribir('aniosExperiencia', '20');
    await p.escribir('stack', 'Angular, TypeScript');
    await p.escribir('idiomas', 'Español, Inglés');
    await p.escribir('ubicacion', 'Madrid');
    await p.escribir('salarioMin', '45000');
    await p.escribir('salarioMoneda', 'EUR');
    await p.marcarModalidad('remoto');
  }

  it('REQ-5.3: salario y modalidad se preguntan siempre y nunca vienen rellenos', async () => {
    const { control, raiz } = await pintar({
      propuestas: [{ campo: 'rol', valor: 'Frontend', cita: 'Frontend developer' }],
    });

    expect(control('salarioMin').value).toBe('');
    expect(control('salarioMoneda').value).toBe('');
    expect(raiz.querySelectorAll<HTMLInputElement>('[data-modalidad]:checked').length).toBe(0);
  });

  it('cada campo tiene su etiqueta asociada', async () => {
    const { raiz } = await pintar();

    const campos = raiz.querySelectorAll<HTMLElement>('[data-campo]');
    expect(campos.length).toBe(7);
    campos.forEach((campo) => expect(raiz.querySelector(`label[for="${campo.id}"]`)).not.toBeNull());
  });

  it('REQ-5.5: no emite nada hasta que se confirma', async () => {
    const p = await pintar();

    await rellenarTodo(p);

    expect(p.guardar).not.toHaveBeenCalled();
  });

  it('al confirmar emite el perfil con los tipos del dominio', async () => {
    const p = await pintar();
    await rellenarTodo(p);

    await p.enviar();

    expect(p.guardar).toHaveBeenCalledWith({
      rol: 'Frontend senior',
      aniosExperiencia: 20,
      stack: ['Angular', 'TypeScript'],
      idiomas: ['Español', 'Inglés'],
      ubicacion: 'Madrid',
      modalidad: ['remoto'],
      salarioMin: 45000,
      salarioMoneda: 'EUR',
    });
  });

  it('un formulario invalido no emite y marca los errores', async () => {
    const p = await pintar();

    await p.enviar();

    expect(p.guardar).not.toHaveBeenCalled();
    expect(p.raiz.querySelector('[role="alert"]')).not.toBeNull();
    expect(p.control('rol').getAttribute('aria-invalid')).toBe('true');
  });

  it('valida anios (0 a 60) y salario (entero positivo)', async () => {
    const p = await pintar();
    await rellenarTodo(p);
    await p.escribir('aniosExperiencia', '61');
    await p.escribir('salarioMin', '-3');

    await p.enviar();

    expect(p.guardar).not.toHaveBeenCalled();
    expect(p.control('aniosExperiencia').getAttribute('aria-invalid')).toBe('true');
    expect(p.control('salarioMin').getAttribute('aria-invalid')).toBe('true');
  });

  it('exige al menos una modalidad', async () => {
    const p = await pintar();
    await rellenarTodo(p);
    await p.marcarModalidad('remoto');

    await p.enviar();

    expect(p.guardar).not.toHaveBeenCalled();
  });

  it('muestra el error de guardado y conserva lo escrito', async () => {
    const p = await pintar({ errorDeGuardado: true });
    await p.escribir('rol', 'Frontend senior');

    expect(p.raiz.querySelector('[data-error-de-guardado]')?.getAttribute('role')).toBe('alert');
    expect(p.control('rol').value).toBe('Frontend senior');
  });
});
