import { isDevMode } from '@angular/core';
import { Routes } from '@angular/router';

import { conPerfil, sinPerfil } from './alta/con-perfil';
import { elegirAdaptadoresDeAlta } from './alta/elegir-adaptadores';
import { ExtractorDeCv } from './alta/extractor-de-cv';
import { RepositorioDePerfil } from './alta/repositorio-de-perfil';
import { elegirRepositorioDeCuenta } from './cuenta/elegir-repositorio-de-cuenta';
import { RepositorioDeCuenta } from './cuenta/repositorio-de-cuenta';
import { CandidaturasStore } from './ofertas/candidaturas.store';
import { EditorDeCandidaturas, elegirEditor } from './ofertas/editor-de-candidaturas';
import { elegirRepositorio } from './ofertas/elegir-repositorio';
import { elegirFuenteDeAcciones, FuenteDeAcciones } from './ofertas/fuente-de-acciones';
import { RepositorioDeCandidaturas } from './ofertas/repositorio-de-candidaturas';
import { soloConSesion } from './sesion/solo-con-sesion';

/**
 * Alta y cuenta hablan con el backend real cuando el cv-server publique
 * /perfil, /consentimientos, /extraccion y /cuenta. Hasta ese dia, la demo en
 * memoria. Es el unico interruptor: cambiarlo a true es el go-live del alta.
 */
const ALTA_CON_BACKEND = false;
const ADAPTADORES_DE_ALTA = elegirAdaptadoresDeAlta(ALTA_CON_BACKEND);

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: $localize`:Titulo de la pestana en la pagina de bienvenida@@ruta.bienvenida:Empleo | CookYourWebAI`,
    loadComponent: () => import('./bienvenida/bienvenida.page').then((m) => m.BienvenidaPage),
  },
  {
    path: 'entrar',
    title: $localize`:Titulo de la pestana en la pantalla de entrada@@ruta.entrar:Entrar`,
    loadComponent: () => import('./entrada/entrada.page').then((m) => m.EntradaPage),
  },
  {
    path: 'alta',
    // Con perfil no se repite el alta: sinPerfil manda al panel.
    canActivate: [soloConSesion, sinPerfil],
    title: $localize`:Titulo de la pestana en el alta@@ruta.alta:Tu perfil`,
    providers: [
      { provide: RepositorioDePerfil, useClass: ADAPTADORES_DE_ALTA.repositorio },
      { provide: ExtractorDeCv, useClass: ADAPTADORES_DE_ALTA.extractor },
    ],
    loadComponent: () => import('./alta/alta.page').then((m) => m.AltaPage),
  },
  {
    path: 'cuenta',
    canActivate: [soloConSesion],
    title: $localize`:Titulo de la pestana en la cuenta@@ruta.cuenta:Tu cuenta`,
    providers: [{ provide: RepositorioDeCuenta, useClass: elegirRepositorioDeCuenta(ALTA_CON_BACKEND) }],
    loadComponent: () => import('./cuenta/cuenta.page').then((m) => m.CuentaPage),
  },
  {
    path: 'panel',
    // Session required in every environment: even the demo is for invited users only.
    // conPerfil va despues: necesita el token y solo redirige ante un "no" claro.
    canActivate: [soloConSesion, conPerfil],
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
