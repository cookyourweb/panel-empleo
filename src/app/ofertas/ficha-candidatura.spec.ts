import { TestBed } from '@angular/core/testing';

import { Candidatura } from './dominio';
import { FichaCandidatura } from './ficha-candidatura';

const BASE: Candidatura = {
  id: 'n1',
  estado: 'En proceso',
  oferta: { id: 'o1', empresa: 'Acme', puesto: 'Frontend', idioma: 'en' },
};

async function pintar(una: Candidatura): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(FichaCandidatura);
  fixture.componentRef.setInput('candidatura', una);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
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
});
