import { Candidatura, Oferta } from './dominio';

describe('el dominio separa la oferta de la candidatura', () => {
  it('una oferta describe el puesto y no sabe nada de quien se presenta', () => {
    const oferta: Oferta = {
      id: 'o1',
      empresa: 'Northwind Labs',
      puesto: 'Senior Frontend Engineer',
      idioma: 'es',
    };

    expect(oferta).not.toHaveProperty('estado');
  });

  it('la candidatura es de una persona sobre una oferta, y ahi vive el estado', () => {
    const candidatura: Candidatura = {
      id: 'c1',
      oferta: { id: 'o1', empresa: 'Northwind Labs', puesto: 'Senior Frontend Engineer', idioma: 'es' },
      estado: 'Pendiente',
    };

    expect(candidatura.estado).toBe('Pendiente');
    expect(candidatura.oferta.empresa).toBe('Northwind Labs');
  });

  it('la oferta lleva lo que hace falta para decidir si encaja', () => {
    const oferta: Oferta = {
      id: 'o1',
      empresa: 'Northwind Labs',
      puesto: 'Senior Frontend Engineer',
      descripcion: 'Equipo de producto. TypeScript y Angular.',
      enlace: 'https://ejemplo.test/ofertas/1',
      ubicacion: 'Madrid',
      modalidad: 'Remoto',
      salario: '55.000 a 65.000 €',
      idioma: 'es',
    };

    expect(oferta.descripcion).toContain('TypeScript');
    expect(oferta.enlace).toMatch(/^https:/);
  });

  it('los datos que no siempre trae la captacion son opcionales', () => {
    const minima: Oferta = { id: 'o2', empresa: 'Marisma', puesto: 'Frontend', idioma: 'es' };

    expect(minima.salario).toBeUndefined();
  });

  it('dos personas pueden presentarse a la misma oferta con estados distintos', () => {
    const oferta: Oferta = { id: 'o1', empresa: 'Northwind Labs', puesto: 'Senior Frontend Engineer', idioma: 'es' };

    const mia: Candidatura = { id: 'c1', oferta, estado: 'Entrevista' };
    const suya: Candidatura = { id: 'c2', oferta, estado: 'Rechazado' };

    expect(mia.oferta).toBe(suya.oferta);
    expect(mia.estado).not.toBe(suya.estado);
  });
});
