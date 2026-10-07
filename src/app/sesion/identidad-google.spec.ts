import { TestBed } from '@angular/core/testing';

import { CONFIGURACION_DE_SESION } from './configuracion';
import { IdentidadGoogle } from './identidad-google';

const URL_SCRIPT = 'https://accounts.google.com/gsi/client';

function scriptsInyectados(): HTMLScriptElement[] {
  return Array.from(document.head.querySelectorAll<HTMLScriptElement>(`script[src="${URL_SCRIPT}"]`));
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
});
