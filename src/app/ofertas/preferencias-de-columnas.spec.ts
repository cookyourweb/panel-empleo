import { TestBed } from '@angular/core/testing';

import { CLAVES_POR_DEFECTO, COLUMNAS } from './columnas';
import { CLAVE_DE_ALMACEN, PreferenciasDeColumnas } from './preferencias-de-columnas';

describe('PreferenciasDeColumnas', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  const crear = () => TestBed.inject(PreferenciasDeColumnas);

  it('sin nada guardado, las columnas por defecto', () => {
    expect([...crear().visibles()]).toEqual(CLAVES_POR_DEFECTO);
  });

  it('quitar y poner una columna se recuerda para la proxima vez', () => {
    crear().alternar('salario');

    expect(JSON.parse(localStorage.getItem(CLAVE_DE_ALMACEN)!)).not.toContain('salario');
  });

  it('al volver, recupera las que se eligieron', () => {
    localStorage.setItem(CLAVE_DE_ALMACEN, JSON.stringify(['empresa', 'fase']));

    expect([...crear().visibles()]).toEqual(['empresa', 'fase']);
  });

  it('la empresa no se puede quitar', () => {
    const prefs = crear();
    prefs.alternar('empresa');

    expect(prefs.visibles().has('empresa')).toBe(true);
  });

  it('Todas las enseña todas y Por defecto vuelve a las de la maqueta', () => {
    const prefs = crear();
    prefs.todas();
    expect(prefs.visibles().size).toBe(COLUMNAS.length);

    prefs.porDefecto();
    expect([...prefs.visibles()]).toEqual(CLAVES_POR_DEFECTO);
  });

  it('si el navegador no deja guardar, la tabla sigue funcionando', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });

    const prefs = crear();
    prefs.alternar('fase');

    expect(prefs.visibles().has('fase')).toBe(true);
  });
});
