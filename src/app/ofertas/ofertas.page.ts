import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EstadoDeCandidatura, ESTADOS } from './dominio';
import { CandidaturasStore } from './candidaturas.store';
@Component({
  selector: 'app-ofertas',
  imports: [RouterLink],
  templateUrl: './ofertas.page.html',
  styleUrl: './ofertas.page.css',
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
