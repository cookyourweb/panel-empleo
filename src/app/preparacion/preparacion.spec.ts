import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { DEMORA_DE_AVISO_MS, Preparacion } from './preparacion';

@Component({ template: 'pagina' })
class PaginaFalsa {}

describe('Preparacion', () => {
  let preparacion: Preparacion;
  let router: Router;
  let liberar: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    liberar = () => undefined;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'a', component: PaginaFalsa },
          {
            path: 'lenta',
            component: PaginaFalsa,
            canActivate: [() => new Promise<boolean>((resolver) => (liberar = () => resolver(true)))],
          },
        ]),
      ],
    });
    preparacion = TestBed.inject(Preparacion);
    router = TestBed.inject(Router);
  });

  afterEach(() => vi.useRealTimers());

  it('empieza sin avisar', () => {
    expect(preparacion.visible()).toBe(false);
  });

  it('no avisa de un trabajo que acaba antes de la demora, para no parpadear', async () => {
    const trabajo = preparacion.mientras(Promise.resolve('listo'));
    vi.advanceTimersByTime(DEMORA_DE_AVISO_MS - 1);

    expect(preparacion.visible()).toBe(false);
    await trabajo;
    vi.advanceTimersByTime(DEMORA_DE_AVISO_MS * 2);
    expect(preparacion.visible()).toBe(false);
  });

  it('avisa cuando un trabajo supera la demora y deja de avisar al terminar', async () => {
    let terminar!: (valor: string) => void;
    const trabajo = preparacion.mientras(new Promise<string>((resolver) => (terminar = resolver)));

    vi.advanceTimersByTime(DEMORA_DE_AVISO_MS);
    expect(preparacion.visible()).toBe(true);

    terminar('listo');
    await expect(trabajo).resolves.toBe('listo');
    expect(preparacion.visible()).toBe(false);
  });

  it('deja de avisar tambien cuando el trabajo falla, y propaga el error', async () => {
    let fallar!: (error: Error) => void;
    const trabajo = preparacion.mientras(new Promise<string>((_, rechazar) => (fallar = rechazar)));
    vi.advanceTimersByTime(DEMORA_DE_AVISO_MS);

    fallar(new Error('sin red'));

    await expect(trabajo).rejects.toThrow('sin red');
    expect(preparacion.visible()).toBe(false);
  });

  it('con dos trabajos a la vez sigue avisando hasta que acaba el ultimo', async () => {
    let primero!: () => void;
    let segundo!: () => void;
    const a = preparacion.mientras(new Promise<void>((r) => (primero = r)));
    const b = preparacion.mientras(new Promise<void>((r) => (segundo = r)));
    vi.advanceTimersByTime(DEMORA_DE_AVISO_MS);

    primero();
    await a;
    expect(preparacion.visible()).toBe(true);

    segundo();
    await b;
    expect(preparacion.visible()).toBe(false);
  });

  it('avisa mientras una navegacion espera a una guarda y se apaga al llegar', async () => {
    const navegacion = router.navigateByUrl('/lenta');
    await vi.advanceTimersByTimeAsync(DEMORA_DE_AVISO_MS);
    expect(preparacion.visible()).toBe(true);

    liberar();
    await navegacion;
    expect(preparacion.visible()).toBe(false);
  });

  it('se apaga si la navegacion se cancela por otra posterior', async () => {
    const lenta = router.navigateByUrl('/lenta');
    await vi.advanceTimersByTimeAsync(DEMORA_DE_AVISO_MS);
    expect(preparacion.visible()).toBe(true);

    await router.navigateByUrl('/a');
    await lenta;

    expect(preparacion.visible()).toBe(false);
  });

  it('no avisa de una navegacion rapida', async () => {
    await router.navigateByUrl('/a');
    await vi.advanceTimersByTimeAsync(DEMORA_DE_AVISO_MS * 2);

    expect(preparacion.visible()).toBe(false);
  });
});
