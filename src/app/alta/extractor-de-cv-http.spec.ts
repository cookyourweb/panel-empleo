import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CONFIGURACION_DE_SESION } from '../sesion/configuracion';
import { SubidaRechazada } from './dominio';
import { ExtractorDeCvHttp } from './extractor-de-cv-http';

const URL_API = 'http://api.prueba';

describe('ExtractorDeCvHttp', () => {
  let extractor: ExtractorDeCvHttp;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ExtractorDeCvHttp,
        { provide: CONFIGURACION_DE_SESION, useValue: { urlApi: URL_API, idCliente: 'cliente' } },
      ],
    });
    extractor = TestBed.inject(ExtractorDeCvHttp);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('subir', () => {
    const archivo = new File(['%PDF-1.4'], 'cv.pdf', { type: 'application/pdf' });

    it('manda POST /cv multipart con el campo archivo', async () => {
      const resultado = extractor.subir(archivo);
      const peticion = http.expectOne(`${URL_API}/cv`);

      expect(peticion.request.method).toBe('POST');
      expect(peticion.request.body).toBeInstanceOf(FormData);
      expect((peticion.request.body as FormData).get('archivo')).toBeInstanceOf(File);
      peticion.flush({ idioma: 'es', formato: 'pdf', caracteres: 3000 }, { status: 201, statusText: 'Created' });

      await resultado;
    });

    it.each([
      [413, 'tamano'],
      [415, 'tipo'],
      [422, 'ilegible'],
      [403, 'sinConsentimiento'],
      [500, 'servidor'],
    ] as const)('un %i se convierte en SubidaRechazada(%s) (S5.7)', async (status, motivo) => {
      const resultado = extractor.subir(archivo);
      http.expectOne(`${URL_API}/cv`).flush(null, { status, statusText: 'Error' });

      const error = await resultado.catch((e: unknown) => e);

      expect(error).toBeInstanceOf(SubidaRechazada);
      expect((error as SubidaRechazada).motivo).toBe(motivo);
    });

    it('sin red es un fallo de servidor', async () => {
      const resultado = extractor.subir(archivo);
      http.expectOne(`${URL_API}/cv`).error(new ProgressEvent('error'));

      const error = await resultado.catch((e: unknown) => e);

      expect((error as SubidaRechazada).motivo).toBe('servidor');
    });
  });

  describe('extraer', () => {
    it('manda POST /extraccion y lee las propuestas con su cita', async () => {
      const resultado = extractor.extraer();
      const peticion = http.expectOne(`${URL_API}/extraccion`);

      expect(peticion.request.method).toBe('POST');
      peticion.flush({
        estado: 'propuesta',
        propuestas: [
          { campo: 'rol', valor: 'Frontend', cita: 'Frontend developer' },
          { campo: 'anios_experiencia', valor: 20, cita: '20 anos' },
          { campo: 'stack', valor: ['Angular', 'TypeScript'], cita: 'Angular, TypeScript' },
        ],
      });

      expect(await resultado).toEqual({
        estado: 'propuesta',
        propuestas: [
          { campo: 'rol', valor: 'Frontend', cita: 'Frontend developer' },
          { campo: 'aniosExperiencia', valor: '20', cita: '20 anos' },
          { campo: 'stack', valor: 'Angular, TypeScript', cita: 'Angular, TypeScript' },
        ],
      });
    });

    it('descarta propuestas de campos desconocidos: salario no se acepta ni si llega (REQ-4.6)', async () => {
      const resultado = extractor.extraer();
      http.expectOne(`${URL_API}/extraccion`).flush({
        estado: 'propuesta',
        propuestas: [
          { campo: 'salario_min', valor: 200000, cita: 'x' },
          { campo: 'rol', valor: 'Frontend', cita: 'Frontend' },
          { campo: 'rol', valor: 'sin cita' },
        ],
      });

      expect(await resultado).toEqual({
        estado: 'propuesta',
        propuestas: [{ campo: 'rol', valor: 'Frontend', cita: 'Frontend' }],
      });
    });

    it('traslada el estado manual con su motivo', async () => {
      const resultado = extractor.extraer();
      http.expectOne(`${URL_API}/extraccion`).flush({ estado: 'manual', motivo: 'tope' });

      expect(await resultado).toEqual({ estado: 'manual', motivo: 'tope' });
    });

    it('un motivo desconocido se trata como indisponible', async () => {
      const resultado = extractor.extraer();
      http.expectOne(`${URL_API}/extraccion`).flush({ estado: 'manual', motivo: 'raro' });

      expect(await resultado).toEqual({ estado: 'manual', motivo: 'indisponible' });
    });

    it('una respuesta que no es un resultado conocido lleva al formulario manual', async () => {
      const resultado = extractor.extraer();
      http.expectOne(`${URL_API}/extraccion`).flush({ cualquier: 'cosa' });

      expect(await resultado).toEqual({ estado: 'manual', motivo: 'indisponible' });
    });

    it.each([403, 404, 500])('un %i no deja sin salida: formulario manual (REQ-5.4)', async (status) => {
      const resultado = extractor.extraer();
      http.expectOne(`${URL_API}/extraccion`).flush(null, { status, statusText: 'Error' });

      expect(await resultado).toEqual({ estado: 'manual', motivo: 'indisponible' });
    });

    it('sin red tambien va al formulario manual', async () => {
      const resultado = extractor.extraer();
      http.expectOne(`${URL_API}/extraccion`).error(new ProgressEvent('error'));

      expect(await resultado).toEqual({ estado: 'manual', motivo: 'indisponible' });
    });
  });
});
