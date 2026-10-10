import { elegirAdaptadoresDeAlta } from './elegir-adaptadores';
import { ExtractorDeCvDemo } from './extractor-de-cv-demo';
import { ExtractorDeCvHttp } from './extractor-de-cv-http';
import { RepositorioDePerfilDemo } from './repositorio-de-perfil-demo';
import { RepositorioDePerfilHttp } from './repositorio-de-perfil-http';

describe('elegirAdaptadoresDeAlta', () => {
  it('con backend usa los adaptadores http', () => {
    expect(elegirAdaptadoresDeAlta(true)).toEqual({
      repositorio: RepositorioDePerfilHttp,
      extractor: ExtractorDeCvHttp,
    });
  });

  it('sin backend usa la demo: ningun dato sale del navegador', () => {
    expect(elegirAdaptadoresDeAlta(false)).toEqual({
      repositorio: RepositorioDePerfilDemo,
      extractor: ExtractorDeCvDemo,
    });
  });
});
