import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { cmiplantaservices } from '../../../servicios/cmiplantaservices';

Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-industrializacion-aceite',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './industrializacion-aceite.html',
  styleUrl: './industrializacion-aceite.css'
})
export class IndustrializacionAceite implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('donutCanvas') donutCanvas!: ElementRef<HTMLCanvasElement>;

  anioSeleccionado: number = new Date().getFullYear();
  mesSeleccionado: number = new Date().getMonth() + 1;

  aniosDisponibles: number[] = [2023, 2024, 2025, 2026, 2027];
  mesesDisponibles = [
    { num: 1, nombre: 'Enero' },
    { num: 2, nombre: 'Febrero' },
    { num: 3, nombre: 'Marzo' },
    { num: 4, nombre: 'Abril' },
    { num: 5, nombre: 'Mayo' },
    { num: 6, nombre: 'Junio' },
    { num: 7, nombre: 'Julio' },
    { num: 8, nombre: 'Agosto' },
    { num: 9, nombre: 'Septiembre' },
    { num: 10, nombre: 'Octubre' },
    { num: 11, nombre: 'Noviembre' },
    { num: 12, nombre: 'Diciembre' }
  ];

  detalle: any = null;
  cargando: boolean = false;
  chartInstance: Chart | null = null;

  // Modal de Parametrización
  mostrarParametrizacion: boolean = false;
  proveedoresConfig: any[] = [];
  tempMetaAnual: number = 150000;
  nuevoNit: string = '';
  nuevoNombre: string = '';
  buscandoSiesa: boolean = false;
  mensajeSiesa: string = '';

  // Paleta de colores para proveedores
  coloresProveedores: string[] = [
    '#4a90e2', // Azul principal
    '#7cb5ec', // Azul claro
    '#52c41a', // Verde vibrante
    '#27ae60', // Verde CMI
    '#faad14', // Amarillo/Naranja
    '#f5222d', // Rojo suave
    '#722ed1', // Púrpura
    '#13c2c2', // Teal
    '#eb2f96'  // Rosa
  ];

  constructor(
    private cmiService: cmiplantaservices,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    this.anioSeleccionado = hoy.getFullYear();
    this.mesSeleccionado = hoy.getMonth() + 1;

    if (!this.aniosDisponibles.includes(this.anioSeleccionado)) {
      this.aniosDisponibles.push(this.anioSeleccionado);
      this.aniosDisponibles.sort((a, b) => a - b);
    }

    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    if (this.detalle) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  cargarDatos(): void {
    this.cargando = true;
    this.cmiService.getIndustrializacionDetalle(this.anioSeleccionado, this.mesSeleccionado).subscribe({
      next: (res) => {
        this.detalle = res;
        this.cargando = false;
        this.cdr.detectChanges();
        setTimeout(() => this.renderChart(), 50);
      },
      error: (err) => {
        console.error('Error al cargar datos de industrialización:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFiltroChange(): void {
    this.cargarDatos();
  }

  getColorProveedor(index: number): string {
    return this.coloresProveedores[index % this.coloresProveedores.length];
  }

  renderChart(): void {
    if (!this.donutCanvas || !this.donutCanvas.nativeElement) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const proveedores = this.detalle?.proveedores || [];
    const labels = proveedores.map((p: any) => p.nombre);
    const data = proveedores.map((p: any) => p.participacionDonaPorcentaje || 0);
    const bgColors = proveedores.map((_: any, i: number) => this.getColorProveedor(i));

    const ctx = this.donutCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data.length > 0 ? data : [100],
          backgroundColor: bgColors.length > 0 ? bgColors : ['#e0e0e0'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            display: false // Usamos nuestra propia leyenda personalizada
          },
          datalabels: {
            display: (context: any) => {
              const val = context.dataset.data[context.dataIndex];
              return val && val > 0.5;
            },
            color: '#000000',
            font: {
              weight: 'bold',
              size: 13
            },
            textStrokeColor: 'rgba(255, 255, 255, 0.9)',
            textStrokeWidth: 2,
            formatter: (value: any) => {
              return value ? `${Number(value).toFixed(1)}%` : '';
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const val = context.parsed || 0;
                return ` ${label}: ${val.toFixed(1)}%`;
              }
            }
          }
        }
      }
    });
  }

  // =============================
  // MODAL PARAMETRIZACION
  // =============================

  abrirParametrizacion(): void {
    this.mostrarParametrizacion = true;
    this.cargarConfiguracion();
  }

  cerrarParametrizacion(): void {
    this.mostrarParametrizacion = false;
    this.nuevoNit = '';
    this.nuevoNombre = '';
    this.mensajeSiesa = '';
  }

  cargarConfiguracion(): void {
    this.cmiService.getIndustrializacionConfig().subscribe({
      next: (res) => {
        this.tempMetaAnual = res.metaAnual || 150000;
        this.proveedoresConfig = res.proveedores || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener parametrización:', err);
      }
    });
  }

  guardarMeta(): void {
    if (!this.tempMetaAnual || this.tempMetaAnual <= 0) return;
    this.cmiService.actualizarMeta(this.tempMetaAnual).subscribe({
      next: () => {
        this.cargarDatos();
        this.cargarConfiguracion();
      }
    });
  }

  buscarProveedorSiesa(): void {
    if (!this.nuevoNit || !this.nuevoNit.trim()) return;
    this.buscandoSiesa = true;
    this.mensajeSiesa = '';

    this.cmiService.buscarProveedorSiesa(this.nuevoNit.trim()).subscribe({
      next: (res) => {
        this.buscandoSiesa = false;
        if (res.encontrado) {
          this.nuevoNombre = res.nombre;
          this.mensajeSiesa = `✔ Encontrado en SIESA: ${res.nombre}`;
        } else {
          this.mensajeSiesa = `⚠ No se encontró en SIESA, ingresa el nombre manualmente`;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.buscandoSiesa = false;
        this.mensajeSiesa = `⚠ Error consultando SIESA`;
        this.cdr.detectChanges();
      }
    });
  }

  agregarProveedor(): void {
    if (!this.nuevoNit || !this.nuevoNit.trim()) return;
    this.cmiService.agregarProveedor(this.nuevoNit.trim(), this.nuevoNombre).subscribe({
      next: () => {
        this.nuevoNit = '';
        this.nuevoNombre = '';
        this.mensajeSiesa = '';
        this.cargarConfiguracion();
        this.cargarDatos();
      },
      error: (err) => {
        console.error('Error al agregar proveedor:', err);
      }
    });
  }

  toggleProveedor(p: any): void {
    this.cmiService.toggleProveedor(p.id, !p.activo).subscribe({
      next: () => {
        p.activo = !p.activo;
        this.cargarDatos();
      }
    });
  }

  eliminarProveedor(id: number): void {
    if (!confirm('¿Estás seguro de eliminar este proveedor de la configuración del indicador?')) return;
    this.cmiService.eliminarProveedor(id).subscribe({
      next: () => {
        this.cargarConfiguracion();
        this.cargarDatos();
      }
    });
  }
}
