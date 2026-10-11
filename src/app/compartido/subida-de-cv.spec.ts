import { TestBed } from '@angular/core/testing';

import { MotivoDeSubida } from './subida-rechazada';
import { SubidaDeCv } from './subida-de-cv';

describe('SubidaDeCv', () => {
  async function pintar(rechazo: MotivoDeSubida | null = null) {
    const fixture = TestBed.createComponent(SubidaDeCv);
    fixture.componentRef.setInput('rechazo', rechazo);
    const elegido = vi.fn();
    const aMano = vi.fn();
    fixture.componentInstance.elegido.subscribe(elegido);
    fixture.componentInstance.aMano.subscribe(aMano);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    return { fixture, raiz, elegido, aMano, entrada: raiz.querySelector<HTMLInputElement>('input[type="file"]')! };
  }

  function elegir(entrada: HTMLInputElement, archivos: File[]): void {
    Object.defineProperty(entrada, 'files', { value: archivos, configurable: true });
    entrada.dispatchEvent(new Event('change'));
  }

  it('acepta PDF y DOCX y lo dice como pista, sin impedir nada', async () => {
    const { raiz, entrada } = await pintar();

    expect(entrada.accept).toContain('.pdf');
    expect(entrada.accept).toContain('.docx');
    expect(raiz.textContent).toContain('2 MB');
  });

  it('el campo tiene etiqueta asociada', async () => {
    const { raiz, entrada } = await pintar();

    expect(raiz.querySelector(`label[for="${entrada.id}"]`)).not.toBeNull();
  });

  it('emite el archivo elegido sin filtrarlo: el servidor decide', async () => {
    const { entrada, elegido } = await pintar();
    const archivo = new File(['x'], 'cv.exe');

    elegir(entrada, [archivo]);

    expect(elegido).toHaveBeenCalledWith(archivo);
  });

  it('sin archivo no emite', async () => {
    const { entrada, elegido } = await pintar();

    elegir(entrada, []);

    expect(elegido).not.toHaveBeenCalled();
  });

  it('sin rechazo no hay alerta', async () => {
    const { raiz } = await pintar();

    expect(raiz.querySelector('[role="alert"]')).toBeNull();
  });

  it.each<[MotivoDeSubida, string]>([
    ['tamano', 'demasiado grande'],
    ['tipo', 'PDF o DOCX'],
    ['ilegible', 'leer'],
    ['sinConsentimiento', 'consentimiento'],
    ['servidor', 'servidor'],
  ])('un rechazo %s se explica en una alerta y el formulario sigue usable (S5.7)', async (motivo, trozo) => {
    const { raiz, entrada } = await pintar(motivo);

    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain(trozo);
    expect(entrada.disabled).toBe(false);
  });

  it('ofrece rellenar a mano', async () => {
    const { raiz, aMano } = await pintar();

    raiz.querySelector<HTMLButtonElement>('[data-a-mano]')!.click();

    expect(aMano).toHaveBeenCalledTimes(1);
  });

  describe('zona de subida', () => {
    function zonaDe(raiz: HTMLElement) {
      return raiz.querySelector<HTMLElement>('[data-zona]')!;
    }
    function botonDe(raiz: HTMLElement) {
      return raiz.querySelector<HTMLButtonElement>('[data-elegir]')!;
    }
    function arrastre(tipo: string, archivos: File[] = []): Event {
      const evento = new Event(tipo, { bubbles: true, cancelable: true });
      Object.defineProperty(evento, 'dataTransfer', { value: { files: archivos } });
      return evento;
    }

    it('muestra un boton principal "Elegir mi CV" dentro de la zona', async () => {
      const { raiz } = await pintar();

      const boton = botonDe(raiz);
      expect(boton.textContent!.trim()).toBe('Elegir mi CV');
      expect(boton.classList).toContain('boton-principal');
      expect(zonaDe(raiz).contains(boton)).toBe(true);
    });

    it('el boton abre el selector de archivos una sola vez', async () => {
      const { raiz, entrada } = await pintar();
      const abrir = vi.spyOn(entrada, 'click');

      botonDe(raiz).click();

      expect(abrir).toHaveBeenCalledTimes(1);
    });

    it('toda la tarjeta abre el selector', async () => {
      const { raiz, entrada } = await pintar();
      const abrir = vi.spyOn(entrada, 'click');

      zonaDe(raiz).click();

      expect(abrir).toHaveBeenCalledTimes(1);
    });

    it('el boton es un button nativo alcanzable con teclado (Enter y Espacio lo activan)', async () => {
      const { raiz } = await pintar();
      const boton = botonDe(raiz);

      expect(boton.tagName).toBe('BUTTON');
      expect(boton.type).toBe('button');
      expect(boton.disabled).toBe(false);
      expect(boton.tabIndex).toBeGreaterThanOrEqual(0);
      expect(zonaDe(raiz).hasAttribute('tabindex')).toBe(false);
    });

    it('el input real sigue en el DOM, con etiqueta y sin display none', async () => {
      const { raiz, entrada } = await pintar();

      expect(entrada.type).toBe('file');
      expect(entrada.tabIndex).toBeGreaterThanOrEqual(0);
      expect(entrada.hidden).toBe(false);
      expect(raiz.querySelector(`label[for="${entrada.id}"]`)?.textContent).toContain('Tu CV');
    });

    it('la pista del formato describe el input y el boton', async () => {
      const { raiz, entrada } = await pintar();
      const pista = raiz.querySelector('#subida-pista')!;

      expect(pista.textContent!.trim()).toBe('PDF o DOCX, hasta 2 MB');
      expect(entrada.getAttribute('aria-describedby')).toContain('subida-pista');
      expect(botonDe(raiz).getAttribute('aria-describedby')).toContain('subida-pista');
    });

    it('al arrastrar encima marca la tarjeta y al salir la desmarca', async () => {
      const { fixture, raiz } = await pintar();
      const zona = zonaDe(raiz);
      expect(zona.hasAttribute('data-arrastrando')).toBe(false);

      zona.dispatchEvent(arrastre('dragenter'));
      await fixture.whenStable();
      expect(zona.hasAttribute('data-arrastrando')).toBe(true);

      zona.dispatchEvent(arrastre('dragleave'));
      await fixture.whenStable();
      expect(zona.hasAttribute('data-arrastrando')).toBe(false);
    });

    it('dragover cancela el comportamiento por defecto para permitir soltar', async () => {
      const { raiz } = await pintar();
      const evento = arrastre('dragover');

      zonaDe(raiz).dispatchEvent(evento);

      expect(evento.defaultPrevented).toBe(true);
    });

    it('soltar un archivo lo emite como si lo hubiera elegido el input y quita la marca', async () => {
      const { fixture, raiz, elegido } = await pintar();
      const archivo = new File(['x'], 'cv.pdf');
      const zona = zonaDe(raiz);
      zona.dispatchEvent(arrastre('dragenter'));

      const soltar = arrastre('drop', [archivo]);
      zona.dispatchEvent(soltar);
      await fixture.whenStable();

      expect(elegido).toHaveBeenCalledWith(archivo);
      expect(soltar.defaultPrevented).toBe(true);
      expect(zona.hasAttribute('data-arrastrando')).toBe(false);
    });

    it('soltar sin archivos no emite', async () => {
      const { raiz, elegido } = await pintar();

      zonaDe(raiz).dispatchEvent(arrastre('drop', []));

      expect(elegido).not.toHaveBeenCalled();
    });

    it('al elegir muestra el nombre y el tamano del archivo', async () => {
      const { fixture, raiz, entrada } = await pintar();

      elegir(entrada, [new File([new Uint8Array(2048)], 'mi-cv.pdf')]);
      await fixture.whenStable();

      const texto = raiz.querySelector('[data-archivo]')!.textContent!;
      expect(texto).toContain('mi-cv.pdf');
      expect(texto).toContain('2 KB');
    });

    it('al soltar tambien muestra el nombre', async () => {
      const { fixture, raiz } = await pintar();

      zonaDe(raiz).dispatchEvent(arrastre('drop', [new File(['x'], 'soltado.docx')]));
      await fixture.whenStable();

      expect(raiz.querySelector('[data-archivo]')!.textContent).toContain('soltado.docx');
    });

    it('sin archivo elegido no hay resumen de archivo', async () => {
      const { raiz } = await pintar();

      expect(raiz.querySelector('[data-archivo]')).toBeNull();
    });

    it('tras un rechazo la alerta convive con la zona y se puede elegir otro archivo', async () => {
      const { raiz, entrada, elegido } = await pintar('tipo');
      expect(raiz.querySelector('[role="alert"]')).not.toBeNull();
      expect(botonDe(raiz).disabled).toBe(false);
      const otro = new File(['x'], 'otro.pdf');

      elegir(entrada, [otro]);

      expect(elegido).toHaveBeenCalledWith(otro);
    });

    it('rellenar a mano sigue visible pero como enlace secundario', async () => {
      const { raiz, aMano } = await pintar();
      const enlace = raiz.querySelector<HTMLButtonElement>('[data-a-mano]')!;

      enlace.click();

      expect(aMano).toHaveBeenCalledTimes(1);
      expect(enlace.classList).toContain('enlace');
      expect(enlace.classList).not.toContain('boton-principal');
      expect(zonaDe(raiz).contains(enlace)).toBe(false);
    });
  });
});
