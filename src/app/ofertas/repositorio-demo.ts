import { Injectable } from '@angular/core';

import { Candidatura } from './dominio';
import { RepositorioDeCandidaturas } from './repositorio-de-candidaturas';

/**
 * Datos de ejemplo, incluidos en el propio front.
 *
 * La demo publica no toca backend ni base de datos. No es un parche a ningun
 * plan gratuito: un escaparate debe cargar al instante y no puede depender de
 * que un servicio este despierto.
 *
 * Las empresas son inventadas y no hay ningun dato de una persona real.
 */
const DEMO: Candidatura[] = [
  {
    id: 'c1',
    estado: 'Pendiente',
    oferta: {
      id: 'o1',
      empresa: 'Northwind Labs',
      puesto: 'Senior Frontend Engineer',
      idioma: 'es',
      ubicacion: 'Madrid',
      modalidad: 'Remoto',
      salario: '55.000 a 65.000 € brutos',
      fechaPublicacion: '2026-09-28',
      enlace: 'https://ejemplo.test/ofertas/northwind-senior-frontend',
      descripcion:
        'Equipo de producto de seis personas. TypeScript y Angular en el front, ' +
        'contratos tipados contra una API propia. Se valora experiencia en ' +
        'accesibilidad y en design systems.',
    },
  },
  { id: 'c2', estado: 'Pendiente', oferta: { id: 'o2', empresa: 'Marisma', puesto: 'Frontend Engineer (Angular)', idioma: 'es' } },
  {
    id: 'c13',
    estado: 'Aprobado',
    cv: 'https://ejemplo.test/cv/lumen-grid',
    carta:
      'Dear Lumen Grid team,\n\nI am a frontend developer with long experience in Vue and design systems. ' +
      'My CV covers the specifics.\n\nKind regards',
    oferta: { id: 'o13', empresa: 'Lumen Grid', puesto: 'Senior Frontend (Vue)', idioma: 'en', modalidad: 'Remoto' },
  },
  { id: 'c3', estado: 'En proceso', viaEnvio: 'Portal empresa', fechaEnvio: '2026-09-22', oferta: { id: 'o3', empresa: 'Cobalt Rivers', puesto: 'Full-stack Engineer', idioma: 'es' } },
  { id: 'c4', estado: 'En proceso', viaEnvio: 'LinkedIn', fechaEnvio: '2026-09-25', oferta: { id: 'o4', empresa: 'Fábrica de Ideas', puesto: 'Tech Lead Frontend', idioma: 'es' } },
  { id: 'c5', estado: 'Enviado', viaEnvio: 'Email directo', fechaEnvio: '2026-10-01', oferta: { id: 'o5', empresa: 'Quintana Systems', puesto: 'Senior Web Engineer', idioma: 'es' } },
  { id: 'c6', estado: 'Enviado', viaEnvio: 'LinkedIn', fechaEnvio: '2026-10-03', oferta: { id: 'o6', empresa: 'Veldt', puesto: 'Frontend Platform Engineer', idioma: 'es' } },
  { id: 'c7', estado: 'Entrevista', viaEnvio: 'Portal empresa', fechaEnvio: '2026-09-15', oferta: { id: 'o7', empresa: 'Arbórea', puesto: 'Senior Angular Developer', idioma: 'es' } },
  { id: 'c8', estado: 'Rechazado', viaEnvio: 'LinkedIn', fechaEnvio: '2026-09-02', oferta: { id: 'o8', empresa: 'Puerto Digital', puesto: 'Frontend Engineer', idioma: 'es' } },
  { id: 'c9', estado: 'Descartado', oferta: { id: 'o9', empresa: 'Grupo Almena', puesto: 'Desarrollador Frontend', idioma: 'es' } },
  { id: 'c10', estado: 'Caducada', oferta: { id: 'o10', empresa: 'Tramontana', puesto: 'UI Engineer', idioma: 'es' } },
  { id: 'c11', estado: 'Caducada', oferta: { id: 'o11', empresa: 'Sierra Nube', puesto: 'Frontend Developer', idioma: 'es' } },
  { id: 'c12', estado: 'Contactada directamente', oferta: { id: 'o12', empresa: 'Estudio Ribera', puesto: 'Design Systems Engineer', idioma: 'es' } },
];

@Injectable()
export class RepositorioDemo implements RepositorioDeCandidaturas {
  async listar(): Promise<Candidatura[]> {
    return DEMO;
  }
}
