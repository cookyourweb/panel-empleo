import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { ProveedorDeIdentidad } from '../sesion/proveedor-de-identidad';
import { RESULTADO_DE_ENTRADA, ResultadoDeEntrada, Sesion } from '../sesion/sesion';
import { EntradaPage } from './entrada.page';

class IdentidadFalsa extends ProveedorDeIdentidad {
  alRecibir: ((credencial: string) => void) | null = null;
  readonly olvidar = vi.fn();
  readonly preparar = vi.fn(
    async (_contenedor: HTMLElement, alRecibir: (credencial: string) => void) => {
      this.alRecibir = alRecibir;
    },
  );
}

describe('EntradaPage', () => {
  let identidad: IdentidadFalsa;
  let fixture: ComponentFixture<unknown>;
  let navegar: ReturnType<typeof vi.spyOn>;
  const entrar = vi.fn<(credencial: string) => Promise<ResultadoDeEntrada>>();

  async function abrir(url = '/entrar'): Promise<HTMLElement> {
    identidad = new IdentidadFalsa();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'entrar', component: EntradaPage }]),
        { provide: ProveedorDeIdentidad, useValue: identidad },
        { provide: Sesion, useValue: { entrar, usuaria: signal(null) } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, EntradaPage);
    fixture = harness.fixture;
    // Despues de abrir: el propio harness navega con navigateByUrl.
    navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await fixture.whenStable();
    return harness.routeNativeElement as HTMLElement;
  }

  async function recibir(resultado: ResultadoDeEntrada): Promise<void> {
    entrar.mockResolvedValue(resultado);
    identidad.alRecibir?.('jwt-de-prueba');
    await vi.waitFor(() => expect(entrar).toHaveBeenCalled());
    await fixture.whenStable();
  }

  beforeEach(() => entrar.mockReset());

  it('prepara el acceso en el contenedor con el proveedor de identidad', async () => {
    const pagina = await abrir();

    expect(identidad.preparar).toHaveBeenCalledWith(
      pagina.querySelector('[data-acceso]'),
      expect.any(Function),
    );
  });

  it('al entrar va a la pagina de inicio', async () => {
    await abrir();

    await recibir(RESULTADO_DE_ENTRADA.dentro);

    expect(entrar).toHaveBeenCalledWith('jwt-de-prueba');
    expect(navegar).toHaveBeenCalledWith('/');
  });

  it('al entrar vuelve a la ruta pedida si es interna', async () => {
    await abrir('/entrar?volver=/candidatura/c1');

    await recibir(RESULTADO_DE_ENTRADA.dentro);

    expect(navegar).toHaveBeenCalledWith('/candidatura/c1');
  });

  it.each(['https://malo.test/x', '//malo.test/x', 'candidatura/c1', '/\\malo.test'])(
    'ignora un volver que no es una ruta interna: %s',
    async (volver) => {
      await abrir(`/entrar?volver=${encodeURIComponent(volver)}`);

      await recibir(RESULTADO_DE_ENTRADA.dentro);

      expect(navegar).toHaveBeenCalledWith('/');
    },
  );

  it('si se rechaza la credencial avisa de que no se pudo comprobar', async () => {
    const pagina = await abrir();

    await recibir(RESULTADO_DE_ENTRADA.rechazada);

    expect(pagina.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo comprobar tu cuenta',
    );
    expect(navegar).not.toHaveBeenCalled();
  });

  it('si la cuenta no esta invitada lo dice y olvida la cuenta', async () => {
    const pagina = await abrir();

    await recibir(RESULTADO_DE_ENTRADA.noInvitada);

    expect(pagina.querySelector('[role="alert"]')?.textContent).toContain(
      'Tu cuenta no está invitada',
    );
    expect(identidad.olvidar).toHaveBeenCalled();
  });

  it('si el servidor no puede comprobar lo cuenta', async () => {
    const pagina = await abrir();

    await recibir(RESULTADO_DE_ENTRADA.sinServidor);

    expect(pagina.querySelector('[role="alert"]')?.textContent).toContain(
      'El servidor no puede comprobar la identidad ahora',
    );
  });
});
