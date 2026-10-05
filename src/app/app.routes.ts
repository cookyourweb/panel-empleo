import { isDevMode } from '@angular/core';
import { Routes } from '@angular/router';

import { CandidaturasStore } from './ofertas/candidaturas.store';
import { elegirRepositorio } from './ofertas/elegir-repositorio';
import { elegirFuenteDeAcciones, FuenteDeAcciones } from './ofertas/fuente-de-acciones';
import { RepositorioDeCandidaturas } from './ofertas/repositorio-de-candidaturas';

export const routes: Routes = [
  {
    path: '',
    // El store vive en la ruta y no en cada pantalla: la lista y el detalle
    // comparten las mismas candidaturas, y abrir una no vuelve a pedirlas.
    providers: [
      CandidaturasStore,
      { provide: RepositorioDeCandidaturas, useClass: elegirRepositorio(isDevMode()) },
      { provide: FuenteDeAcciones, useClass: elegirFuenteDeAcciones(isDevMode()) },
    ],
    children: [
      {
        path: '',
        title: 'Candidaturas',
        loadComponent: () => import('./ofertas/ofertas.page').then((m) => m.OfertasPage),
      },
      {
        path: 'candidatura/:id',
        title: 'Candidatura',
        loadComponent: () => import('./ofertas/detalle.page').then((m) => m.DetallePage),
      },
    ],
  },
];
