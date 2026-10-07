import { TestBed } from '@angular/core/testing';

import { ProveedorDeIdentidad } from './proveedor-de-identidad';

class ProveedorFalso extends ProveedorDeIdentidad {
  alRecibir: ((credencial: string) => void) | null = null;
  olvidado = false;

  async preparar(_contenedor: HTMLElement, alRecibir: (credencial: string) => void): Promise<void> {
    this.alRecibir = alRecibir;
  }

  olvidar(): void {
    this.olvidado = true;
  }
}

describe('ProveedorDeIdentidad', () => {
  it('es el puerto: un adaptador se conecta con useClass y quien lo pide solo ve el puerto', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ProveedorDeIdentidad, useClass: ProveedorFalso }],
    });
    const proveedor = TestBed.inject(ProveedorDeIdentidad);
    const recibidas: string[] = [];

    await proveedor.preparar(document.createElement('div'), (c) => recibidas.push(c));
    (proveedor as ProveedorFalso).alRecibir?.('abc');
    proveedor.olvidar();

    expect(recibidas).toEqual(['abc']);
    expect((proveedor as ProveedorFalso).olvidado).toBe(true);
  });
});
