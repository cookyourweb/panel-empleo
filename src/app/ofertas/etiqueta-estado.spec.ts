import { TestBed } from '@angular/core/testing';

import { EstadoDeCandidatura } from './dominio';
import { EtiquetaEstado } from './etiqueta-estado';

describe('EtiquetaEstado', () => {
  async function pintar(estado: EstadoDeCandidatura): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(EtiquetaEstado);
    fixture.componentRef.setInput('estado', estado);
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).querySelector('.estado')!;
  }

  it('dice el estado y sabe cual es, para darle su color', async () => {
    const etiqueta = await pintar('Aprobado');

    expect(etiqueta.textContent?.trim()).toBe('Aprobado');
    expect(etiqueta.getAttribute('data-estado')).toBe('Aprobado');
  });

  it('los estados que cierran la candidatura se marcan como cerrados', async () => {
    for (const estado of ['Rechazado', 'Descartado', 'Caducada'] as const) {
      expect((await pintar(estado)).classList).toContain('cerrado');
    }
  });

  it('los que siguen vivos no', async () => {
    expect((await pintar('Pendiente')).classList).not.toContain('cerrado');
  });
});
