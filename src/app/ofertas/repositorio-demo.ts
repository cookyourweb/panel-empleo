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
  { id: 'c1', estado: 'Pendiente', oferta: { id: 'o1', empresa: 'Northwind Labs', puesto: 'Senior Frontend Engineer' } },
  { id: 'c2', estado: 'Pendiente', oferta: { id: 'o2', empresa: 'Marisma', puesto: 'Frontend Engineer (Angular)' } },
  { id: 'c3', estado: 'En proceso', oferta: { id: 'o3', empresa: 'Cobalt Rivers', puesto: 'Full-stack Engineer' } },
  { id: 'c4', estado: 'En proceso', oferta: { id: 'o4', empresa: 'Fábrica de Ideas', puesto: 'Tech Lead Frontend' } },
  { id: 'c5', estado: 'Enviado', oferta: { id: 'o5', empresa: 'Quintana Systems', puesto: 'Senior Web Engineer' } },
  { id: 'c6', estado: 'Enviado', oferta: { id: 'o6', empresa: 'Veldt', puesto: 'Frontend Platform Engineer' } },
  { id: 'c7', estado: 'Entrevista', oferta: { id: 'o7', empresa: 'Arbórea', puesto: 'Senior Angular Developer' } },
  { id: 'c8', estado: 'Rechazado', oferta: { id: 'o8', empresa: 'Puerto Digital', puesto: 'Frontend Engineer' } },
  { id: 'c9', estado: 'Descartado', oferta: { id: 'o9', empresa: 'Grupo Almena', puesto: 'Desarrollador Frontend' } },
  { id: 'c10', estado: 'Caducada', oferta: { id: 'o10', empresa: 'Tramontana', puesto: 'UI Engineer' } },
  { id: 'c11', estado: 'Caducada', oferta: { id: 'o11', empresa: 'Sierra Nube', puesto: 'Frontend Developer' } },
  { id: 'c12', estado: 'Contactada directamente', oferta: { id: 'o12', empresa: 'Estudio Ribera', puesto: 'Design Systems Engineer' } },
];

@Injectable()
export class RepositorioDemo implements RepositorioDeCandidaturas {
  async listar(): Promise<Candidatura[]> {
    return DEMO;
  }
}
