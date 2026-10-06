import { Candidatura } from './dominio';
import { CLAVES_POR_DEFECTO, COLUMNAS, columnasGuardadas, conDato, valorDeCelda } from './columnas';

const UNA: Candidatura = {
  id: 'n1',
  estado: 'Enviado',
  fechaEnvio: '2026-10-05',
  fase: 'CV enviado',
  oferta: { id: 'o1', empresa: 'Acme', puesto: 'Frontend', idioma: 'en', verificada: true },
};

describe('Catalogo de columnas', () => {
  it('por defecto se ven las de la maqueta aprobada', () => {
    expect(CLAVES_POR_DEFECTO).toEqual([
      'empresa',
      'puesto',
      'estado',
      'modalidad',
      'ubicacion',
      'salario',
      'viaEnvio',
      'fechaEnvio',
      'fechaPublicacion',
      'enlace',
      'cv',
    ]);
  });

  it('tiene todos los campos de Notion, en sus tres grupos', () => {
    expect(COLUMNAS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(COLUMNAS.map((c) => c.grupo))).toEqual(new Set(['Oferta', 'Candidatura', 'Documentos']));
  });

  it('la empresa no se puede quitar: es la que dice de que fila se trata', () => {
    expect(COLUMNAS.filter((c) => c.fija).map((c) => c.clave)).toEqual(['empresa']);
  });
});

describe('valorDeCelda', () => {
  const columna = (clave: string) => COLUMNAS.find((c) => c.clave === clave)!;

  it('las fechas se leen en formato espanol', () => {
    expect(valorDeCelda(UNA, columna('fechaEnvio'))).toBe('05/10/2026');
  });

  it('una casilla marcada se lee Si, y sin marcar no dice nada', () => {
    expect(valorDeCelda(UNA, columna('verificada'))).toBe('Sí');
    expect(valorDeCelda(UNA, columna('avisoAutonoma'))).toBe('');
  });

  it('cada columna lee de la oferta o de la candidatura, segun de quien sea', () => {
    expect(valorDeCelda(UNA, columna('puesto'))).toBe('Frontend');
    expect(valorDeCelda(UNA, columna('fase'))).toBe('CV enviado');
  });
});

describe('conDato', () => {
  it('cuenta cuantas fichas tienen algo en esa columna, para saber si merece la pena', () => {
    const otra: Candidatura = { ...UNA, id: 'n2', fase: undefined };

    expect(conDato([UNA, otra], COLUMNAS.find((c) => c.clave === 'fase')!)).toBe(1);
  });
});

describe('columnasGuardadas', () => {
  it('se queda con las columnas que existen y siempre incluye la empresa', () => {
    expect(columnasGuardadas(['salario', 'inventada', 'fase'])).toEqual(['empresa', 'salario', 'fase']);
  });

  it('algo que no es una lista de nombres no vale', () => {
    expect(columnasGuardadas(null)).toBeNull();
    expect(columnasGuardadas('salario')).toBeNull();
    expect(columnasGuardadas([1, 2])).toBeNull();
  });
});
