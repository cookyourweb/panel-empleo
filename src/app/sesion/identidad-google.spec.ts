import { TestBed } from '@angular/core/testing';

import { CONFIGURACION_DE_SESION } from './configuracion';
import { IdentidadGoogle } from './identidad-google';

const URL_SCRIPT = 'https://accounts.google.com/gsi/client';

function scriptsInyectados(): HTMLScriptElement[] {
  return Array.from(document.head.querySelectorAll<HTMLScriptElement>(`script[src="${URL_SCRIPT}"]`));
}

interface GoogleFalso {
  accounts: {
    id: {
      initialize: ReturnType<typeof vi.fn>;
      renderButton: ReturnType<typeof vi.fn>;
      prompt: ReturnType<typeof vi.fn>;
      disableAutoSelect: ReturnType<typeof vi.fn>;
    };
  };
}

function instalarGoogleFalso(): GoogleFalso {
  const falso: GoogleFalso = {
    accounts: { id: { initialize: vi.fn(), renderButton: vi.fn(), prompt: vi.fn(), disableAutoSelect: vi.fn() } },
  };
  Object.assign(window, { google: falso });
  return falso;
}

describe('IdentidadGoogle', () => {
  let identidad: IdentidadGoogle;
  let contenedor: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        IdentidadGoogle,
        { provide: CONFIGURACION_DE_SESION, useValue: { urlApi: 'http://api.prueba', idCliente: 'cliente-prueba' } },
      ],
    });
    identidad = TestBed.inject(IdentidadGoogle);
    contenedor = document.createElement('div');
  });

  afterEach(() => {
    scriptsInyectados().forEach((script) => script.remove());
    Reflect.deleteProperty(window, 'google');
  });

  describe('carga del script', () => {
    it('inyecta un unico script async en el head', () => {
      void identidad.preparar(contenedor, () => undefined).catch(() => undefined);

      const scripts = scriptsInyectados();
      expect(scripts).toHaveLength(1);
      expect(scripts[0].async).toBe(true);
    });

    it('no vuelve a inyectarlo si se prepara dos veces', () => {
      void identidad.preparar(contenedor, () => undefined).catch(() => undefined);
      void identidad.preparar(contenedor, () => undefined).catch(() => undefined);

      expect(scriptsInyectados()).toHaveLength(1);
    });

    it('rechaza si el script falla al cargar', async () => {
      const preparada = identidad.preparar(contenedor, () => undefined);

      scriptsInyectados()[0].dispatchEvent(new Event('error'));

      await expect(preparada).rejects.toBeDefined();
    });
  });

  describe('acceso', () => {
    let google: GoogleFalso;

    async function preparar(alRecibir: (credencial: string) => void = () => undefined): Promise<void> {
      const preparada = identidad.preparar(contenedor, alRecibir);
      scriptsInyectados()[0].dispatchEvent(new Event('load'));
      await preparada;
    }

    beforeEach(() => {
      google = instalarGoogleFalso();
    });

    it('inicializa con el id de cliente y la seleccion automatica', async () => {
      await preparar();

      expect(google.accounts.id.initialize).toHaveBeenCalledWith(
        expect.objectContaining({ client_id: 'cliente-prueba', auto_select: true }),
      );
    });

    it('pinta el boton en el contenedor y lanza el aviso de una cuenta', async () => {
      await preparar();

      expect(google.accounts.id.renderButton).toHaveBeenCalledWith(contenedor, expect.any(Object));
      expect(google.accounts.id.prompt).toHaveBeenCalled();
    });

    it('reenvia la credencial que entrega Google', async () => {
      const recibidas: string[] = [];
      await preparar((credencial) => recibidas.push(credencial));

      const { callback } = google.accounts.id.initialize.mock.calls[0][0] as {
        callback: (respuesta: { credential: string }) => void;
      };
      callback({ credential: 'jwt-de-prueba' });

      expect(recibidas).toEqual(['jwt-de-prueba']);
    });

    it('olvidar deja de elegir la cuenta sola', async () => {
      await preparar();

      identidad.olvidar();

      expect(google.accounts.id.disableAutoSelect).toHaveBeenCalled();
    });

    it('olvidar sin script cargado no falla', () => {
      Reflect.deleteProperty(window, 'google');

      expect(() => identidad.olvidar()).not.toThrow();
    });
  });
});
