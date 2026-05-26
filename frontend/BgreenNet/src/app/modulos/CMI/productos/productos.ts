import { producto } from './../../../models/productos';
import { productoservices } from './../../../servicios/productoservices';
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { cmiplantaservices } from '../../../servicios/cmiplantaservices';
import { MetanolRequest } from '../../../models/Modelos_CMI/MetanolRequest';
import { MetanolResponse } from '../../../models/Modelos_CMI/ProductoResponse';
Chart.register(...registerables, ChartDataLabels);

const extendLinePlugin = {
  id: 'extendLine',
  afterDraw: (chart: any) => {
    const activeDataset = chart.data.datasets.find((ds: any) => ds.label && ds.label.includes('Meta'));
    if (!activeDataset) return;

    const datasetMeta = chart.getDatasetMeta(chart.data.datasets.indexOf(activeDataset));
    if (!datasetMeta || !datasetMeta.data || datasetMeta.data.length === 0) return;

    const firstPoint = datasetMeta.data[0];
    const lastPoint = datasetMeta.data[datasetMeta.data.length - 1];
    if (!firstPoint || !lastPoint || firstPoint.x === undefined || firstPoint.y === undefined || lastPoint.x === undefined || lastPoint.y === undefined) return;

    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    if (!chartArea) return;

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(activeDataset.borderDash || [5, 5]);
    ctx.strokeStyle = activeDataset.borderColor || '#2c3e50';
    ctx.lineWidth = activeDataset.borderWidth || 2;

    // Draw from left edge to first point
    ctx.moveTo(chartArea.left, firstPoint.y);
    ctx.lineTo(firstPoint.x, firstPoint.y);

    // Draw from last point to right edge
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(chartArea.right, lastPoint.y);

    ctx.stroke();
    ctx.restore();
  }
};

@Component({
  selector: 'productos',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // UI State
  sidebarOpen = false;
  selectedYear: string = new Date().getFullYear().toString();
  selectedMonth: string = '';
  selectedProduct: string = '';
  
  // Stats
  monthlyData = {
    acumulado_mes: 0,
    total_consumo: 0,
    total_produccion: 0,
    dias_validos: 0,
    acumulado_CxP: 0,
    acumulado_PxC: 0
  };
  
  ytdData = {
    acumulado_mes: 0,
    total_consumo: 0,
    total_produccion: 0,
    acumulado_CxP: 0,
    acumulado_PxC: 0
  };
  
  // Stats para Costo Directo
  costoDirectoMes: number | null = null;
  costoDirectoYTD: number | null = null;

  // Catalogs
productos: any[] = [];
  
  meses = [
    { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' }, { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' }, { value: '05', label: 'Mayo' }, { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
  ];
  
  // Metas dinámicas desde BD
  metasDB: number[] = [];
  metaActualDB: number = 0;
  metaDiariaDB: number = 0;

  
  // Charts - existentes
  dailyChartData: ChartData<'line'> = { labels: [], datasets: [] };
  dailyCxPChartData: ChartData<'line'> = { labels: [], datasets: [] };
  dailyPxCChartData: ChartData<'line'> = { labels: [], datasets: [] };
  monthlyCxPChartData: any = { labels: [], datasets: [] };
  monthlyPxCChartData: any = { labels: [], datasets: [] };
  monthlyChartData: any = { labels: [], datasets: [] };

  // Nuevas gráficas para CostoDirecto
  costoDirectoDiarioChartData: ChartData<'line'> = { labels: [], datasets: [] };
  costoDirectoAcumuladoChartData: ChartData<'line'> = { labels: [], datasets: [] };

  // Opciones de gráficos
  dailyChartOptions!: ChartOptions<'line'>;
  dailyConversionOptions!: ChartOptions<'line'>;
  monthlyCxPOptions: any;
  monthlyPxCOptions: any;
  monthlyChartOptions: any;
  costoDirectoOptions!: ChartOptions<'line'>;

  // Plugins permitidos para la vista
  barChartPlugins: any[] = [ChartDataLabels, extendLinePlugin];

  constructor(
    private plantaService: cmiplantaservices,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private productoservices: productoservices,
  ) { }
  
  ngOnInit(): void {
    this.configurarGraficos();
    this.cargarDatosIniciales();
    this.cargarProductos();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =============================================
  // MEJORA: Método helper para formatear valores
  // sin redondeo — muestra hasta 4 decimales pero
  // elimina los ceros finales innecesarios.
  // Úsalo en el template: {{ formatValue(val) }}
  // =============================================
  formatValue(value: number | null, decimals: number = 4): string {
    if (value == null) return '';
    // Elimina ceros finales usando parseFloat tras fijar decimales
    return parseFloat(value.toFixed(decimals)).toString();
  }

  // Trunca (sin redondear) a N decimales y devuelve cadena con locale es-ES
  // Ej: truncateDecimal(19.97, 1) => "19,9"  (NO redondea a 20,0)
  truncateDecimal(value: number | null, decimals: number = 1): string {
    if (value == null) return '';
    const factor = Math.pow(10, decimals);
    const truncated = Math.floor(value * factor) / factor;
    return truncated.toLocaleString('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  // =============================================
  // MEJORA: Formateador para datalabels de gráficas
  // Acepta un sufijo opcional (ej: '%')
  // =============================================
  private formatLabel(value: any, suffix: string = '', decimals: number = 4): string {
    if (value == null || value === 0) return '';
    return parseFloat(value.toFixed(decimals)).toString() + suffix;
  }

  // Métodos de verificación
  isB100(): boolean {
    const p = this.getSelectedProductConfig();
    return String(this.selectedProduct) === '26' || p.nombre === 'B100';
  }

  isMpGrasas(): boolean {
    const p = this.getSelectedProductConfig();
    return String(this.selectedProduct) === '8' || p.nombre?.toUpperCase().includes('GRASAS');
  }

  isCostoDirecto(): boolean { return this.selectedProduct === 'CostoDirecto'; }

  isProduccionBase(): boolean {
    const p = this.getSelectedProductConfig();
    const bases = ['26', '9264', '3188', '32'];
    return bases.includes(String(this.selectedProduct)) || ['B100', 'AGG', 'Glicerina', 'Generacion Fondos'].includes(p.nombre);
  }

  // Método para limpiar todos los datos antes de cargar nuevos
  limpiarDatos(): void {
    this.monthlyData = {
      acumulado_mes: 0,
      total_consumo: 0,
      total_produccion: 0,
      dias_validos: 0,
      acumulado_CxP: 0,
      acumulado_PxC: 0
    };
    
    this.ytdData = {
      acumulado_mes: 0,
      total_consumo: 0,
      total_produccion: 0,
      acumulado_CxP: 0,
      acumulado_PxC: 0
    };
    
    this.costoDirectoMes = null;
    this.costoDirectoYTD = null;
    
    this.limpiarGraficos();
  }

  limpiarGraficos(): void {
    this.dailyChartData = { labels: [], datasets: [] };
    this.dailyCxPChartData = { labels: [], datasets: [] };
    this.dailyPxCChartData = { labels: [], datasets: [] };
    this.monthlyCxPChartData = { labels: [], datasets: [] };
    this.monthlyPxCChartData = { labels: [], datasets: [] };
    this.monthlyChartData = { labels: [], datasets: [] };
    this.costoDirectoDiarioChartData = { labels: [], datasets: [] };
    this.costoDirectoAcumuladoChartData = { labels: [], datasets: [] };
  }

  cargarDatosIniciales(): void {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    this.selectedYear = currentYear.toString();
    this.selectedMonth = currentMonth;
    this.actualizarDatos();
  }
  
  actualizarDatos(): void {
    const mes = this.selectedMonth || (new Date().getMonth() + 1).toString().padStart(2, '0');

    if (this.isCostoDirecto()) {
      this.cargarMetasCostoDirectoDB(mes, this.selectedYear);
      this.cargarDatosCostoDirecto(mes, this.selectedYear);
      this.cargarDatosCostoDirectoYTD(mes, this.selectedYear);
    } else {
      this.monthlyData = {
        acumulado_mes: 0,
        total_consumo: 0,
        total_produccion: 0,
        dias_validos: 0,
        acumulado_CxP: 0,
        acumulado_PxC: 0
      };
      
      // Primero cargamos la lista de productos para tener los flags actualizados
      this.productoservices.getProductos().subscribe(data => {
        this.productos = [
          ...data.filter(p => p.mostrarCmi !== false),
          { id: 'CostoDirecto', nombre: 'Costo Directo', esCostoDirecto: true, consumptionDocTypes: [], productionDocTypes: [] }
        ];

        this.cargarMetasDB(mes, this.selectedYear, this.selectedProduct, () => {
          this.cargarDatosMes(mes, this.selectedYear, this.selectedProduct);
          this.cargarDatosYTD(mes, this.selectedYear, this.selectedProduct);
          this.cargarDatosMensuales(mes, this.selectedYear, this.selectedProduct);
        });
      });
    }
  }

  cargarMetasDB(mes: string, anio: string, productoId: string, callback?: Function): void {
    const pid = this.getSelectedProductConfig().id;
    this.productoservices.getMetas(pid, anio)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const mensuales = res?.mensuales ?? [];

          // Meta Diaria (Mes 0)
          const diaria = mensuales.find(m => Number(m.mes) === 0);
          this.metaDiariaDB = diaria ? diaria.valor : 0;

          // Mapear meses 1-12
          const valores = Array(12).fill(0);
          mensuales.forEach(m => {
            const mNum = Number(m.mes);
            if (mNum >= 1 && mNum <= 12) {
              valores[mNum - 1] = m.valor;
            }
          });
          this.metasDB = valores;

          const mesIdx = parseInt(mes, 10) - 1;
          this.metaActualDB = this.metasDB[mesIdx] || 0;
          if (callback) callback();
          this.cdr.detectChanges();
        },
        error: () => {
          this.metasDB = Array(12).fill(0);
          this.metaActualDB = 0;
          this.metaDiariaDB = 0;
          if (callback) callback();
        }
      });
  }

  cargarMetasCostoDirectoDB(mes: string, anio: string): void {
    this.productoservices.getCostoDirecto(anio)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.metasDB = res.mensuales.map(m => m.valor);
          const mesIdx = parseInt(mes, 10) - 1;
          this.metaActualDB = this.metasDB[mesIdx] || 0;
        },
        error: () => {
          this.metasDB = Array(12).fill(0);
          this.metaActualDB = 0;
        }
      });
  }
  
  getFechaRango(mes: string, anio: string) {
    const hoy = new Date();
    const esMesActual = mes === (hoy.getMonth() + 1).toString().padStart(2, '0') && anio === hoy.getFullYear().toString();
    const fechaInicio = `${anio}-${mes}-01`;
    const ultimoDia = new Date(+anio, +mes, 0).getDate();
    const fechaFin = esMesActual ? hoy.toISOString().split('T')[0] : `${anio}-${mes}-${ultimoDia}`;
    return { fechaInicio, fechaFin };
  }
  


getSelectedProductConfig() {
  const selectedStr = String(this.selectedProduct);
  const found = this.productos.find(p => 
    String(p.id) === selectedStr || 
    String(p.idProductoSiesa) === selectedStr
  );
  
  return found || {
    id: '',
    nombre: '',
    consumptionDocTypes: [],
    productionDocTypes: [],
    metaDiariaManual: false
  };
}

  cargarDatosCostoDirecto(mes: string, anio: string): void {
    const { fechaInicio, fechaFin } = this.getFechaRango(mes, anio);
    this.plantaService.getCostoDirecto(fechaInicio, fechaFin)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Costo Directo Mensual:', data);
          this.buildCostoDirectoCharts(data, anio);
          if (data.costoAcumulado && data.costoAcumulado.length > 0) {
            this.costoDirectoMes = data.costoAcumulado[data.costoAcumulado.length - 1];
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error en Costo Directo:', err);
          this.cdr.detectChanges();
        }
      });
  }

  cargarDatosCostoDirectoYTD(mes: string, anio: string): void {
    const { fechaFin } = this.getFechaRango(mes, anio);
    const fechaInicio = `${anio}-01-01`;

    this.plantaService.getCostoDirecto(fechaInicio, fechaFin)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Costo Directo YTD:', data);
          if (data.costoAcumulado && data.costoAcumulado.length > 0) {
            this.costoDirectoYTD = data.costoAcumulado[data.costoAcumulado.length - 1];
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error en Costo Directo YTD:', err);
          this.cdr.detectChanges();
        }
      });
  }

  buildCostoDirectoCharts(data: any, anio: string): void {
    const labels = data.fechas.map((f: string) => {
      const [y, m, d] = f.split('-');
      return `${d}/${m}`;
    });

    this.costoDirectoDiarioChartData = {
      labels: [...labels],
      datasets: [
        {
          label: 'Costo Directo ($/Ton)',
          data: [...data.costoDiario],
          borderColor: '#7ac3e0',
          backgroundColor: '#c2e8f79e',
          pointBackgroundColor: '#7ac3e0',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: true,
          order: 3,
          tension: 0.4,
          yAxisID: 'y-costo'
        },
        {
          label: 'CPO Diario (Kg/Ton)',
          data: [...data.diario8],
          borderColor: '#000',
          pointBackgroundColor: '#035E1E',
          borderWidth: 0.5,
          pointRadius: 6,
          pointHoverRadius: 10,
          fill: false,
          tension: 0.4,
          yAxisID: 'y-consumo',
          hidden: true
        },
        {
          label: 'Metanol Diario (Kg/Ton)',
          data: [...data.diario10],
          borderColor: '#000',
          pointBackgroundColor: '#9D0303',
          borderWidth: 0.5,
          pointRadius: 6,
          pointHoverRadius: 10,
          fill: false,
          tension: 0.4,
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          yAxisID: 'y-consumo',
          pointStyle: 'rect',
          hidden: true
        },
        {
          label: 'Meta',
          data: Array(labels.length).fill(this.metaActualDB),
          borderColor: '#000',
          pointBackgroundColor: '#2A9D03',
          borderWidth: 0.5,
          pointRadius: 6,
          pointHoverRadius: 10,
          fill: false,
          tension: 0.4,
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          yAxisID: 'y-costo',
          pointStyle: 'rect'
        }
      ]
    };

    this.costoDirectoAcumuladoChartData = {
      labels: [...labels],
      datasets: [
        {
          label: 'Costo Directo Acum. ($/Ton)',
          data: [...data.costoAcumulado],
          borderColor: '#7ac3e0',
          backgroundColor: '#c2e8f79e',
          pointBackgroundColor: '#7ac3e0',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: true,
          order: 3,
          tension: 0.4,
          yAxisID: 'y-costo'
        },
        {
          label: 'CPO Acumulado (Kg/Ton)',
          data: [...data.acumulado8],
          borderColor: '#000',
          pointBackgroundColor: '#035E1E',
          borderWidth: 0.5,
          pointRadius: 6,
          pointHoverRadius: 10,
          fill: false,
          tension: 0.4,
          yAxisID: 'y-consumo',
          hidden: true
        },
        {
          label: 'Metanol Acumulado (Kg/Ton)',
          data: [...data.acumulado10],
          borderColor: '#000',
          pointBackgroundColor: '#9D0303',
          borderWidth: 0.5,
          pointRadius: 6,
          pointHoverRadius: 10,
          fill: false,
          tension: 0.4,
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          yAxisID: 'y-consumo',
          pointStyle: 'rect',
          hidden: true
        },
        {
          label: 'Meta',
          data: Array(labels.length).fill(this.metaActualDB),
          borderColor: '#000',
          pointBackgroundColor: '#2A9D03',
          borderWidth: 0.5,
          pointRadius: 6,
          pointHoverRadius: 10,
          fill: false,
          tension: 0.4,
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          yAxisID: 'y-costo',
          pointStyle: 'rect'
        }
      ]
    };
    
    this.cdr.detectChanges();
  }

  getMesActualNombre(): string {
    const mesIndex = parseInt(this.selectedMonth, 10) - 1;
    return this.meses[mesIndex]?.label || 'Mes actual';
  }

  cargarDatosMes(mes: string, anio: string, productoId: string): void {
    const { fechaInicio, fechaFin } = this.getFechaRango(mes, anio);
    const producto = this.getSelectedProductConfig();
    const productionId = this.isB100() ? (producto.idProductoSiesa || producto.id) : '26';
    
    const request: MetanolRequest = {
      startDate: fechaInicio,
      endDate: fechaFin,
      consumptionProductId: producto.idProductoSiesa || producto.id,
      productionProductId: productionId,
      consumptionDocTypes: producto.consumptionDocTypes,
      productionDocTypes: producto.productionDocTypes
    };
    
    console.log('Request para cargarDatosMes:', request);
    
    this.plantaService.obtenerDatos(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Datos recibidos:', data);
          const base = {
            acumulado_mes: data.monthlyAccumulated || 0,
            total_consumo: data.totalConsumption || 0,
            total_produccion: data.totalProduction || 0,
            dias_validos: data.validDays || 0
          };
          
          if (this.isMpGrasas()) {
            const CxP = base.total_produccion > 0 ? (base.total_consumo / base.total_produccion) * 1000 : 0;
            const PxC = base.total_consumo > 0 ? (base.total_produccion / base.total_consumo) * 100 : 0;
            this.monthlyData = { ...base, acumulado_CxP: CxP, acumulado_PxC: PxC };
          } else {
            this.monthlyData = { ...base, acumulado_CxP: 0, acumulado_PxC: 0 };
          }
          
          this.buildDailyChart(data, anio);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error en datos mensuales:', err);
          this.cdr.detectChanges();
        }
      });
  }
  
  buildDailyChart(data: MetanolResponse, anio: string): void {
    if (!data.dailyData || data.dailyData.length === 0) {
      console.warn('No hay datos diarios para mostrar');
      return;
    }
    
    const datosOrdenados = [...data.dailyData].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const labels = datosOrdenados.map(d => {
      const [y, m, day] = d.date.split('-');
      return `${day}/${m}`;
    });
    
    if (this.isMpGrasas()) {
      const metaCxP = this.metaActualDB;
      const metaPxC = 97;
      const consumoEspecifico = datosOrdenados.map(d =>
        d.produccion > 0 ? (d.consumo / d.produccion) * 1000 : 0
      );
      const conversionDiaria = datosOrdenados.map(d =>
        d.consumo > 0 ? (d.produccion / d.consumo) * 100 : 0
      );
      
      let acumCons = 0, acumProd = 0;
      const acumCxP: number[] = [];
      const acumPxC: number[] = [];
      
      for (const d of datosOrdenados) {
        acumCons += d.consumo;
        acumProd += d.produccion;
        acumCxP.push(acumProd > 0 ? (acumCons / acumProd) * 1000 : 0);
        acumPxC.push(acumCons > 0 ? (acumProd / acumCons) * 100 : 0);
      }
      
      this.dailyCxPChartData = {
        labels: [...labels],
        datasets: [
          {
            label: 'Consumo Específico',
            data: [...consumoEspecifico],
            borderColor: '#13590c',
            backgroundColor: 'rgba(19, 89, 12, 0.1)',
            borderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#13590c',
            fill: true,
            tension: 0.4,
            order: 3
          },
          {
            label: 'Acumulado',
            data: [...acumCxP],
            borderColor: '#FF9800',
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            order: 2,
            pointStyle: 'line',
            pointBackgroundColor: '#fff',
            pointBorderColor: '#FF9800',
          },
          {
            label: `Meta (${metaCxP} Kg/Ton)`,
            data: Array(labels.length).fill(metaCxP),
            borderColor: '#2c3e50',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            order: 1,
            pointStyle: 'line',
            pointBackgroundColor: '#transparent',
            pointBorderColor: '#000000',
          }
        ]
      };

      this.dailyPxCChartData = {
        labels: [...labels],
        datasets: [
          {
            label: 'Conversión Diaria (%)',
            data: [...conversionDiaria],
            borderColor: '#0066cc',
            backgroundColor: 'rgba(0, 102, 204, 0.1)',
            borderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#0066cc',
            fill: true,
            tension: 0.4,
            order: 3
          },
          {
            label: 'Acumulado',
            data: [...acumPxC],
            borderColor: '#FF9800',
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            order: 2,
            pointStyle: 'line',
            pointBackgroundColor: '#FF9800',
            pointBorderColor: '#FF9800',
          },
          {
            label: `Meta (${this.truncateDecimal(metaPxC, 1)}%)`,
            data: Array(labels.length).fill(metaPxC),
            borderColor: '#2c3e50',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            order: 1,
            pointStyle: 'line',
            pointBorderColor: '#2c3e50',
          }
        ]
      };
    } else if (this.isB100()) {
      const meta = this.metaActualDB;
      const config = this.getSelectedProductConfig();
      // SEGURO DE VIDA: Si el flag está activo O si el valor de la meta diaria es > 1, usamos la meta manual
      const metaToUse = (config.metaDiariaManual || this.metaDiariaDB > 1) ? this.metaDiariaDB : meta;
      const produccionDiaria = datosOrdenados.map(d => d.produccion);
      
      this.dailyChartData = {
        labels: [...labels],
        datasets: [
          {
            label: 'Producción Diaria (Toneladas)',
            data: [...produccionDiaria],
            borderColor: '#13590c',
            backgroundColor: 'rgba(19, 89, 12, 0.1)',
            borderWidth: 3,
            pointRadius: 6,
            pointBorderColor: '#13590c',
            pointHoverRadius: 8,
            pointBackgroundColor: '#fff',
            fill: true,
            tension: 0.4,
            order: 2,
          },
          {
            label: `Meta Diaria (${metaToUse} Ton)`,
            data: Array(labels.length).fill(metaToUse),
            borderColor: '#2c3e50',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
              order: 1,
              pointStyle: 'line',
              pointBorderColor: '#2c3e50',
            }
        ]
      };
    } else {
      const valores = datosOrdenados.map(d => d.consumo_diario);
      let acumConsumo = 0, acumProduccion = 0;
      const promediosAcumulados = [];
      
      for (let i = 0; i < datosOrdenados.length; i++) {
        acumConsumo += datosOrdenados[i].consumo;
        acumProduccion += datosOrdenados[i].produccion;
        const ratio = acumProduccion > 0 ? (acumConsumo / acumProduccion) * 1000 : 0;
        promediosAcumulados.push(ratio);
      }
      
      const config = this.getSelectedProductConfig();
      // SEGURO DE VIDA: Si el flag está activo O si el valor de la meta diaria es > 1, usamos la meta manual
      const meta = (config.metaDiariaManual || this.metaDiariaDB > 1) ? this.metaDiariaDB : this.metaActualDB;
      
      this.dailyChartData = {
        labels: [...labels],
        datasets: [
          {
            label: this.isProduccionBase() ? 'Producción Diaria Kg/Ton' : 'Consumo Diario Kg/Ton',
            data: [...valores],
            borderColor: '#13590c',
            backgroundColor: 'rgba(19, 89, 12, 0.1)',
            borderWidth: 3,
            pointRadius: 6,
            pointBorderColor: '#13590c',
            pointHoverRadius: 8,
            pointBackgroundColor: '#fff',
            fill: true,
            tension: 0.4,
            order: 3
          },
          {
            label: `Meta Diaria (${meta} Kg/Ton)`,
            data: Array(labels.length).fill(meta),
            borderColor: '#2c3e50',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            order: 1,
            pointStyle: 'line',
            pointBorderColor: '#2c3e50'
          },
          {
            label: 'Acumulado',
            data: [...promediosAcumulados],
            borderColor: '#FF9800',
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            order: 2,
            pointStyle: 'line',
            pointBorderColor: '#FF9800'
          }
        ]
      };
    }
    
    this.cdr.detectChanges();
  }
  
  cargarDatosYTD(mes: string, anio: string, productoId: string): void {
    const { fechaFin } = this.getFechaRango(mes, anio);
    const producto = this.getSelectedProductConfig();
    const productionId = this.isB100() ? (producto.idProductoSiesa || producto.id) : '26';
    
    const request: MetanolRequest = {
      startDate: `${anio}-01-01`,
      endDate: fechaFin,
      consumptionProductId: producto.idProductoSiesa || producto.id,
      productionProductId: productionId,
      consumptionDocTypes: producto.consumptionDocTypes,
      productionDocTypes: producto.productionDocTypes
    };
    
    console.log('Request para YTD:', request);
    
    this.plantaService.obtenerDatos(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const base = {
            acumulado_mes: data.monthlyAccumulated || 0,
            total_consumo: data.totalConsumption || 0,
            total_produccion: data.totalProduction || 0
          };
          
          if (this.isMpGrasas()) {
            const CxP = base.total_produccion > 0 ? (base.total_consumo / base.total_produccion) * 1000 : 0;
            const PxC = base.total_consumo > 0 ? (base.total_produccion / base.total_consumo) * 100 : 0;
            this.ytdData = { 
              ...base, 
              acumulado_mes: data.monthlyAccumulated || 0,
              acumulado_CxP: CxP, 
              acumulado_PxC: PxC 
            };
          } else {
            this.ytdData = { 
              ...base, 
              acumulado_mes: data.monthlyAccumulated || 0,
              acumulado_CxP: 0, 
              acumulado_PxC: 0 
            };
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error en YTD:', err);
          this.cdr.detectChanges();
        }
      });
  }
  
  cargarDatosMensuales(mesHasta: string, anio: string, productoId: string): void {
    const numMeses = parseInt(mesHasta, 10);
    const labels = this.meses.slice(0, numMeses).map(m => m.label.substring(0, 3));
    const producto = this.getSelectedProductConfig();
    const pid = producto.idProductoSiesa || producto.id;
    const productionId = this.isB100() ? pid : '26';
    const observables = [];
    
    console.log('Iniciando cargarDatosMensuales para pid:', pid);
    
    for (let i = 1; i <= numMeses; i++) {
      const mesStr = i.toString().padStart(2, '0');
      const { fechaInicio, fechaFin } = this.getFechaRango(mesStr, anio);
      const req: MetanolRequest = {
        startDate: fechaInicio,
        endDate: fechaFin,
        consumptionProductId: pid,
        productionProductId: productionId,
        consumptionDocTypes: producto.consumptionDocTypes,
        productionDocTypes: producto.productionDocTypes
      };
      observables.push(this.plantaService.obtenerDatos(req));
    }
    
    forkJoin(observables)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          if (this.isB100()) {
            const valoresProduccion = results.map(res => res.totalProduction || null);
            const metasFiltradas = this.metasDB.slice(0, numMeses);
            
            this.monthlyChartData = {
              labels: [...labels],
              datasets: [
                {
                  type: 'bar',
                  label: 'Producción (Toneladas)',
                  data: [...valoresProduccion],
                  backgroundColor: valoresProduccion.map((v, idx) => {
                    if (v === null) return '#ccc';
                    const meta = metasFiltradas[idx] || 0;
                    const sentidoAsc = this.getSelectedProductConfig().sentidoMeta !== false;
                    const esCumplido = sentidoAsc ? (v >= meta) : (v <= meta);
                    return esCumplido ? '#27ae60' : '#e74c3c';
                  }),
                  borderColor: 'transparent',
                  borderWidth: 0,
                  borderRadius: 8,
                  order: 2
                },
                {
                  type: 'line',
                  label: 'Meta Mensual',
                  data: [...metasFiltradas],
                  borderColor: '#2c3e50',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  pointRadius: 4,
                  pointBackgroundColor: '#000',
                  fill: false,
                  order: 1,
                  pointStyle: 'line',
                  pointBorderColor: '#2c3e50'
                } as any
              ]
            };
          } else if (this.isMpGrasas()) {
            const metasFiltradas = this.metasDB.slice(0, numMeses);
            const metaPxC = 97;

            const valoresCxP = results.map(res => {
              const cons = res.totalConsumption || 0;
              const prod = res.totalProduction || 0;
              return prod > 0 ? (cons / prod) * 1000 : null;
            });
            
            const valoresPxC = results.map(res => {
              const cons = res.totalConsumption || 0;
              const prod = res.totalProduction || 0;
              return cons > 0 ? (prod / cons) * 100 : null;
            });
            
            this.monthlyCxPChartData = {
              labels: [...labels],
              datasets: [
                {
                  type: 'bar',
                  label: 'Consumo Específico (Kg/Ton)',
                  data: [...valoresCxP],
                  backgroundColor: valoresCxP.map((v, idx) => {
                    if (v === null) return '#ccc';
                    const meta = metasFiltradas[idx] || 0;
                    // Round to 1 decimal to match display
                    const valRound = Math.round(v * 10) / 10;
                    const sentidoAsc = this.getSelectedProductConfig().sentidoMeta !== false;
                    const esCumplido = sentidoAsc ? (valRound >= meta) : (valRound <= meta);
                    return esCumplido ? '#27ae60' : '#e74c3c'; 
                  }),
                  borderColor: 'transparent',
                  borderWidth: 0,
                  borderRadius: 8,
                  order: 2
                },
                {
                  type: 'line',
                  label: 'Meta Mensual',
                  data: [...metasFiltradas],
                  borderColor: '#2c3e50',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  pointRadius: 0,
                  fill: false,
                  order: 1,
                  pointStyle: 'line',
                  pointBorderColor: '2c3e50'
                } as any
              ]
            };
            
            this.monthlyPxCChartData = {
              labels: [...labels],
              datasets: [
                {
                  type: 'bar',
                  label: '% Conversión',
                  data: [...valoresPxC],
                  backgroundColor: valoresPxC.map(v =>
                    v === null ? '#ccc' : (v < metaPxC ? '#e74c3c' : '#27ae60')
                  ),
                  borderColor: 'transparent',
                  borderWidth: 0,
                  borderRadius: 8,
                  order: 2
                },
                {
                  type: 'line',
                  label: `Meta (${metaPxC}%)`,
                  data: Array(valoresPxC.length).fill(metaPxC),
                  borderColor: '#2c3e50',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  pointRadius: 0,
                  fill: false,
                  order: 1,
                  pointStyle: 'line',
                  pointBackgroundColor: '#2c3e50',
                  pointBorderColor: '#2c3e50',
                } as any
              ]
            };
          } else {
            const valores = results.map(res => res.monthlyAccumulated || null);
            const metasFiltradas = this.metasDB.slice(0, numMeses);
            
            this.monthlyChartData = {
              labels: [...labels],
              datasets: [
                {
                  type: 'bar',
                  label: this.isProduccionBase() ? 'Producción Kg/Ton' : 'Consumo Kg/Ton',
                  data: [...valores],
                  backgroundColor: valores.map((v, idx) => {
                    if (v === null) return '#ccc';
                    const meta = metasFiltradas[idx] || 0;
                    
                    // Aplicar la misma lógica de redondeo/truncado que en los datalabels
                    let valForCompare = Math.round(v * 10) / 10;
                    if (this.selectedProduct === '13') {
                      valForCompare = Math.floor(v * 10) / 10;
                    }

                    const sentidoAsc = this.getSelectedProductConfig().sentidoMeta !== false;
                    const esCumplido = sentidoAsc ? (valForCompare >= meta) : (valForCompare <= meta);
                    return esCumplido ? '#27ae60' : '#e74c3c';
                  }),
                  borderColor: 'transparent',
                  borderWidth: 0,
                  borderRadius: 8,
                  order: 2
                },
                {
                  type: 'line',
                  label: 'Meta Mensual',
                  data: [...metasFiltradas],
                  borderColor: '#2c3e50',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  pointRadius: 0,
                  fill: false,
                  order: 1,
                  pointStyle: 'line',
                  pointBackgroundColor: '#2c3e50',
                  pointBorderColor: '#2c3e50',
                } as any
              ]
            };
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error en gráfico mensual:', err);
          this.cdr.detectChanges();
        }
      });
  }
  
  getRangoMesesYTD(): string {
    const hastaMesIndex = parseInt(this.selectedMonth || '12', 10) - 1;
    if (hastaMesIndex < 0) return 'Ene–Ene';
    const desde = this.meses[0].label.substring(0, 3);
    const hasta = this.meses[hastaMesIndex]?.label.substring(0, 3) || 'Dic';
    return `${desde}–${hasta}`;
  }
  
  configurarGraficos(): void {
    const adjustYAxisLimits = (scale: any) => {
      const datasets = scale.chart.data.datasets;
      const scaleId = scale.id;
      let minVal = Infinity;
      let maxVal = -Infinity;
      datasets.forEach((ds: any) => {
        if (ds.yAxisID === scaleId || (!ds.yAxisID && scaleId === 'y')) {
          ds.data.forEach((val: any) => {
            if (typeof val === 'number') {
              if (val < minVal && val > 0) minVal = val;
              if (val > maxVal) maxVal = val;
            }
          });
        }
      });
      if (minVal !== Infinity && maxVal !== -Infinity) {
        const range = maxVal - minVal;
        scale.min = minVal - (range * 0.08);
        scale.max = maxVal + (range * 0.15); // Aumentado a 15% para evitar desbordamiento
      }
    };

    this.dailyChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      layout: { padding: { top: 30 } },
      clip: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, padding: 15, font: { size: 12 } } },
        datalabels: { display: false }
      },
      scales: {
        y: {
          beginAtZero: false,
          afterDataLimits: adjustYAxisLimits,
          title: { display: true, text: this.isB100() ? 'Toneladas' : 'Consumo Kg/Ton' },
          grid: { display: false }
        },
        x: { title: { display: true, text: 'Fecha' }, grid: { display: false } }
      }
    } as any;

    this.dailyConversionOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      layout: { padding: { top: 30 } },
      clip: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, padding: 15, font: { size: 12 } } },
        datalabels: { display: false }
      },
      scales: {
        y: {
          beginAtZero: false,
          afterDataLimits: adjustYAxisLimits,
          title: { display: true, text: 'Conversión (%)' },
          ticks: { callback: (value) => value + '%' },
          grid: { display: false }
        },
        x: { title: { display: true, text: 'Fecha' }, grid: { display: false } }
      }
    } as ChartOptions<'line'>;

    // =============================================
    // MEJORA: formatter usa formatLabel() para no
    // redondear — muestra decimales reales del valor
    // =============================================
    this.monthlyCxPOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      layout: { padding: { top: 70 } },
      clip: true,
      plugins: {
        legend: {
          position: 'top',
          labels: { usePointStyle: true, boxWidth: 30, padding: 15, font: { size: 12 } }
        },
        datalabels: {
          display: (ctx: any) => {
            return ctx.datasetIndex === 0 && ctx.dataset.data[ctx.dataIndex] !== null && ctx.dataset.data[ctx.dataIndex] !== 0;
          },
          color: '#333',
          anchor: 'end',
          align: 'top',
          offset: 10,
          font: { weight: 'bold', size: 13 },
          formatter: (value: any) => {
            if (value == null || value === 0) return '';
            return parseFloat(value.toFixed(1)).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
          }
        }
      },
      scales: {
        y: {
          afterDataLimits: (axis: any) => {
            // Recalcular min/max ignorando ceros para que no fuerce el inicio en 0
            let minVal = Infinity;
            let maxVal = -Infinity;
            
            axis.chart.data.datasets.forEach((ds: any) => {
              ds.data.forEach((v: any) => {
                if (v !== null && v > 0) {
                  if (v < minVal) minVal = v;
                  if (v > maxVal) maxVal = v;
                }
              });
            });

            if (minVal !== Infinity) {
              axis.min = minVal * 0.95; // -5% margen inferior
              axis.max = maxVal * 1.10; // +10% margen superior
            }
          },
          title: { display: true, text: 'Consumo Específico (Kg/Ton)' },
          grid: { display: false }
        },
        x: { grid: { display: false } }
      }
    };

    // =============================================
    // MEJORA: formatter con sufijo '%' sin redondeo
    // =============================================
    this.monthlyPxCOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      layout: { padding: { top: 70 } },
      clip: true,
      plugins: {
        legend: {
          position: 'top',
          labels: { usePointStyle: true, boxWidth: 30, padding: 15, font: { size: 12 } }
        },
        datalabels: {
          display: (ctx: any) => {
            return ctx.datasetIndex === 0 && ctx.dataset.data[ctx.dataIndex] !== null && ctx.dataset.data[ctx.dataIndex] !== 0;
          },
          color: '#333',
          anchor: 'end',
          align: 'top',
          offset: 10,
          font: { weight: 'bold', size: 13 },
          formatter: (value: any) => {
            if (value == null || value === 0) return '';
            return parseFloat(value.toFixed(1)).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
          }
        }
      },
      scales: {
        y: {
          afterDataLimits: (axis: any) => {
            let minVal = Infinity;
            let maxVal = -Infinity;
            axis.chart.data.datasets.forEach((ds: any) => {
              ds.data.forEach((v: any) => {
                if (v !== null && v > 0) {
                  if (v < minVal) minVal = v;
                  if (v > maxVal) maxVal = v;
                }
              });
            });
            if (minVal !== Infinity) {
              axis.min = minVal * 0.95; // -5% margen inferior
              axis.max = maxVal * 1.10; // +10% margen superior
            }
          },
          title: { display: true, text: '% Conversión' },
          ticks: { callback: (value: string) => value + '%' },
          grid: { display: false }
        },
        x: { grid: { display: false } }
      }
    };

    // =============================================
    // MEJORA: formatter para gráfica mensual general
    // sin redondeo
    // =============================================
    this.monthlyChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      layout: { padding: { top: 70 } },
      clip: true,
      plugins: {
        legend: {
          position: 'top',
          labels: { usePointStyle: true, boxWidth: 30, padding: 15, font: { size: 12 } }
        },
        datalabels: {
          display: (ctx: any) => {
            return ctx.datasetIndex === 0 && ctx.dataset.data[ctx.dataIndex] !== null && ctx.dataset.data[ctx.dataIndex] !== 0;
          },
          color: '#000',
          anchor: 'end',
          align: 'top',
          offset: 10,
          font: { weight: 'bold', size: 13 },
          formatter: (value: any) => {
            if (value == null || value === 0) return '';
            // Metilato: truncar a 1 decimal sin redondear (19.97 → 19,9)
            if (this.selectedProduct === '13') {
              const truncated = Math.floor(value * 10) / 10;
              return truncated.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            }
            return parseFloat(value.toFixed(1)).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
          }
        }
      },
      scales: {
        y: {
          afterDataLimits: (axis: any) => {
            let minVal = Infinity;
            let maxVal = -Infinity;
            axis.chart.data.datasets.forEach((ds: any) => {
              ds.data.forEach((v: any) => {
                if (v !== null && v > 0) {
                  if (v < minVal) minVal = v;
                  if (v > maxVal) maxVal = v;
                }
              });
            });
            if (minVal !== Infinity) {
              axis.min = minVal * 0.95; // -5% margen inferior
              axis.max = maxVal * 1.10; // +10% margen superior
            }
          },
          title: {
            display: true,
            text: this.isB100()
              ? 'Toneladas'
              : this.isMpGrasas()
                ? 'Consumo Específico (Kg/Ton)'
                : (this.isProduccionBase() ? 'Producción Kg/Ton' : 'Consumo Kg/Ton')
          },
          grid: { display: false }
        },
        x: { grid: { display: false } }
      }
    };

    this.costoDirectoOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          position: 'top',
          labels: { usePointStyle: true, boxWidth: 8, padding: 15, font: { size: 12 } }
        },
        datalabels: { display: false }
      },
      scales: {
        'y-costo': {
          beginAtZero: false,
          afterDataLimits: adjustYAxisLimits,
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Costo ($/Ton)' },
          grid: { display: true }
        },
        'y-consumo': {
          beginAtZero: false,
          afterDataLimits: adjustYAxisLimits,
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Consumo (Kg/Ton)' },
          grid: { display: false }
        },
        x: { title: { display: true, text: 'Fecha' }, grid: { display: false } }
      }
    } as ChartOptions<'line'>;
  }
  
  onProductChange(): void {
    console.log('onProductChange - Nuevo selectedProduct:', this.selectedProduct);
    this.limpiarDatos();
    this.configurarGraficos();
    this.cdr.detectChanges();
    setTimeout(() => {
      this.actualizarDatos();
      this.cdr.detectChanges();
    }, 100);
  }
  
  goHome(): void {
    this.router.navigate(['/home']);
  }
  
  onYearChange(): void {
    this.limpiarDatos();
    this.actualizarDatos();
  }
  
  onMonthChange(): void {
    this.limpiarDatos();
    this.actualizarDatos();
  }
  
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
  
  getProductoNombre(): string {
    const p = this.productos.find(p => 
      String(p.id) === String(this.selectedProduct) || 
      String(p.idProductoSiesa) === String(this.selectedProduct)
    );
    return p ? p.nombre : '...';
  }
  
  getMesesDisponibles(): { value: string; label: string }[] {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (this.selectedYear === currentYear.toString()) {
      return this.meses.slice(0, currentMonth);
    } else if (+this.selectedYear > currentYear) {
      return this.meses.slice(0, currentMonth);
    }
    return [...this.meses];
  }


  cargarProductos(): void {
  this.productoservices.getProductos()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        console.log('Productos desde BD:', data);

        // Agregamos solo los marcados para CMI + Costo Directo
        this.productos = [
          ...data.filter(p => p.mostrarCmi !== false),
          {
            id: 'CostoDirecto',
            nombre: 'Costo Directo',
            esCostoDirecto: true,
            consumptionDocTypes: [],
            productionDocTypes: []
          }
        ];

        // Seleccionar el primero siempre al cargar
        if (this.productos.length > 0) {
          this.selectedProduct = this.productos[0].idProductoSiesa || this.productos[0].id;
          this.actualizarDatos(); // Forzar carga del primero
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
      }
    });
  }

  isGoalMet(): boolean {
    const val = this.isB100() ? this.monthlyData.total_produccion : this.monthlyData.acumulado_mes;
    if (val === 0 || this.metaActualDB === 0) return true;
    
    // Si es MpGrasas, evaluamos el CxP
    if (this.isMpGrasas()) {
       return this.monthlyData.acumulado_CxP <= this.metaActualDB;
    }

    const sentidoAsc = this.getSelectedProductConfig().sentidoMeta !== false;
    return sentidoAsc ? (val >= this.metaActualDB) : (val <= this.metaActualDB);
  }

  isYtdGoalMet(): boolean {
    const val = this.isB100() ? this.ytdData.total_produccion : this.ytdData.acumulado_mes;
    if (val === 0 || this.metaActualDB === 0) return true;
    
    if (this.isMpGrasas()) {
       return this.ytdData.acumulado_CxP <= this.metaActualDB;
    }

    const sentidoAsc = this.getSelectedProductConfig().sentidoMeta !== false;
    return sentidoAsc ? (val >= this.metaActualDB) : (val <= this.metaActualDB);
  }
}

/**
 * Función global para ajustar los límites del eje Y de forma dinámica.
 * - Reduce el mínimo en un 8% del rango para que no inicie en 0.
 * - Aumenta el máximo en un 15% del rango para dejar espacio a las etiquetas arriba.
 */
function adjustYAxisLimits(axis: any) {
  const min = axis.min;
  const max = axis.max;
  const range = max - min;
  
  // 5% de margen hacia abajo
  axis.min = min - (range * 0.05);
  // 10% de margen hacia arriba
  axis.max = max + (range * 0.10);
}