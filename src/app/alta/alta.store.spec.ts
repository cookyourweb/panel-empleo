import { TestBed } from '@angular/core/testing';

import { AltaStore } from './alta.store';
import { Perfil, ResultadoExtraccion, SubidaRechazada, TIPOS_DE_CONSENTIMIENTO, VERSION_DE_CONSENTIMIENTO } from './dominio';
import { ExtractorDeCv } from './extractor-de-cv';
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
  let store: AltaStore;

  beforeEach(() => {
    repositorio = { obtener: vi.fn(), guardar: vi.fn().mockResolvedValue(undefined), consentir: vi.fn().mockResolvedValue(undefined) };
    extractor = { subir: vi.fn().mockResolvedValue(undefined), extraer: vi.fn().mockResolvedValue(PROPUESTA) };
    TestBed.configureTestingModule({
      providers: [
        AltaStore,
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

  describe('guardar', () => {
    it('guarda el perfil y termina (REQ-5.5: solo al confirmar)', async () => {
      store.irAManual();
      expect(repositorio.guardar).not.toHaveBeenCalled();

      await store.guardar(PERFIL);

      expect(repositorio.guardar).toHaveBeenCalledWith(PERFIL);
      expect(store.paso()).toBe('hecho');
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
