import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

import { BusquedaDeOfertas } from './busqueda-de-ofertas';
import { BusquedaProgresoService } from './busqueda-progreso.service';
import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';
import { Sesion } from '../sesion/sesion';
import { EventoDeBusqueda } from './evento-de-busqueda';

class ServicioFake {
  private subject = new Subject<EventoDeBusqueda>();
  buscar = vi.fn().mockReturnValue(this.subject.asObservable());
  emitir(evento: EventoDeBusqueda) { this.subject.next(evento); }
  completar() { this.subject.complete(); }
  error(e: unknown) { this.subject.error(e); }
}

describe('BusquedaDeOfertas', () => {
  let fixture: ComponentFixture<BusquedaDeOfertas>;
  let componente: BusquedaDeOfertas;
  let servicio: ServicioFake;
  let sesion: Sesion;

  beforeEach(async () => {
    servicio = new ServicioFake();
    await TestBed.configureTestingModule({
      imports: [BusquedaDeOfertas],
      providers: [
        { provide: BusquedaProgresoService, useValue: servicio },
        { provide: CONFIGURACION_DE_SESION, useValue: { urlApi: 'http://api.test' } },
        Sesion,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(BusquedaDeOfertas);
    componente = fixture.componentInstance;
    sesion = TestBed.inject(Sesion);
    (sesion as any).credencial = 'jwt-test';
    (sesion as any)._usuaria.set({ sub: 'u-123' });
    fixture.detectChanges();
  });

  it('estado inicial idle y botón habilitado', () => {
    expect(componente.etapa()).toBe('idle');
    expect(componente.enCurso()).toBe(false);
  });

  it('sin sesión marca error sin llamar al servicio', () => {
    (sesion as any)._usuaria.set(null);
    componente.iniciar();
    expect(componente.error()).toBe('sin sesión');
    expect(servicio.buscar).not.toHaveBeenCalled();
  });

  it('iniciar llama al servicio con usuarioId', () => {
    componente.iniciar();
    expect(servicio.buscar).toHaveBeenCalledWith({ usuarioId: 'u-123', topN: 5 });
  });

  it('no permite doble inicio', () => {
    componente.iniciar();
    const llamadas = (servicio.buscar as any).mock.calls.length;
    componente.iniciar();
    expect((servicio.buscar as any).mock.calls.length).toBe(llamadas);
  });

  it('transiciones actualizan etapa y detalle', () => {
    componente.iniciar();
    servicio.emitir({ stage: 'searching', detail: 'buscando' });
    fixture.detectChanges();
    expect(componente.etapa()).toBe('searching');
    expect(componente.detalle()).toBe('buscando');
    expect(componente.enCurso()).toBe(true);
  });

  it('done actualiza resumen y desactiva enCurso', () => {
    componente.iniciar();
    servicio.emitir({ stage: 'done', summary: { ok: true, creadas: 3 } });
    fixture.detectChanges();
    expect(componente.etapa()).toBe('done');
    expect(componente.resumen()?.creadas).toBe(3);
    expect(componente.enCurso()).toBe(false);
  });

  it('done muestra cada oferta con puesto, empresa y enlace que abre en otra pestaña', () => {
    componente.iniciar();
    servicio.emitir({
      stage: 'done',
      summary: {
        ok: true,
        creadas: 2,
        ofertas: [
          { puesto: 'AI Engineer', empresa: 'Acme', ubicacion: 'Europe', modalidad: 'Remoto', salario: '70k', link: 'https://remotive.com/1', score: 87, fuente: 'remotive' },
          { puesto: 'Dev', empresa: 'Beta', ubicacion: '', modalidad: '', salario: '', link: '', score: null, fuente: 'tecnoempleo' },
        ],
      },
    });
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('[data-test="oferta"]');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('AI Engineer');
    expect(items[0].textContent).toContain('Acme');
    const enlace = items[0].querySelector('a');
    expect(enlace.getAttribute('href')).toBe('https://remotive.com/1');
    expect(enlace.getAttribute('target')).toBe('_blank');
    expect(enlace.getAttribute('rel')).toContain('noopener');
    expect(items[1].querySelector('a')).toBeNull();
  });

  it('error de negocio muestra aviso', () => {
    componente.iniciar();
    servicio.emitir({ stage: 'error', detail: 'boom' });
    fixture.detectChanges();
    expect(componente.error()).toBe('boom');
    expect(componente.enCurso()).toBe(false);
  });

  it('error del observable muestra aviso', () => {
    componente.iniciar();
    servicio.error(new Error('caída'));
    fixture.detectChanges();
    expect(componente.error()).toBe('caída');
    expect(componente.enCurso()).toBe(false);
  });

  it('cancelar resetea estado', () => {
    componente.iniciar();
    componente.cancelar();
    expect(componente.enCurso()).toBe(false);
    expect(componente.etapa()).toBe('idle');
  });
});