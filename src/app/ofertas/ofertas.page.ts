import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Accion, accionesPara, EnlacesDeAccion } from './acciones';
import { Candidatura, EstadoDeCandidatura, ESTADOS } from './dominio';
import { CandidaturasStore, ColumnaOrdenable } from './candidaturas.store';
import { fechaEspanola } from './fecha';
import { FuenteDeAcciones } from './fuente-de-acciones';

/**
 * Las columnas ordenables, en el orden y con el ancho de la maqueta aprobada.
 *
 * Cada una tiene su ancho y la tabla puede ser mas ancha que la pantalla: se
 * recorre con scroll horizontal, como una hoja de calculo, en vez de recortar
 * cada celda hasta hacerla ilegible.
 */
const COLUMNAS: { clave: ColumnaOrdenable; titulo: string; ancho: number }[] = [
  { clave: 'empresa', titulo: 'Empresa', ancho: 190 },
  { clave: 'puesto', titulo: 'Puesto', ancho: 280 },
  { clave: 'estado', titulo: 'Estado', ancho: 170 },
  { clave: 'modalidad', titulo: 'Modalidad', ancho: 110 },
  { clave: 'ubicacion', titulo: 'Ubicación', ancho: 180 },
  { clave: 'salario', titulo: 'Salario', ancho: 170 },
  { clave: 'viaEnvio', titulo: 'Vía envío', ancho: 140 },
  { clave: 'fechaEnvio', titulo: 'Fecha envío', ancho: 120 },
  { clave: 'fechaPublicacion', titulo: 'Publicada', ancho: 120 },
];

/** Las columnas de enlaces no se ordenan: no hay un orden util para una URL. */
const ANCHO_ENLACE = 80;

/** Cabe "Aprobar" y "Descartar" en una linea. */
const ANCHO_ACCIONES = 210;

/** Los estados que cierran la candidatura se pintan huecos: ya no piden nada. */
const CERRADOS: readonly EstadoDeCandidatura[] = ['Rechazado', 'Descartado', 'Caducada'];

@Component({
  selector: 'app-ofertas',
  imports: [RouterLink],
  templateUrl: './ofertas.page.html',
  styleUrl: './ofertas.page.css',
})
export class OfertasPage implements OnInit {
  protected readonly store = inject(CandidaturasStore);
  private readonly fuenteDeAcciones = inject(FuenteDeAcciones);
  /** null mientras no hay enlaces, y siempre en la demo publica. */
  protected readonly enlaces = signal<EnlacesDeAccion | null>(null);
  protected readonly anchoAcciones = ANCHO_ACCIONES;
  protected readonly estados = ESTADOS;
  protected readonly columnas = COLUMNAS;
  protected readonly anchoEnlace = ANCHO_ENLACE;
  private readonly anchoBase = COLUMNAS.reduce((suma, c) => suma + c.ancho, 0) + 2 * ANCHO_ENLACE;

  ngOnInit(): void {
    void this.store.cargar();
    void this.fuenteDeAcciones.enlaces().then((enlaces) => this.enlaces.set(enlaces));
  }

  protected anchoTotal(): number {
    return this.anchoBase + (this.enlaces() ? ANCHO_ACCIONES : 0);
  }

  protected acciones(una: Candidatura): Accion[] {
    return accionesPara(una, this.enlaces());
  }

  protected filtrarPor(estado: EstadoDeCandidatura | null): void {
    this.store.filtrarPor(estado);
  }

  protected buscar(evento: Event): void {
    this.store.buscar((evento.target as HTMLInputElement).value);
  }

  protected ordenarPor(columna: ColumnaOrdenable): void {
    this.store.ordenarPor(columna);
  }

  /** Lo que anuncia el lector de pantalla en cada cabecera. */
  protected ariaSort(columna: ColumnaOrdenable): 'ascending' | 'descending' | 'none' {
    const orden = this.store.orden();
    if (orden?.columna !== columna) {
      return 'none';
    }
    return orden.sentido === 'asc' ? 'ascending' : 'descending';
  }

  protected cerrado(estado: EstadoDeCandidatura): boolean {
    return CERRADOS.includes(estado);
  }

  /** El texto de cada celda ordenable. Las fechas, como se leen en Espana. */
  protected celda(una: Candidatura, columna: ColumnaOrdenable): string {
    switch (columna) {
      case 'estado':
        return una.estado;
      case 'viaEnvio':
        return una.viaEnvio ?? '';
      case 'fechaEnvio':
        return fechaEspanola(una.fechaEnvio);
      case 'fechaPublicacion':
        return fechaEspanola(una.oferta.fechaPublicacion);
      default:
        return una.oferta[columna] ?? '';
    }
  }
}
