import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Sesion } from '../sesion/sesion';
import { CuentaPage } from './cuenta.page';
import { RepositorioDeCuenta } from './repositorio-de-cuenta';

describe('CuentaPage', () => {
  const repositorio = { borrar: vi.fn() };
  const sesion = { cerrar: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    repositorio.borrar.mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: RepositorioDeCuenta, useValue: repositorio },
        { provide: Sesion, useValue: sesion },
      ],
    });
  });

  async function pintar() {
    const fixture = TestBed.createComponent(CuentaPage);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    const pulsar = async (selector: string) => {
      raiz.querySelector<HTMLButtonElement>(selector)!.click();
      await fixture.whenStable();
    };
    return { fixture, raiz, pulsar };
  }

  it('explica que se borra: perfil, CV cifrado y consentimientos', async () => {
    const { raiz } = await pintar();

    const texto = raiz.textContent ?? '';
    expect(texto).toContain('perfil');
    expect(texto).toContain('CV cifrado');
    expect(texto).toContain('consentimientos');
  });

  it('no borra nada al abrir ni al pedir borrar: hace falta confirmar', async () => {
    const { raiz, pulsar } = await pintar();
    expect(raiz.querySelector('[data-confirmar]')).toBeNull();

    await pulsar('[data-borrar]');

    expect(raiz.querySelector('[data-confirmar]')).not.toBeNull();
    expect(repositorio.borrar).not.toHaveBeenCalled();
  });

  it('cancelar vuelve atras sin borrar', async () => {
    const { raiz, pulsar } = await pintar();
    await pulsar('[data-borrar]');

    await pulsar('[data-cancelar]');

    expect(raiz.querySelector('[data-confirmar]')).toBeNull();
    expect(repositorio.borrar).not.toHaveBeenCalled();
  });

  it('al confirmar borra, cierra la sesion y vuelve al inicio', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { pulsar } = await pintar();
    await pulsar('[data-borrar]');

    await pulsar('[data-confirmar]');

    expect(repositorio.borrar).toHaveBeenCalledTimes(1);
    expect(sesion.cerrar).toHaveBeenCalledTimes(1);
    expect(navegar).toHaveBeenCalledWith('/');
  });

  it('si el servidor falla muestra el error, no cierra la sesion y deja reintentar', async () => {
    repositorio.borrar.mockRejectedValue(new Error('500'));
    const { raiz, pulsar } = await pintar();
    await pulsar('[data-borrar]');

    await pulsar('[data-confirmar]');

    expect(sesion.cerrar).not.toHaveBeenCalled();
    expect(raiz.querySelector('[role="alert"]')).not.toBeNull();
    expect(raiz.querySelector<HTMLButtonElement>('[data-confirmar]')!.disabled).toBe(false);
  });

  it('mueve el foco al titulo de la confirmacion', async () => {
    const { raiz, pulsar } = await pintar();

    await pulsar('[data-borrar]');

    expect(document.activeElement).toBe(raiz.querySelector('[data-titulo-de-paso]'));
  });

  it('no usa los dialogos del navegador', async () => {
    const confirmar = vi.spyOn(window, 'confirm');
    const { pulsar } = await pintar();

    await pulsar('[data-borrar]');
    await pulsar('[data-confirmar]');

    expect(confirmar).not.toHaveBeenCalled();
  });
});
