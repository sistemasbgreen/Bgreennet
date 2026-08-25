import { IndustrializacionAceite } from './../industrializacion-aceite/industrializacion-aceite';
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subject, takeUntil, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { cmiplantaservices } from '../../../servicios/cmiplantaservices';
import { plcsServices } from '../../../servicios/plcsServices';
import { productoservices } from '../../../servicios/productoservices';
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
  
  energiaFoco: number | null = null;
  energiaMeta: number = 110;

  // Lista de todas las categorías
  categorias = [
    { id: 'estrategia', nombre: 'Estrategia' },
    { id: 'operacional', nombre: 'Operacional' }
  ];

  constructor(private router: Router,
              private cmiplantaservices: cmiplantaservices,
              private plcsService: plcsServices,
              private productoService: productoservices,
              private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatosGenerales();
  }

  cargarDatosGenerales() {
    this.IndustrializacionAceite();
    this.CargarEnergiaAnual();
  }

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

  onCategoriaChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.categoriaSeleccionada = selectElement.value;
  }

  onAnioChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.anioSeleccionado = Number(selectElement.value);
    this.cargarDatosGenerales();
  }

  mostrarCategoria(categoriaId: string): boolean {
    if (!this.categoriaSeleccionada) {
      return true; // Mostrar todas si no hay filtro
    }
    return this.categoriaSeleccionada === categoriaId;
  }

  IndustrializacionAceite() {
    this.cmiplantaservices.getIndustrializacionAceite(this.anioSeleccionado).subscribe({
      next: (resp) => {
        this.industrializacionAceite_number = resp.resultado;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al consumir API:', err);
      }
    });
  }

  CargarEnergiaAnual() {
    this.energiaFoco = null;
    const anio = this.anioSeleccionado.toString();
    const hoy = new Date();
    const fechaFinAnio = hoy.getFullYear() === this.anioSeleccionado
      ? hoy.toISOString().split('T')[0]
      : `${anio}-12-31`;

    this.productoService.getProductos().pipe(
      switchMap(productos => {
        const b100 = productos.find(p => String(p.id) === '26' || String(p.idProductoSiesa) === '26');
        if (!b100) return of(null);
        
        const req = {
          consumptionProductId: b100.idProductoSiesa || b100.id,
          productionProductId:  b100.idProductoSiesa || b100.id,
          consumptionDocTypes:  b100.consumptionDocTypes,
          productionDocTypes:   b100.productionDocTypes,
          startDate: `${anio}-01-01`,
          endDate: fechaFinAnio
        };

        return forkJoin({
          b100Historico: this.cmiplantaservices.obtenerDatos(req).pipe(catchError(() => of({ dailyData: [] }))),
          energiaAnual: this.plcsService.getEnergiaTotalAnio(anio).pipe(catchError(() => of({ totalEnergia: 0 })))
        });
      })
    ).subscribe((res: any) => {
      if (res) {
        const totalB100Anio = (res.b100Historico.dailyData || [])
          .filter((d: any) => d.date.startsWith(anio))
          .reduce((sum: number, d: any) => sum + d.produccion, 0);
        const totalEnergia = res.energiaAnual.totalEnergia || 0;
        
        if (totalB100Anio > 0) {
          this.energiaFoco = Number((totalEnergia / totalB100Anio).toFixed(2));
        } else {
          this.energiaFoco = 0;
        }
        this.cdr.detectChanges();
      }
    });
  }
}