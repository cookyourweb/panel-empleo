import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { ProveedorDeIdentidad } from '../sesion/proveedor-de-identidad';
import { RESULTADO_DE_ENTRADA, ResultadoDeEntrada, Sesion } from '../sesion/sesion';
import { Servidor } from '../sesion/servidor';
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
        // El servidor ya esta despierto: preparar espera a esta respuesta.
        { provide: Servidor, useValue: { comprobar: async () => true } },
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

describe('EntradaPage con el servidor dormido', () => {
  const MENSAJE_DESPERTANDO = 'Despertando el servidor, puede tardar un minuto';
  let respuestas: ((despierto: boolean) => void)[];
  let comprobar: ReturnType<typeof vi.fn>;
  let preparar: ReturnType<typeof vi.fn>;
  let fixture: ComponentFixture<EntradaPage>;

  class IdentidadSimple extends ProveedorDeIdentidad {
    readonly olvidar = vi.fn();
    readonly preparar = preparar as ProveedorDeIdentidad['preparar'];
  }

  const pagina = () => fixture.nativeElement as HTMLElement;
  const aviso = () => pagina().querySelector('[role="status"]');
  const reintentar = () =>
    Array.from(pagina().querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Reintentar'),
    );

  async function pasar(ms: number): Promise<void> {
    await vi.advanceTimersByTimeAsync(ms);
    fixture.detectChanges();
  }

  async function responder(despierto: boolean, intento = respuestas.length - 1): Promise<void> {
    respuestas[intento](despierto);
    await pasar(0);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    respuestas = [];
    comprobar = vi.fn(() => new Promise<boolean>((resolver) => respuestas.push(resolver)));
    preparar = vi.fn(async () => undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ProveedorDeIdentidad, useValue: new IdentidadSimple() },
        { provide: Sesion, useValue: { entrar: vi.fn(), usuaria: signal(null) } },
        { provide: Servidor, useValue: { comprobar } },
      ],
    });
    fixture = TestBed.createComponent(EntradaPage);
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it('comprueba el servidor al empezar', () => {
    expect(comprobar).toHaveBeenCalledTimes(1);
  });

  it('avisa de que despierta el servidor a los 3 segundos', async () => {
    await pasar(2999);
    expect(aviso()).toBeNull();

    await pasar(1);

    expect(aviso()?.textContent).toContain(MENSAJE_DESPERTANDO);
  });

  it('si responde rapido el aviso no aparece nunca', async () => {
    await pasar(1000);
    await responder(true);
    await pasar(5000);

    expect(aviso()).toBeNull();
  });

  it('solo prepara el acceso cuando el servidor responde que si', async () => {
    await pasar(5000);
    expect(preparar).not.toHaveBeenCalled();

    await responder(true);

    expect(preparar).toHaveBeenCalledWith(
      pagina().querySelector('[data-acceso]'),
      expect.any(Function),
    );
    expect(aviso()).toBeNull();
  });

  it('ofrece reintentar si pasan 90 segundos sin respuesta', async () => {
    await pasar(89999);
    expect(reintentar()).toBeUndefined();

    await pasar(1);

    expect(reintentar()).toBeDefined();
    expect(preparar).not.toHaveBeenCalled();
  });

  it('ofrece reintentar si el servidor responde que no', async () => {
    await responder(false);

    expect(reintentar()).toBeDefined();
    expect(aviso()?.textContent).not.toContain(MENSAJE_DESPERTANDO);
    expect(preparar).not.toHaveBeenCalled();
  });

  it('reintentar vuelve a comprobar y reinicia los dos plazos', async () => {
    await responder(false);

    reintentar()?.click();
    await pasar(0);

    expect(comprobar).toHaveBeenCalledTimes(2);
    expect(reintentar()).toBeUndefined();
    await pasar(3000);
    expect(aviso()?.textContent).toContain(MENSAJE_DESPERTANDO);
    await pasar(86999);
    expect(reintentar()).toBeUndefined();
    await pasar(1);
    expect(reintentar()).toBeDefined();
  });

  it('ignora la respuesta tardia de un intento superado', async () => {
    await responder(false);
    reintentar()?.click();
    await pasar(0);

    await responder(true, 0);
    expect(preparar).not.toHaveBeenCalled();

    await responder(true, 1);
    expect(preparar).toHaveBeenCalledTimes(1);
  });

  it('al destruir la pagina se limpian los plazos', async () => {
    fixture.destroy();

    await vi.advanceTimersByTimeAsync(120000);

    expect(vi.getTimerCount()).toBe(0);
    expect(comprobar).toHaveBeenCalledTimes(1);
  });

  it('ignora la respuesta de un servidor tras destruir la pagina', async () => {
    fixture.destroy();

    respuestas[0](true);
    await vi.advanceTimersByTimeAsync(0);

    expect(preparar).not.toHaveBeenCalled();
  });
});
