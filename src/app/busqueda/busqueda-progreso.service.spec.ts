import { TestBed } from '@angular/core/testing';
import { firstValueFrom, lastValueFrom } from 'rxjs';

import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';
import { Sesion } from '../sesion/sesion';
import { BusquedaProgresoService } from './busqueda-progreso.service';
import { EventoDeBusqueda } from './evento-de-busqueda';

class EventSourceFake {
  static instancias: EventSourceFake[] = [];
  url: string;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;
  constructor(url: string) {
    this.url = url;
    EventSourceFake.instancias.push(this);
  }
  close() { this.closed = true; }
  emitir(data: string) { this.onmessage?.({ data }); }
  fallar() { this.onerror?.(); }
}

describe('BusquedaProgresoService', () => {
  let servicio: BusquedaProgresoService;
  let sesion: Sesion;

  beforeEach(() => {
    EventSourceFake.instancias = [];
    (globalThis as any).EventSource = EventSourceFake;
    TestBed.configureTestingModule({
      providers: [
        BusquedaProgresoService,
        { provide: CONFIGURACION_DE_SESION, useValue: { urlApi: 'http://api.test' } },
        Sesion,
      ],
    });
    servicio = TestBed.inject(BusquedaProgresoService);
    sesion = TestBed.inject(Sesion);
  });

  afterEach(() => {
    delete (globalThis as any).EventSource;
  });

  function entrar() {
    // Sesion.entrar needs /yo; instead set credencial via reflection for tests.
    (sesion as any).credencial = 'jwt-test';
    (sesion as any)._usuaria.set({ sub: 'u-123' });
  }

  it('sin sesión emite error sin abrir EventSource', async () => {
    await expect(firstValueFrom(servicio.buscar({ usuarioId: 'u-123' }))).rejects.toThrow('sin sesión');
    expect(EventSourceFake.instancias.length).toBe(0);
  });

  it('construye la URL con usuario_id, top_n y token', () => {
    entrar();
    servicio.buscar({ usuarioId: 'u-123', topN: 7 }).subscribe({ next: () => {}, error: () => {} });
    const url = new URL(EventSourceFake.instancias[0].url);
    expect(url.searchParams.get('usuario_id')).toBe('u-123');
    expect(url.searchParams.get('top_n')).toBe('7');
    expect(url.searchParams.get('token')).toBe('jwt-test');
  });

  it('emite eventos y se completa en done, cerrando la conexión', async () => {
    entrar();
    const promesa = lastValueFrom(servicio.buscar({ usuarioId: 'u-123' }));
    const fuente = EventSourceFake.instancias[0];
    fuente.emitir(JSON.stringify({ stage: 'searching' }));
    fuente.emitir(JSON.stringify({ stage: 'done', summary: { ok: true, creadas: 2 } }));
    const ultimo = await promesa;
    expect(ultimo.stage).toBe('done');
    expect(fuente.closed).toBe(true);
  });

  it('error de negocio completa tras emitir', async () => {
    entrar();
    const promesa = firstValueFrom(servicio.buscar({ usuarioId: 'u-123' }));
    const fuente = EventSourceFake.instancias[0];
    fuente.emitir(JSON.stringify({ stage: 'error', detail: 'boom' }));
    const ultimo = await promesa;
    expect(ultimo.stage).toBe('error');
    expect(fuente.closed).toBe(true);
  });

  it('onerror del transporte emite error y cierra', async () => {
    entrar();
    const promesa = firstValueFrom(servicio.buscar({ usuarioId: 'u-123' }));
    const fuente = EventSourceFake.instancias[0];
    fuente.fallar();
    await expect(promesa).rejects.toThrow('conexión SSE interrumpida');
    expect(fuente.closed).toBe(true);
  });

  it('JSON malformado emite error y cierra', async () => {
    entrar();
    const promesa = firstValueFrom(servicio.buscar({ usuarioId: 'u-123' }));
    const fuente = EventSourceFake.instancias[0];
    fuente.emitir('{not json');
    await expect(promesa).rejects.toThrow('evento SSE malformado');
    expect(fuente.closed).toBe(true);
  });

  it('desuscribirse a mitad cierra la conexión', () => {
    entrar();
    const sub = servicio.buscar({ usuarioId: 'u-123' }).subscribe({ next: () => {}, error: () => {} });
    const fuente = EventSourceFake.instancias[0];
    sub.unsubscribe();
    expect(fuente.closed).toBe(true);
  });
});