import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { cmiplantaservices } from '../../../servicios/cmiplantaservices';
import { MetanolResponse } from '../../../models/Modelos_CMI/ProductoResponse';
import { MetanolRequest } from '../../../models/Modelos_CMI/MetanolRequest ';
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

  // Variable para almacenar la categoría seleccionada
  
  categoriaSeleccionada: string = '';

  // Lista de todas las categorías
  categorias = [
    { id: 'estrategia', nombre: 'Estrategia' },
    { id: 'financiero', nombre: 'Financiero' },
    { id: 'operacional', nombre: 'Operacional' },
    { id: 'comercial', nombre: 'Comercial' },
    { id: 'organizacional', nombre: 'Organizacional' },
    { id: 'sostenibilidad', nombre: 'Sostenibilidad' }
  ];
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  constructor(private router: Router) {}

  irAProductos() {
  this.router.navigate(['/cmi/productos']);
}


  // Método para manejar el cambio de categoría en el select
  onCategoriaChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.categoriaSeleccionada = selectElement.value;
  }

  // Método para verificar si una categoría debe mostrarse
  mostrarCategoria(categoriaId: string): boolean {
    if (!this.categoriaSeleccionada) {
      return true; // Mostrar todas si no hay filtro
    }
    return this.categoriaSeleccionada === categoriaId;
  }



}