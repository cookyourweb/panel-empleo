import { Candidatura, Oferta } from './dominio';

describe('el dominio separa la oferta de la candidatura', () => {
  it('una oferta describe el puesto y no sabe nada de quien se presenta', () => {
    const oferta: Oferta = {
      id: 'o1',
      empresa: 'Northwind Labs',
      puesto: 'Senior Frontend Engineer',
    };

    expect(oferta).not.toHaveProperty('estado');
  });

  it('la candidatura es de una persona sobre una oferta, y ahi vive el estado', () => {
    const candidatura: Candidatura = {
      id: 'c1',
      oferta: { id: 'o1', empresa: 'Northwind Labs', puesto: 'Senior Frontend Engineer' },
      estado: 'Pendiente',
    };

    expect(candidatura.estado).toBe('Pendiente');
    expect(candidatura.oferta.empresa).toBe('Northwind Labs');
  });

  it('dos personas pueden presentarse a la misma oferta con estados distintos', () => {
    const oferta: Oferta = { id: 'o1', empresa: 'Northwind Labs', puesto: 'Senior Frontend Engineer' };

    const mia: Candidatura = { id: 'c1', oferta, estado: 'Entrevista' };
    const suya: Candidatura = { id: 'c2', oferta, estado: 'Rechazado' };

    expect(mia.oferta).toBe(suya.oferta);
    expect(mia.estado).not.toBe(suya.estado);
  });
});
