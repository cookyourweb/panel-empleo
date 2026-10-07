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
      expect.any(AbortSignal),
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

  it('al empezar un intento nuevo quita el error del anterior', async () => {
    const pagina = await abrir();
    await recibir(RESULTADO_DE_ENTRADA.rechazada);
    expect(pagina.querySelector('[role="alert"]')).not.toBeNull();

    let terminar: (resultado: ResultadoDeEntrada) => void = () => undefined;
    entrar.mockReturnValue(new Promise<ResultadoDeEntrada>((resolver) => (terminar = resolver)));
    identidad.alRecibir?.('otra-credencial');
    await vi.waitFor(() => expect(entrar).toHaveBeenCalledTimes(2));
    fixture.detectChanges();

    expect(pagina.querySelector('[role="alert"]')).toBeNull();
    terminar(RESULTADO_DE_ENTRADA.rechazada);
    await fixture.whenStable();
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
  const region = () => pagina().querySelector('[role="status"]');
  // El aviso solo cuenta como mostrado si la region tiene texto: la region
  // vive siempre en la pagina para que los lectores de pantalla la anuncien.
  const aviso = () => (region()?.textContent?.trim() ? region() : null);
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
      expect.any(AbortSignal),
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
    // El intento 0 sigue pendiente: nunca ha respondido, solo se agoto el plazo.
    await pasar(90000);
    expect(reintentar()).toBeDefined();
    reintentar()?.click();
    await pasar(0);

    await responder(true, 0);
    expect(preparar).not.toHaveBeenCalled();

    await responder(true, 1);
    expect(preparar).toHaveBeenCalledTimes(1);
  });

  it('al destruir la pagina se limpian los plazos', async () => {
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    fixture.destroy();

    // Antes de dejar correr el tiempo: si avanzaramos primero, los plazos
    // vencerian solos y el test pasaria aunque no se limpiaran.
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(120000);
    expect(comprobar).toHaveBeenCalledTimes(1);
  });

  it('mantiene una unica region de estado siempre presente, aunque este vacia', async () => {
    const inicial = region();
    expect(inicial).not.toBeNull();
    expect(inicial?.textContent?.trim()).toBe('');

    await pasar(3000);

    expect(pagina().querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(region()).toBe(inicial);
    expect(region()?.textContent).toContain(MENSAJE_DESPERTANDO);
  });

  it('si el script de identidad no carga lo dice con un alert y no deja la pagina muda', async () => {
    preparar.mockRejectedValueOnce(new Error('script bloqueado'));

    await responder(true);

    const alerta = pagina().querySelector('[role="alert"]');
    expect(alerta?.textContent).toContain('No se pudo cargar el acceso con Google');
    expect(alerta?.textContent).toContain('recarga la página');
  });

  it('pasa al proveedor una senal que se cancela al destruir la pagina', async () => {
    await responder(true);
    const senal = preparar.mock.calls[0][2] as AbortSignal;
    expect(senal.aborted).toBe(false);

    fixture.destroy();

    expect(senal.aborted).toBe(true);
  });

  it('un intento nuevo cancela la preparacion del anterior', async () => {
    await responder(true);
    const primera = preparar.mock.calls[0][2] as AbortSignal;

    fixture.componentInstance['reintentar']();
    await pasar(0);

    expect(primera.aborted).toBe(true);
  });

  it('al pulsar reintentar el foco pasa al main en vez de perderse en el body', async () => {
    const principal = document.createElement('main');
    principal.tabIndex = -1;
    document.body.appendChild(principal);
    principal.appendChild(pagina());
    await responder(false);

    reintentar()?.focus();
    reintentar()?.click();
    await pasar(0);

    expect(document.activeElement).toBe(principal);
    principal.remove();
  });

  it('ignora la respuesta de un servidor tras destruir la pagina', async () => {
    fixture.destroy();

    respuestas[0](true);
    await vi.advanceTimersByTimeAsync(0);

    expect(preparar).not.toHaveBeenCalled();
  });
});
