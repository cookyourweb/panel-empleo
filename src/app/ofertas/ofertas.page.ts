import { Component, inject, OnInit } from '@angular/core';

import { EstadoDeOferta, ESTADOS } from './oferta';
import { OfertasStore } from './ofertas.store';
import { RepositorioDemo } from './repositorio-demo';
import { RepositorioDeOfertas } from './repositorio-de-ofertas';

@Component({
  selector: 'app-ofertas',
  templateUrl: './ofertas.page.html',
  styleUrl: './ofertas.page.css',
  providers: [OfertasStore, { provide: RepositorioDeOfertas, useClass: RepositorioDemo }],
})
export class OfertasPage implements OnInit {
  protected readonly store = inject(OfertasStore);
  protected readonly estados = ESTADOS;

  ngOnInit(): void {
    void this.store.cargar();
  }

  protected filtrarPor(estado: EstadoDeOferta | null): void {
    this.store.filtrarPor(estado);
  }
}
