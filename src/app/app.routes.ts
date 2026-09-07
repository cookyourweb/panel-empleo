import { Routes } from '@angular/router';

import { CandidaturasStore } from './ofertas/candidaturas.store';
import { RepositorioDemo } from './ofertas/repositorio-demo';
import { RepositorioDeCandidaturas } from './ofertas/repositorio-de-candidaturas';

export const routes: Routes = [
  {
    path: '',
    // El store vive en la ruta y no en cada pantalla: la lista y el detalle
    // comparten las mismas candidaturas, y abrir una no vuelve a pedirlas.
    providers: [CandidaturasStore, { provide: RepositorioDeCandidaturas, useClass: RepositorioDemo }],
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
