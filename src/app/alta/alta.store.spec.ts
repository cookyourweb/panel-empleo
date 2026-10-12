import { TestBed } from '@angular/core/testing';

import { AltaStore } from './alta.store';
import { Perfil, ResultadoExtraccion, SubidaRechazada, TIPOS_DE_CONSENTIMIENTO, VERSION_DE_CONSENTIMIENTO } from './dominio';
import { ExtractorDeCv } from './extractor-de-cv';
import { Sesion } from '../sesion/sesion';
import { RepositorioDePerfil } from './repositorio-de-perfil';

const PERFIL: Perfil = {
  rol: 'Frontend',
  aniosExperiencia: 20,
  stack: ['Angular'],
  idiomas: ['es'],
  ubicacion: 'Madrid',
  modalidad: ['remoto'],
  salarioMin: 50000,
  salarioMoneda: 'EUR',
};

const ARCHIVO = new File(['%PDF-'], 'cv.pdf', { type: 'application/pdf' });

const PROPUESTA: ResultadoExtraccion = {
  estado: 'propuesta',
  propuestas: [{ campo: 'rol', valor: 'Frontend', cita: 'Frontend developer' }],
};

function aplazada<T>(): { promesa: Promise<T>; resolver: (valor: T) => void } {
  let resolver!: (valor: T) => void;
  const promesa = new Promise<T>((r) => (resolver = r));
  return { promesa, resolver };
}

describe('AltaStore', () => {
  let repositorio: { obtener: ReturnType<typeof vi.fn>; guardar: ReturnType<typeof vi.fn>; consentir: ReturnType<typeof vi.fn> };
  let extractor: { subir: ReturnType<typeof vi.fn>; extraer: ReturnType<typeof vi.fn> };
  let sesion: { perfilGuardado: ReturnType<typeof vi.fn> };
  let store: AltaStore;

  beforeEach(() => {
    repositorio = { obtener: vi.fn(), guardar: vi.fn().mockResolvedValue(undefined), consentir: vi.fn().mockResolvedValue(undefined) };
    extractor = { subir: vi.fn().mockResolvedValue(undefined), extraer: vi.fn().mockResolvedValue(PROPUESTA) };
    sesion = { perfilGuardado: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        AltaStore,
        { provide: Sesion, useValue: sesion },
        { provide: RepositorioDePerfil, useValue: repositorio },
        { provide: ExtractorDeCv, useValue: extractor },
      ],
    });
    store = TestBed.inject(AltaStore);
  });

  async function hastaSubida(): Promise<void> {
    await store.consentir();
  }

  it('empieza en el consentimiento', () => {
    expect(store.paso()).toBe('consentimiento');
  });

  describe('consentir', () => {
    it('registra los dos consentimientos con la version y pasa a la subida', async () => {
      await store.consentir();

      expect(repositorio.consentir).toHaveBeenCalledWith(TIPOS_DE_CONSENTIMIENTO.almacenarCv, VERSION_DE_CONSENTIMIENTO);
      expect(repositorio.consentir).toHaveBeenCalledWith(TIPOS_DE_CONSENTIMIENTO.enviarCvAIa, VERSION_DE_CONSENTIMIENTO);
      expect(store.paso()).toBe('subida');
    });

    it('si el servidor falla se queda en el consentimiento y lo dice', async () => {
      repositorio.consentir.mockRejectedValue(new Error('500'));

      await store.consentir();

      expect(store.paso()).toBe('consentimiento');
      expect(store.errorDeConsentimiento()).toBe(true);
    });

    it('un reintento limpia el error', async () => {
      repositorio.consentir.mockRejectedValueOnce(new Error('500'));
      await store.consentir();

      await store.consentir();

      expect(store.errorDeConsentimiento()).toBe(false);
      expect(store.paso()).toBe('subida');
    });
  });

  describe('subirCv', () => {
    it('sin consentimiento no hace ninguna peticion (S5.3)', async () => {
      await store.subirCv(ARCHIVO);

      expect(extractor.subir).not.toHaveBeenCalled();
      expect(extractor.extraer).not.toHaveBeenCalled();
      expect(store.paso()).toBe('consentimiento');
    });

    it('recuerda el archivo elegido mientras sube, para poder mostrarlo', async () => {
      await hastaSubida();
      extractor.subir.mockReturnValueOnce(new Promise<void>(() => undefined));
      expect(store.archivoElegido()).toBeNull();

      void store.subirCv(ARCHIVO);
      await Promise.resolve();

      expect(store.archivoElegido()).toEqual({ nombre: 'cv.pdf', tamano: ARCHIVO.size });
    });

    it('pasa por extrayendo y termina en la revision con las propuestas', async () => {
      await hastaSubida();
      const espera = aplazada<ResultadoExtraccion>();
      extractor.extraer.mockReturnValue(espera.promesa);

      const subida = store.subirCv(ARCHIVO);
      await Promise.resolve();
      expect(store.paso()).toBe('extrayendo');

      espera.resolver(PROPUESTA);
      await subida;

      expect(extractor.subir).toHaveBeenCalledWith(ARCHIVO);
      expect(store.paso()).toBe('revision');
      expect(store.propuestas()).toEqual(PROPUESTA.estado === 'propuesta' ? PROPUESTA.propuestas : []);
    });

    it('si la extraccion no esta disponible va al formulario manual con el motivo', async () => {
      await hastaSubida();
      extractor.extraer.mockResolvedValue({ estado: 'manual', motivo: 'tope' });

      await store.subirCv(ARCHIVO);

      expect(store.paso()).toBe('manual');
      expect(store.motivoManual()).toBe('tope');
    });

    it('cvGuardado empieza en falso y pasa a verdadero en cuanto el servidor acepta el archivo', async () => {
      await hastaSubida();
      expect(store.cvGuardado()).toBe(false);
      const espera = aplazada<ResultadoExtraccion>();
      extractor.extraer.mockReturnValue(espera.promesa);

      const subida = store.subirCv(ARCHIVO);
      await vi.waitFor(() => expect(store.cvGuardado()).toBe(true));
      expect(store.paso()).toBe('extrayendo');

      espera.resolver(PROPUESTA);
      await subida;
    });

    it('cvGuardado sigue verdadero aunque la lectura no este disponible', async () => {
      await hastaSubida();
      extractor.extraer.mockResolvedValue({ estado: 'manual', motivo: 'indisponible' });

      await store.subirCv(ARCHIVO);

      expect(store.paso()).toBe('manual');
      expect(store.cvGuardado()).toBe(true);
    });

    it('un archivo rechazado no marca el CV como guardado', async () => {
      await hastaSubida();
      extractor.subir.mockRejectedValue(new SubidaRechazada('tamano'));

      await store.subirCv(ARCHIVO);

      expect(store.cvGuardado()).toBe(false);
    });

    it('un archivo rechazado vuelve a la subida con el motivo y sin extraer (S5.7)', async () => {
      await hastaSubida();
      extractor.subir.mockRejectedValue(new SubidaRechazada('tipo'));

      await store.subirCv(ARCHIVO);

      expect(store.paso()).toBe('subida');
      expect(store.rechazoDeSubida()).toBe('tipo');
      expect(extractor.extraer).not.toHaveBeenCalled();
    });

    it('un fallo inesperado al subir cuenta como fallo de servidor', async () => {
      await hastaSubida();
      extractor.subir.mockRejectedValue(new Error('raro'));

      await store.subirCv(ARCHIVO);

      expect(store.paso()).toBe('subida');
      expect(store.rechazoDeSubida()).toBe('servidor');
    });

    it('tras un rechazo se puede subir otro y el aviso desaparece', async () => {
      await hastaSubida();
      extractor.subir.mockRejectedValueOnce(new SubidaRechazada('tamano'));
      await store.subirCv(ARCHIVO);

      await store.subirCv(ARCHIVO);

      expect(store.rechazoDeSubida()).toBeNull();
      expect(store.paso()).toBe('revision');
    });
  });

  describe('irAManual', () => {
    it('se puede desde el consentimiento y desde la subida, sin motivo', async () => {
      store.irAManual();
      expect(store.paso()).toBe('manual');
      expect(store.motivoManual()).toBeNull();
    });

    it('desde la subida tambien', async () => {
      await hastaSubida();

      store.irAManual();

      expect(store.paso()).toBe('manual');
    });

    it('no se puede una vez en la revision', async () => {
      await hastaSubida();
      await store.subirCv(ARCHIVO);

      store.irAManual();

      expect(store.paso()).toBe('revision');
    });
  });

  describe('consentido', () => {
    it('empieza en falso, pasa a verdadero al registrar los consentimientos y no si se va a mano', async () => {
      expect(store.consentido()).toBe(false);

      await store.consentir();

      expect(store.consentido()).toBe(true);
    });

    it('rellenar a mano sin consentir lo deja en falso', () => {
      store.irAManual();

      expect(store.consentido()).toBe(false);
    });

    it('si el servidor falla no cuenta como consentido', async () => {
      repositorio.consentir.mockRejectedValue(new Error('500'));

      await store.consentir();

      expect(store.consentido()).toBe(false);
    });
  });

  describe('estado ocupado', () => {
    it('consentiendo es verdadero solo mientras el servidor registra el consentimiento', async () => {
      const espera = aplazada<void>();
      repositorio.consentir.mockReturnValue(espera.promesa);
      expect(store.consentiendo()).toBe(false);

      const consentimiento = store.consentir();
      expect(store.consentiendo()).toBe(true);

      espera.resolver();
      await consentimiento;
      expect(store.consentiendo()).toBe(false);
    });

    it('consentiendo vuelve a falso si el servidor falla', async () => {
      repositorio.consentir.mockRejectedValue(new Error('500'));

      await store.consentir();

      expect(store.consentiendo()).toBe(false);
    });

    it('guardando es verdadero mientras se guarda y un segundo guardar no repite la peticion', async () => {
      store.irAManual();
      const espera = aplazada<void>();
      repositorio.guardar.mockReturnValue(espera.promesa);

      const primero = store.guardar(PERFIL);
      const segundo = store.guardar(PERFIL);
      expect(store.guardando()).toBe(true);

      espera.resolver();
      await Promise.all([primero, segundo]);
      expect(store.guardando()).toBe(false);
      expect(repositorio.guardar).toHaveBeenCalledTimes(1);
    });

    it('guardando vuelve a falso si el servidor falla', async () => {
      store.irAManual();
      repositorio.guardar.mockRejectedValue(new Error('422'));

      await store.guardar(PERFIL);

      expect(store.guardando()).toBe(false);
    });
  });

  describe('guardar', () => {
    it('guarda el perfil y termina (REQ-5.5: solo al confirmar)', async () => {
      store.irAManual();
      expect(repositorio.guardar).not.toHaveBeenCalled();

      await store.guardar(PERFIL);

      expect(repositorio.guardar).toHaveBeenCalledWith(PERFIL);
      expect(store.paso()).toBe('hecho');
    });

    it('avisa a la sesion de que ya hay perfil, para que las guardas no la devuelvan al alta', async () => {
      store.irAManual();

      await store.guardar(PERFIL);

      expect(sesion.perfilGuardado).toHaveBeenCalledTimes(1);
    });

    it('si falla el guardado no toca el estado de la sesion', async () => {
      store.irAManual();
      repositorio.guardar.mockRejectedValue(new Error('422'));

      await store.guardar(PERFIL);

      expect(sesion.perfilGuardado).not.toHaveBeenCalled();
    });

    it('si falla se queda donde estaba y lo dice', async () => {
      store.irAManual();
      repositorio.guardar.mockRejectedValue(new Error('422'));

      await store.guardar(PERFIL);

      expect(store.paso()).toBe('manual');
      expect(store.errorDeGuardado()).toBe(true);
    });

    it('no guarda fuera de la revision y del formulario manual', async () => {
      await store.guardar(PERFIL);

      expect(repositorio.guardar).not.toHaveBeenCalled();
      expect(store.paso()).toBe('consentimiento');
    });
  });
});
