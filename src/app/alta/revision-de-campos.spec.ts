import { TestBed } from '@angular/core/testing';

import { Perfil, Propuesta } from './dominio';
import { RevisionDeCampos } from './revision-de-campos';

describe('RevisionDeCampos', () => {
  const DOS: Propuesta[] = [
    { campo: 'rol', valor: 'Frontend senior', cita: 'Frontend developer senior en Acme' },
    { campo: 'stack', valor: 'Angular, TypeScript', cita: 'Stack: Angular y TypeScript' },
  ];

  async function pintar(propuestas: Propuesta[] = DOS) {
    const fixture = TestBed.createComponent(RevisionDeCampos);
    fixture.componentRef.setInput('propuestas', propuestas);
    const guardar = vi.fn<(perfil: Perfil) => void>();
    fixture.componentInstance.guardar.subscribe(guardar);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    const campo = (nombre: string) => raiz.querySelector<HTMLInputElement>(`[data-campo="${nombre}"]`)!;
    const pulsar = async (selector: string) => {
      raiz.querySelector<HTMLButtonElement>(selector)!.click();
      await fixture.whenStable();
    };
    return { fixture, raiz, guardar, campo, pulsar };
  }

  it('S5.4: dos propuestas con su cita y tres campos marcados como no encontrados', async () => {
    const { raiz, campo } = await pintar();

    expect(raiz.querySelectorAll('[data-cita]').length).toBe(2);
    expect(raiz.querySelector('[data-cita="rol"]')?.textContent).toContain('Frontend developer senior en Acme');
    expect(raiz.querySelectorAll('[data-no-encontrado]').length).toBe(3);
    expect(campo('rol').value).toBe('Frontend senior');
    expect(campo('ubicacion').value).toBe('');
  });

  it('un campo no encontrado queda vacio y editable, con el aviso asociado', async () => {
    const { raiz, campo } = await pintar();

    const aviso = raiz.querySelector<HTMLElement>('[data-no-encontrado="ubicacion"]')!;
    expect(aviso.textContent).toContain('no encontrado en tu CV');
    expect(campo('ubicacion').getAttribute('aria-describedby')).toContain(aviso.id);
    expect(campo('ubicacion').readOnly).toBe(false);
  });

  it('S5.6: el HTML de una cita se pinta como texto y no crea elementos', async () => {
    const hostil = '<img src=x onerror="window.pwned=1"><b>negrita</b>';
    const { raiz } = await pintar([{ campo: 'rol', valor: 'Dev', cita: hostil }]);

    const cita = raiz.querySelector('[data-cita="rol"]')!;
    expect(cita.textContent).toContain(hostil);
    expect(cita.querySelector('img, b')).toBeNull();
  });

  it('el valor propuesto se puede editar y pasa a editado', async () => {
    const { raiz, campo, fixture } = await pintar();

    campo('rol').value = 'Tech lead';
    campo('rol').dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(raiz.querySelector('[data-estado="rol"]')?.getAttribute('data-valor')).toBe('editado');
  });

  it('aceptar marca el campo como aceptado y conserva el valor', async () => {
    const { raiz, campo, pulsar } = await pintar();

    await pulsar('[data-aceptar="rol"]');

    expect(raiz.querySelector('[data-estado="rol"]')?.getAttribute('data-valor')).toBe('aceptado');
    expect(campo('rol').value).toBe('Frontend senior');
  });

  it('descartar vacia el campo y lo marca como descartado', async () => {
    const { raiz, campo, pulsar } = await pintar();

    await pulsar('[data-descartar="stack"]');

    expect(campo('stack').value).toBe('');
    expect(raiz.querySelector('[data-estado="stack"]')?.getAttribute('data-valor')).toBe('descartado');
  });

  it('los botones y los avisos de estado son accesibles', async () => {
    const { raiz } = await pintar();

    const aceptar = raiz.querySelector<HTMLButtonElement>('[data-aceptar="rol"]')!;
    expect(aceptar.getAttribute('aria-describedby')).toBe('etiqueta-rol');
    expect(raiz.querySelector('#etiqueta-rol')).not.toBeNull();
    expect(raiz.querySelector('[data-estado="rol"]')?.getAttribute('aria-live')).toBe('polite');
  });

  it('REQ-5.5: no guarda por mostrar propuestas, solo al confirmar', async () => {
    const { guardar, pulsar } = await pintar();

    await pulsar('[data-aceptar="rol"]');

    expect(guardar).not.toHaveBeenCalled();
  });

  it('REQ-5.3: salario y modalidad se preguntan aunque haya propuestas', async () => {
    const { raiz, campo } = await pintar();

    expect(campo('salarioMin').value).toBe('');
    expect(raiz.querySelectorAll('[data-modalidad]:checked').length).toBe(0);
  });
});
