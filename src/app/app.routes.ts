import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Ofertas',
    // Carga diferida: la pantalla no viaja en el arranque de la aplicacion.
    loadComponent: () => import('./ofertas/ofertas.page').then((m) => m.OfertasPage),
  },
];
