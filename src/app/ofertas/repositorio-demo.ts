import { Injectable } from '@angular/core';

import { Oferta } from './oferta';
import { RepositorioDeOfertas } from './repositorio-de-ofertas';

/**
 * Datos de ejemplo, incluidos en el propio front.
 *
 * La demo publica no toca backend ni base de datos. No es un parche a ningun
 * plan gratuito: un escaparate debe cargar al instante y no puede depender de
 * que un servicio este despierto.
 *
 * Las empresas son inventadas y no hay ningun dato de una persona real.
 */
const OFERTAS_DE_EJEMPLO: Oferta[] = [
  { id: '1', empresa: 'Northwind Labs', puesto: 'Senior Frontend Engineer', estado: 'Pendiente' },
  { id: '2', empresa: 'Marisma', puesto: 'Frontend Engineer (Angular)', estado: 'Pendiente' },
  { id: '3', empresa: 'Cobalt Rivers', puesto: 'Full-stack Engineer', estado: 'En proceso' },
  { id: '4', empresa: 'Fábrica de Ideas', puesto: 'Tech Lead Frontend', estado: 'En proceso' },
  { id: '5', empresa: 'Quintana Systems', puesto: 'Senior Web Engineer', estado: 'Enviado' },
  { id: '6', empresa: 'Veldt', puesto: 'Frontend Platform Engineer', estado: 'Enviado' },
  { id: '7', empresa: 'Arbórea', puesto: 'Senior Angular Developer', estado: 'Entrevista' },
  { id: '8', empresa: 'Puerto Digital', puesto: 'Frontend Engineer', estado: 'Rechazado' },
  { id: '9', empresa: 'Grupo Almena', puesto: 'Desarrollador Frontend', estado: 'Descartado' },
  { id: '10', empresa: 'Tramontana', puesto: 'UI Engineer', estado: 'Caducada' },
  { id: '11', empresa: 'Sierra Nube', puesto: 'Frontend Developer', estado: 'Caducada' },
  { id: '12', empresa: 'Estudio Ribera', puesto: 'Design Systems Engineer', estado: 'Contactada directamente' },
];

@Injectable()
export class RepositorioDemo implements RepositorioDeOfertas {
  async listar(): Promise<Oferta[]> {
    return OFERTAS_DE_EJEMPLO;
  }
}
