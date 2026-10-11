import { TestBed } from '@angular/core/testing';

import { IndicadorDePasos } from './indicador-de-pasos';

describe('IndicadorDePasos', () => {
  async function pintar(actual: number) {
    const fixture = TestBed.createComponent(IndicadorDePasos);
    fixture.componentRef.setInput('etiquetas', ['Antes de empezar', 'Sube tu CV', 'Completa tu perfil', 'Listo']);
    fixture.componentRef.setInput('actual', actual);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('dice en que paso esta y cuantos hay', async () => {
    const raiz = await pintar(2);

    expect(raiz.querySelector('[data-paso-actual]')!.textContent!.trim()).toBe('Paso 2 de 4: Sube tu CV');
  });

  it('es una navegacion con nombre accesible y una lista con todos los pasos', async () => {
    const raiz = await pintar(1);

    expect(raiz.querySelector('nav')!.getAttribute('aria-label')).toBeTruthy();
    expect([...raiz.querySelectorAll('ol > li')].map((li) => li.textContent!.trim())).toEqual([
      'Antes de empezar',
      'Sube tu CV',
      'Completa tu perfil',
      'Listo',
    ]);
  });

  it('marca con aria-current="step" solo el paso actual', async () => {
    const raiz = await pintar(3);

    const marcados = [...raiz.querySelectorAll('li')].map((li) => li.getAttribute('aria-current'));
    expect(marcados).toEqual([null, null, 'step', null]);
  });

  it('distingue los pasos ya hechos sin depender solo del color', async () => {
    const raiz = await pintar(3);

    const hechos = [...raiz.querySelectorAll('li')].map((li) => li.hasAttribute('data-hecho'));
    expect(hechos).toEqual([true, true, false, false]);
  });
});
