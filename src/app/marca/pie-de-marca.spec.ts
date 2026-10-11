import { TestBed } from '@angular/core/testing';

import { EnlaceLegal, ENLACES_LEGALES, ENLACES_LEGALES_DE_LA_PLATAFORMA } from './enlaces-de-marca';
import { PieDeMarca } from './pie-de-marca';

async function crear(legales?: readonly EnlaceLegal[]): Promise<HTMLElement> {
  TestBed.configureTestingModule({
    imports: [PieDeMarca],
    providers: legales ? [{ provide: ENLACES_LEGALES, useValue: legales }] : [],
  });
  const fixture = TestBed.createComponent(PieDeMarca);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('PieDeMarca', () => {
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
