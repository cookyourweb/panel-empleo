import { Candidatura } from './dominio';
import { aplicarCambios, cambiosEntre, valoresEditables } from './edicion';

const UNA: Candidatura = {
  id: 'n1',
  estado: 'En proceso',
  fase: 'CV enviado',
  notas: 'Llamar',
  oferta: { id: 'o1', empresa: 'Acme', puesto: 'Frontend', idioma: 'en', salario: '60k', verificada: true },
};

describe('valoresEditables', () => {
  it('da un valor por cada campo editable, tambien los vacios, para poder rellenarlos', () => {
    const valores = valoresEditables(UNA);

    expect(valores['empresa']).toBe('Acme');
    expect(valores['salario']).toBe('60k');
    expect(valores['fase']).toBe('CV enviado');
    expect(valores['verificada']).toBe(true);
    expect(valores['ubicacion']).toBe('');
    expect(valores['avisoAutonoma']).toBe(false);
  });

  it('el estado no se edita aqui: va por las acciones', () => {
    expect(valoresEditables(UNA)).not.toHaveProperty('estado');
  });
});

describe('cambiosEntre', () => {
  it('solo devuelve lo que cambio', () => {
    const antes = valoresEditables(UNA);

    expect(cambiosEntre(antes, { ...antes, notas: 'Llamar el lunes', verificada: false })).toEqual({
      notas: 'Llamar el lunes',
      verificada: false,
    });
  });

  it('espacios de mas al principio o al final no cuentan como cambio', () => {
    const antes = valoresEditables(UNA);

    expect(cambiosEntre(antes, { ...antes, notas: '  Llamar ' })).toEqual({});
  });
});

describe('aplicarCambios', () => {
  it('pone cada cambio en la oferta o en la candidatura, segun de quien sea', () => {
    const despues = aplicarCambios(UNA, { salario: '70k', fase: 'Entrevista técnica' });

    expect(despues.oferta.salario).toBe('70k');
    expect(despues.fase).toBe('Entrevista técnica');
    expect(UNA.oferta.salario).toBe('60k');
  });

  it('vaciar un campo lo quita, igual que llega de Notion', () => {
    const despues = aplicarCambios(UNA, { notas: '', verificada: false });

    expect(despues).not.toHaveProperty('notas');
    expect(despues.oferta).not.toHaveProperty('verificada');
  });

  it('una modalidad que el dominio no conoce no se guarda', () => {
    expect(aplicarCambios(UNA, { modalidad: 'Marte' }).oferta).not.toHaveProperty('modalidad');
    expect(aplicarCambios(UNA, { modalidad: 'Remoto' }).oferta.modalidad).toBe('Remoto');
  });
});
