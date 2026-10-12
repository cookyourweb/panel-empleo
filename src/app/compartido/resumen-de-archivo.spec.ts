import { TestBed } from '@angular/core/testing';

import { ResumenDeArchivo } from './resumen-de-archivo';

describe('ResumenDeArchivo', () => {
  async function pintar(nombre: string, tamano: number) {
    const fixture = TestBed.createComponent(ResumenDeArchivo);
    fixture.componentRef.setInput('nombre', nombre);
    fixture.componentRef.setInput('tamano', tamano);
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).textContent!;
  }

  it('enseña el nombre y el tamaño en KB', async () => {
    const texto = await pintar('mi-cv.pdf', 2048);

    expect(texto).toContain('mi-cv.pdf');
    expect(texto).toContain('2 KB');
  });

  it('un archivo diminuto cuenta como 1 KB, nunca 0', async () => {
    expect(await pintar('a.pdf', 5)).toContain('1 KB');
  });

  it('pasa a MB con un decimal a partir de un mega', async () => {
    expect(await pintar('a.pdf', 1.5 * 1024 * 1024)).toMatch(/1[.,]5 MB/);
  });
});
