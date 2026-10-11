import { TestBed } from '@angular/core/testing';

import {
  EnlaceLegal,
  ENLACES_LEGALES,
  ENLACES_LEGALES_DE_LA_PLATAFORMA,
  enlacesLegalesDe,
  URL_DE_PRIVACIDAD,
  URL_DE_PRIVACIDAD_DE_EMPLEO,
  UrlDePrivacidad,
} from './enlaces-de-marca';
import { PieDeMarca } from './pie-de-marca';

async function crear(legales?: readonly EnlaceLegal[], privacidad?: UrlDePrivacidad): Promise<HTMLElement> {
  TestBed.configureTestingModule({
    imports: [PieDeMarca],
    providers: [
      ...(legales ? [{ provide: ENLACES_LEGALES, useValue: legales }] : []),
      ...(privacidad !== undefined ? [{ provide: URL_DE_PRIVACIDAD, useValue: privacidad }] : []),
    ],
  });
  const fixture = TestBed.createComponent(PieDeMarca);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('PieDeMarca', () => {
  it('alinea su contenido con el contenedor de la pagina y conserva dentro una columna de lectura', async () => {
    const pie = await crear();

    const contenedor = pie.querySelector('footer > .contenedor-pagina');
    expect(contenedor).not.toBeNull();
    expect(contenedor?.querySelector(':scope > .pie__contenedor')).not.toBeNull();
  });

  it('es el contentinfo, con el titulo Contacto', async () => {
    const pie = await crear();

    expect(pie.querySelectorAll('footer')).toHaveLength(1);
    expect(pie.querySelector('h2')?.textContent).toBe('Contacto');
  });

  it('enlaza el telefono y el email con tel: y mailto:', async () => {
    const pie = await crear();

    const telefono = pie.querySelector('a[href="tel:+34688757782"]');
    const email = pie.querySelector('a[href="mailto:veronica@cookyourwebai.es"]');

    expect(telefono?.textContent).toBe('34 688 75 77 82');
    expect(email?.textContent).toBe('veronica@cookyourwebai.es');
    expect(pie.textContent).toContain('Teléfono:');
    expect(pie.textContent).toContain('Email:');
  });

  it('pone el año actual en los derechos reservados', async () => {
    const pie = await crear();

    expect(pie.textContent).toContain(`© ${new Date().getFullYear()} CookYourWeb. Todos los derechos reservados.`);
  });

  it('cierra con "Hecho con ❤ y mucha AI", con el corazon en su propio color', async () => {
    const pie = await crear();

    const hecho = pie.querySelector('.pie__hecho');

    expect(hecho?.textContent).toBe('Hecho con ❤ y mucha AI');
    expect(hecho?.querySelector('.pie__corazon')?.textContent).toBe('❤');
    expect(hecho?.querySelector('.pie__corazon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('lleva la linea "Un proyecto de CookYourWeb AI", enlazada a la agencia', async () => {
    const pie = await crear();

    const enlace = pie.querySelector('.pie__proyecto a');

    expect(enlace?.textContent?.trim()).toBe('Un proyecto de CookYourWeb AI');
    expect(enlace?.getAttribute('href')).toBe('https://www.cookyourwebai.es/');
  });

  describe('enlaces legales', () => {
    it('hoy no hay paginas legales propias, asi que la configuracion esta vacia', () => {
      expect(ENLACES_LEGALES_DE_LA_PLATAFORMA).toEqual([]);
    });

    it('la URL de la politica de privacidad esta vacia hasta que exista la seccion Empleo Tech', () => {
      expect(URL_DE_PRIVACIDAD_DE_EMPLEO).toBe('');
    });

    it('sin URL de privacidad no hay enlaces legales', () => {
      expect(enlacesLegalesDe('')).toEqual([]);
    });

    it('con URL de privacidad el unico enlace legal es la politica', () => {
      expect(enlacesLegalesDe('https://www.cookyourwebai.es/empleo-tech/privacidad')).toEqual([
        { clave: 'privacidad', url: 'https://www.cookyourwebai.es/empleo-tech/privacidad' },
      ]);
    });

    it('con URL de privacidad configurada el pie enlaza la politica', async () => {
      const pie = await crear(undefined, 'https://www.cookyourwebai.es/empleo-tech/privacidad');

      const enlaces = [...pie.querySelectorAll('.pie__legales a')];
      expect(enlaces.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
        ['Política de Privacidad', 'https://www.cookyourwebai.es/empleo-tech/privacidad'],
      ]);
    });

    it('con la configuracion vacia no se pinta la fila ni ningun enlace a la agencia que la sustituya', async () => {
      const pie = await crear();

      expect(pie.querySelector('.pie__legales')).toBeNull();
      expect(pie.textContent).not.toContain('Política de Privacidad');
      expect(pie.textContent).not.toContain('Darme de baja');
      const hacia = [...pie.querySelectorAll('a')].map((a) => a.getAttribute('href'));
      expect(hacia).toEqual(['tel:+34688757782', 'mailto:veronica@cookyourwebai.es', 'https://www.cookyourwebai.es/']);
    });

    it('con paginas propias pinta la fila, en orden y separada por puntos', async () => {
      const pie = await crear([
        { clave: 'privacidad', url: '/es/privacidad' },
        { clave: 'cookies', url: '/es/cookies' },
        { clave: 'avisoLegal', url: '/es/aviso-legal' },
        { clave: 'baja', url: '/es/baja' },
      ]);

      const enlaces = [...pie.querySelectorAll('.pie__legales a')];

      expect(pie.querySelector('.pie__legales')?.getAttribute('aria-label')).toBe('Información legal');
      expect(enlaces.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
        ['Política de Privacidad', '/es/privacidad'],
        ['Política de Cookies', '/es/cookies'],
        ['Aviso Legal', '/es/aviso-legal'],
        ['Darme de baja', '/es/baja'],
      ]);
      expect(pie.querySelectorAll('.pie__legales span[aria-hidden="true"]')).toHaveLength(3);
    });

    it('solo el enlace de baja se marca para ponerse rojo al pasar el raton', async () => {
      const pie = await crear([
        { clave: 'privacidad', url: '/es/privacidad' },
        { clave: 'baja', url: '/es/baja' },
      ]);

      const rojos = [...pie.querySelectorAll('.pie__legal--baja')];

      expect(rojos.map((a) => a.textContent)).toEqual(['Darme de baja']);
    });
  });
});
