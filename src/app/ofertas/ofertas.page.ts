import { Component, inject, OnInit } from '@angular/core';

import { EstadoDeCandidatura, ESTADOS } from './dominio';
import { CandidaturasStore } from './candidaturas.store';
import { RepositorioDemo } from './repositorio-demo';
import { RepositorioDeCandidaturas } from './repositorio-de-candidaturas';

@Component({
  selector: 'app-ofertas',
  templateUrl: './ofertas.page.html',
  styleUrl: './ofertas.page.css',
  providers: [CandidaturasStore, { provide: RepositorioDeCandidaturas, useClass: RepositorioDemo }],
})
export class OfertasPage implements OnInit {
  protected readonly store = inject(CandidaturasStore);
  protected readonly estados = ESTADOS;

  ngOnInit(): void {
    void this.store.cargar();
  }

  protected filtrarPor(estado: EstadoDeCandidatura | null): void {
    this.store.filtrarPor(estado);
  }
}
