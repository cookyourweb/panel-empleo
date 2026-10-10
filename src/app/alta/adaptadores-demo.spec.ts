import { Perfil } from './dominio';
import { ExtractorDeCvDemo } from './extractor-de-cv-demo';
import { RepositorioDePerfilDemo } from './repositorio-de-perfil-demo';

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

describe('RepositorioDePerfilDemo', () => {
  it('empieza sin perfil', async () => {
    expect(await new RepositorioDePerfilDemo().obtener()).toBeNull();
  });

  it('lo que se guarda se vuelve a leer, en memoria', async () => {
    const repositorio = new RepositorioDePerfilDemo();

    await repositorio.guardar(PERFIL);

    expect(await repositorio.obtener()).toEqual(PERFIL);
    expect(await new RepositorioDePerfilDemo().obtener()).toBeNull();
  });

  it('consentir no falla', async () => {
    await expect(new RepositorioDePerfilDemo().consentir('almacenar_cv', 'v1')).resolves.toBeUndefined();
  });
});

describe('ExtractorDeCvDemo', () => {
  const archivo = new File(['x'], 'cv.pdf', { type: 'application/pdf' });

  it('subir acepta el archivo sin leerlo', async () => {
    await expect(new ExtractorDeCvDemo().subir(archivo)).resolves.toBeUndefined();
  });

  it('extraer es determinista y propone solo campos extraibles, cada uno con su cita', async () => {
    const extractor = new ExtractorDeCvDemo();

    const primero = await extractor.extraer();
    const segundo = await extractor.extraer();

    expect(primero).toEqual(segundo);
    expect(primero.estado).toBe('propuesta');
    if (primero.estado === 'propuesta') {
      expect(primero.propuestas.length).toBeGreaterThan(0);
      expect(primero.propuestas.every((p) => p.cita.length > 0)).toBe(true);
    }
  });
});
