import { IndustrializacionAceite } from './../industrializacion-aceite/industrializacion-aceite';
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { cmiplantaservices } from '../../../servicios/cmiplantaservices';
import { MetanolResponse } from '../../../models/Modelos_CMI/ProductoResponse';
import { MetanolRequest } from '../../../models/Modelos_CMI/MetanolRequest';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Router } from '@angular/router';

Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-cmi-home',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './cmi-home.html',
  styleUrl: './cmi-home.css'
})
export class CmiHome implements OnInit {

   
  categoriaSeleccionada: string = '';
  anioSeleccionado: number = 2026;
  industrializacionAceite_number: number = 0;

  // Lista de todas las categorías
  categorias = [
    { id: 'estrategia', nombre: 'Estrategia' },
    { id: 'operacional', nombre: 'Operacional' }
  ];
  ngOnInit(): void {
    console.log(this.industrializacionAceite_number)
    this.IndustrializacionAceite();
  }

  constructor(private router: Router,
              private cmiplantaservices: cmiplantaservices,
              private cdr: ChangeDetectorRef
  ) {}

  irAProductos() {
  this.router.navigate(['/cmi/productos']);
}

  irIndustrial(servicio?: string) {
    if (servicio) {
      this.router.navigate(['/cmi/servicios-industriales'], { queryParams: { servicio } });
    } else {
      this.router.navigate(['/cmi/servicios-industriales']);
    }
  }

  irindustrializacion() {
  this.router.navigate(['/cmi/industrializacion-aceite']);
}

  // Método para manejar el cambio de categoría en el select
  onCategoriaChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.categoriaSeleccionada = selectElement.value;
  }

  onAnioChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.anioSeleccionado = Number(selectElement.value);
    this.IndustrializacionAceite();
  }

  // Método para verificar si una categoría debe mostrarse
  mostrarCategoria(categoriaId: string): boolean {
    if (!this.categoriaSeleccionada) {
      return true; // Mostrar todas si no hay filtro
    }
    return this.categoriaSeleccionada === categoriaId;
  }

IndustrializacionAceite() {
  this.cmiplantaservices.getIndustrializacionAceite(this.anioSeleccionado).subscribe({
    next: (resp) => {
      console.log('Respuesta API:', resp);
      this.industrializacionAceite_number = resp.resultado;
      console.log('Valor actualizado:', this.industrializacionAceite_number);
      this.cdr.detectChanges(); // Forzar actualización de la vista
    },
    error: (err) => {
      console.error('Error al consumir API:', err);
    }
  });
}


}