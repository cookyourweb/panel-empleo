import { isDevMode } from '@angular/core';
import { Routes } from '@angular/router';

import { CandidaturasStore } from './ofertas/candidaturas.store';
import { EditorDeCandidaturas, elegirEditor } from './ofertas/editor-de-candidaturas';
import { elegirRepositorio } from './ofertas/elegir-repositorio';
import { elegirFuenteDeAcciones, FuenteDeAcciones } from './ofertas/fuente-de-acciones';
import { RepositorioDeCandidaturas } from './ofertas/repositorio-de-candidaturas';
import { soloConSesion } from './sesion/solo-con-sesion';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: $localize`:Titulo de la pestana en la pagina de bienvenida@@ruta.bienvenida:Bienvenida`,
    loadComponent: () => import('./bienvenida/bienvenida.page').then((m) => m.BienvenidaPage),
  },
  {
    path: 'entrar',
    title: $localize`:Titulo de la pestana en la pantalla de entrada@@ruta.entrar:Entrar`,
    loadComponent: () => import('./entrada/entrada.page').then((m) => m.EntradaPage),
  },
  {
    path: 'panel',
    // Session required in every environment: even the demo is for invited users only.
    canActivate: [soloConSesion],
    // El store vive en la ruta y no en cada pantalla: la lista y el detalle
    // comparten las mismas candidaturas, y abrir una no vuelve a pedirlas.
    providers: [
      CandidaturasStore,
      { provide: RepositorioDeCandidaturas, useClass: elegirRepositorio(isDevMode()) },
      { provide: FuenteDeAcciones, useClass: elegirFuenteDeAcciones(isDevMode()) },
      { provide: EditorDeCandidaturas, useClass: elegirEditor(isDevMode()) },
    ],
    children: [
      {
        path: '',
        title: $localize`:Titulo de la pestana en la tabla@@ruta.candidaturas:Candidaturas`,
        loadComponent: () => import('./ofertas/ofertas.page').then((m) => m.OfertasPage),
      },
      {
        path: 'candidatura/:id',
        title: $localize`:Titulo de la pestana en la ficha@@ruta.candidatura:Candidatura`,
        loadComponent: () => import('./ofertas/detalle.page').then((m) => m.DetallePage),
      },
    ],
  },
  // Unknown routes go to the public welcome page, never to the panel.
  { path: '**', redirectTo: '' },
];
