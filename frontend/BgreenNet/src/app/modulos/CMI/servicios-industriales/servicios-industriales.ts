import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions, Chart, registerables } from 'chart.js';
import { forkJoin, Subject, of, Observable } from 'rxjs';
import { switchMap, takeUntil, catchError, map } from 'rxjs/operators';

import { cmiplantaservices } from '../../../servicios/cmiplantaservices';
import { productoservices } from '../../../servicios/productoservices';
import { MetanolRequest } from '../../../models/Modelos_CMI/MetanolRequest';
import { ScadaService } from '../../../servicios/scadaservices';

Chart.register(...registerables);

// ── Constantes ────────────────────────────────────────────────────────────────
const FOCO_META = 730;
const B100_ID = '26';

// ── Interfaces locales ────────────────────────────────────────────────────────
interface FocoKPIs {
  focoUltimoDia: number | null;
  focoMensual: number | null;
  focoAnual: number | null;
  totalVaporMes: number;
  totalB100Mes: number;
  totalVaporAnio: number;
  totalB100Anio: number;
  meta: number;
}

interface VaporConB100 {
  fecha: string;
  etiqueta: string;
  totalVapor: number;
  isblDesagregado: number;
  zona700yOtros: number;
  tonB100: number;
  foco: number;
  focoStatus: 'ok' | 'desviacion' | 'sin-dato';
}

@Component({
  selector: 'app-servicios-industriales',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './servicios-industriales.html',
  styleUrl: './servicios-industriales.css',
})
export class ServiciosIndustriales implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private b100BaseRequest: Omit<MetanolRequest, 'startDate' | 'endDate'> | null = null;
  // Cache de datos de sensores: clave = "servicio-anio-mes"
  private sensorCache    = new Map<string, any[]>();
  // Cache de B100 mensual: clave = "anio-mes"
  private b100MesCache   = new Map<string, any>();
  // Cache de B100 anual: clave = anio
  private b100AnioCache  = new Map<string, any>();
  // Cache de sensor anual: clave = "vapor|energia-anio"
  private sensorAnioCache = new Map<string, any>();

  // Filtros
  selectedServicio: any = 'general';
  selectedYear: string = new Date().getFullYear().toString();
  selectedMonth: string = (new Date().getMonth() + 1).toString().padStart(2, '0');

  meses = [
    { value: '01', label: 'Enero' },  { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },  { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },   { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },  { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },  { value: '12', label: 'Diciembre' }
  ];

  // KPIs
  focoMeta = FOCO_META;
  kpis: FocoKPIs = {
    focoUltimoDia: null, focoMensual: null, focoAnual: null,
    totalVaporMes: 0, totalB100Mes: 0, totalVaporAnio: 0, totalB100Anio: 0,
    meta: FOCO_META
  };

  // Datos combinados (para tabla de días con desviación)
  datosDiarios: VaporConB100[] = [];
  diasConDesviacion: VaporConB100[] = [];

  // Cargando
  cargando = false;

  // ── Gráfica 1: Comportamiento consumo vapor por minuto (line 2 series) ──
  comportamientoData: ChartData<'line'> = { labels: [], datasets: [] };
  comportamientoOptions: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 20, maxRotation: 45 } },
      y: { grid: { display: false }, title: { display: true, text: 'Vapor (por minuto)' } }
    },
    plugins: { legend: { position: 'top' } }
  };

  // ── Gráfica 2: Consumo total vs Ton B100 (line doble eje) ──
  totalVsB100Data: ChartData<'line'> = { labels: [], datasets: [] };

  // ── Gráfica 3: ISBL vs Ton B100 (line doble eje) ──
  isblVsB100Data: ChartData<'line'> = { labels: [], datasets: [] };

  // ── Gráfica 4: FOCO diario (line coloreada) ──
  focoData: ChartData<'line'> = { labels: [], datasets: [] };



  // Opciones para gráficas de doble eje
  mixedOptions: ChartOptions<'line'> = {};
  focoOptions: ChartOptions<'line'> = {};

  constructor(
    private cmiplantaService: cmiplantaservices,
    private productoService: productoservices,
    private cdr: ChangeDetectorRef
  ) {}

  // ── Helper: parsear valores numéricos de PLC/SCADA ───────────────────────
  private parsePlcValue(val: any): number {
    if (val === null || val === undefined || val === '') return 0;
    const n = parseFloat(String(val));
    return isNaN(n) ? 0 : n;
  }

  // ── Helper: rango de fechas para el mes/año seleccionado ─────────────────
  private getFechaRango(month: string, year: string): { fechaInicio: string; fechaFin: string } {
    const fechaInicio = `${year}-${month}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const hoy = new Date();
    const esActual = hoy.getFullYear().toString() === year && (hoy.getMonth() + 1).toString().padStart(2, '0') === month;
    const fechaFin = esActual
      ? hoy.toISOString().split('T')[0]
      : `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
    return { fechaInicio, fechaFin };
  }

  ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['servicio']) {
        this.selectedServicio = params['servicio'];
      }
      this.cargarDatosApropiados();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatosApropiados() {
    if (this.selectedServicio === 'vapor' || this.selectedServicio === 'energia') {
      this.cargarDatos();
    } else if (this.selectedServicio === 'general') {
      this.cargarDatosGeneral();
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  getServicioNombre(): string {
    const map: any = { energia: 'Energía', gas: 'Gas', vapor: 'Vapor', agua: 'Agua', general: 'General' };
    return map[this.selectedServicio] || 'General';
  }

  getMesesDisponibles() {
    const hoy = new Date();
    if (this.selectedYear === hoy.getFullYear().toString()) {
      return this.meses.filter(m => parseInt(m.value) <= hoy.getMonth() + 1);
    }
    return this.meses;
  }

  getFechaRango(mes: string, anio: string) {
    const hoy = new Date();
    const esMesActual = mes === (hoy.getMonth() + 1).toString().padStart(2, '0')
      && anio === hoy.getFullYear().toString();
    const fechaInicio = `${anio}-${mes}-01`;
    const ultimoDia = new Date(+anio, +mes, 0).getDate();
    const fechaFin = esMesActual
      ? hoy.toISOString().split('T')[0]
      : `${anio}-${mes}-${ultimoDia}`;
    return { fechaInicio, fechaFin };
  }

  focoClass(val: number | null): string {
    if (val === null) return '';
    return val <= FOCO_META ? 'success' : 'danger';
  }

  // ─── Eventos ────────────────────────────────────────────────────────────────

  onServicioChange() {
    this.cargarDatosApropiados();
  }

  onFiltroChange() {
    this.cargarDatosApropiados();
  }

  cargarDatosGeneral() {
    this.cargando = true;
    const { fechaInicio, fechaFin } = this.getFechaRango(this.selectedMonth, this.selectedYear);
    const hoy = new Date();
    const fechaFinAnio = hoy.getFullYear().toString() === this.selectedYear
      ? hoy.toISOString().split('T')[0]
      : `${this.selectedYear}-12-31`;

    // 1. Obtener config de B100 dinámicamente
    this.productoService.getProductos().pipe(
      switchMap(productos => {
        const b100 = productos.find(p =>
          String(p.id) === B100_ID || String(p.idProductoSiesa) === B100_ID
        );
        if (!b100) throw new Error('Producto B100 no encontrado en la API de productos');
        const req: Omit<MetanolRequest, 'startDate' | 'endDate'> = {
          consumptionProductId: b100.idProductoSiesa || b100.id,
          productionProductId:  b100.idProductoSiesa || b100.id,
          consumptionDocTypes:  b100.consumptionDocTypes,
          productionDocTypes:   b100.productionDocTypes
        };

        // 2. Llamar en paralelo: vapor + B100 mes + B100 histórico
        return forkJoin({
          vapor:    this.plcsService.getVapor(),
          b100Mes:  this.cmiplantaService.obtenerDatos({ ...baseRequest, startDate: fechaInicio, endDate: fechaFin }),
          b100Historico: this.cmiplantaService.obtenerDatos({ ...baseRequest, startDate: '2025-01-01', endDate: hoy.toISOString().split('T')[0] })
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ vapor, b100Mes, b100Historico }) => {
        // ── Datos por MINUTO para Gráfica 1 (Comportamiento) ──
        const labelsMinuto: string[] = [];
        const isblMinuto: number[] = [];
        const zona700Minuto: number[] = [];

        vapor
          .filter(row => {
            if (!row.FechaRegistro) return false;
            const date = new Date(row.FechaRegistro);
            return date.getUTCFullYear().toString() === this.selectedYear
              && (date.getUTCMonth() + 1).toString().padStart(2, '0') === this.selectedMonth;
          })
          .forEach(row => {
            const date = new Date(row.FechaRegistro);
            const hh = date.getUTCHours().toString().padStart(2, '0');
            const mm = date.getUTCMinutes().toString().padStart(2, '0');
            const dd = date.getUTCDate().toString().padStart(2, '0');
            const mo = (date.getUTCMonth() + 1).toString().padStart(2, '0');
            labelsMinuto.push(`${dd}/${mo} ${hh}:${mm}`);

            const v1 = this.plcsService.parsePlcValue(row['1100FTSG11']);
            const v2 = this.plcsService.parsePlcValue(row['550FT04']);
            const v3 = this.plcsService.parsePlcValue(row['1100FTSG12']);
            isblMinuto.push(Number((v1 - v2).toFixed(2)));
            zona700Minuto.push(Number((v3 - v1).toFixed(2)));
          });

        // ── Agrupar vapor por día (para gráficas 2, 3 y FOCO) ──
        const mapaVapor = new Map<string, { tv: number; isbl: number; z700: number }>();

        vapor.forEach(row => {
          if (!row.FechaRegistro) return;
          const date = new Date(row.FechaRegistro);
          const rowYear  = date.getUTCFullYear().toString();
          const rowMonth = (date.getUTCMonth() + 1).toString().padStart(2, '0');
          if (rowYear !== this.selectedYear || rowMonth !== this.selectedMonth) return;

          const fecha = date.toISOString().split('T')[0];
          const v1 = this.plcsService.parsePlcValue(row['1100FTSG11']);
          const v2 = this.plcsService.parsePlcValue(row['550FT04']);
          const v3 = this.plcsService.parsePlcValue(row['1100FTSG12']);

          const ex = mapaVapor.get(fecha);
          if (ex) {
            ex.tv   += v3;
            ex.isbl += (v1 - v2);
            ex.z700 += (v3 - v1);
          } else {
            mapaVapor.set(fecha, { tv: v3, isbl: v1 - v2, z700: v3 - v1 });
          }
        });

        // ── Mapa B100 por fecha ──
        const mapaB100 = new Map<string, number>();
        (b100Mes.dailyData || []).forEach(d => mapaB100.set(d.date, d.produccion));

        // ── Unir por fecha ──
        const todasFechas = [
          ...new Set([...mapaVapor.keys(), ...mapaB100.keys()])
        ].sort();

        this.datosDiarios = todasFechas.map(fecha => {
          const [y, m, d] = fecha.split('-');
          const tv   = Number((mapaVapor.get(fecha)?.tv   || 0).toFixed(2));
          const isbl = Number((mapaVapor.get(fecha)?.isbl || 0).toFixed(2));
          const z700 = Number((mapaVapor.get(fecha)?.z700 || 0).toFixed(2));
          const b100 = Number((mapaB100.get(fecha) || 0).toFixed(2));
          const foco = b100 > 0 ? Number((tv / b100).toFixed(2)) : 0;
          const focoStatus: 'ok' | 'desviacion' | 'sin-dato' =
            b100 === 0 ? 'sin-dato' : foco <= FOCO_META ? 'ok' : 'desviacion';

          return { fecha, etiqueta: `${d}/${m}`, totalVapor: tv, isblDesagregado: isbl, zona700yOtros: z700, tonB100: b100, foco, focoStatus };
        });

          this.diasConDesviacion = this.datosDiarios.filter(d => d.focoStatus === 'desviacion');

        // ── KPIs ──
        const totalVaporMes = this.datosDiarios.reduce((s, d) => s + d.totalVapor, 0);
        const totalB100Mes  = b100Mes.totalProduction || 0;
        const focosValidos  = this.datosDiarios.filter(d => d.foco > 0).map(d => d.foco);

        // KPI anual: sumar vapor año completo
        let totalVaporAnio = 0;
        vapor.forEach(row => {
          if (!row.FechaRegistro) return;
          if (new Date(row.FechaRegistro).getUTCFullYear().toString() !== this.selectedYear) return;
          totalVaporAnio += this.plcsService.parsePlcValue(row['1100FTSG12']);
        });

        // Calcular total producción B100 del año actual
        const totalB100Anio = (b100Historico.dailyData || [])
          .filter(d => d.date.startsWith(this.selectedYear))
          .reduce((sum, d) => sum + d.produccion, 0);

        this.kpis = {
          focoUltimoDia: focosValidos.length ? focosValidos[focosValidos.length - 1] : null,
          focoMensual:   totalB100Mes  > 0 ? Number((totalVaporMes  / totalB100Mes).toFixed(2))  : null,
          focoAnual:     totalB100Anio > 0 ? Number((totalVaporAnio / totalB100Anio).toFixed(2)) : null,
          totalVaporMes, totalB100Mes,
          totalVaporAnio: Number(totalVaporAnio.toFixed(2)),
          totalB100Anio,
          meta: FOCO_META
        };



        this.buildCharts(labelsMinuto, isblMinuto, zona700Minuto);
        this.cargando = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 150);
      },
      error: (err: any) => {
        console.error('Error cargando datos:', err);
        this.cargando = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 150);
      }
    });
  }

  // ─── Construcción de gráficas ────────────────────────────────────────────────

  buildCharts(labelsMinuto: string[], isblMinuto: number[], zona700Minuto: number[]) {
    const labels    = this.datosDiarios.map(d => d.etiqueta);
    const tv        = this.datosDiarios.map(d => d.totalVapor);
    const isbl      = this.datosDiarios.map(d => d.isblDesagregado);
    const b100      = this.datosDiarios.map(d => d.tonB100);
    const foco      = this.datosDiarios.map(d => d.foco);
    const focoColors = this.datosDiarios.map(d =>
      d.focoStatus === 'ok' ? '#27ae60' : d.focoStatus === 'desviacion' ? '#e74c3c' : '#bdc3c7'
    );

    // ── Gráfica 1: Comportamiento por minuto (line) ──
    this.comportamientoData = {
      labels: labelsMinuto,
      datasets: [
        {
          label: 'ISBL Desagregado',
          data: isblMinuto,
          borderColor: '#36A2EB', backgroundColor: 'rgba(54,162,235,0.08)',
          fill: true, tension: 0.3, pointRadius: 0, pointHoverRadius: 4,
          borderWidth: 1.5
        },
        {
          label: 'Zona 700 y Otros',
          data: zona700Minuto,
          borderColor: '#FF6384', backgroundColor: 'rgba(255,99,132,0.08)',
          fill: true, tension: 0.3, pointRadius: 0, pointHoverRadius: 4,
          borderWidth: 1.5
        }
      ]
    };

    // Opciones de doble eje para líneas
    const dualLineOptions = (labelLeft: string, labelRight: string): ChartOptions<'line'> => ({
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        'y-left':  { type: 'linear', position: 'left',  grid: { display: false }, title: { display: true, text: labelLeft  } },
        'y-right': { type: 'linear', position: 'right', grid: { display: false }, title: { display: true, text: labelRight } }
      },
      plugins: { legend: { position: 'top' }, datalabels: { display: false } as any }
    });

    // ── Gráfica 2: Total vapor vs B100 (líneas doble eje) ──
    this.totalVsB100Data = {
      labels,
      datasets: [
        {
          label: 'Ton B100 producida',
          data: b100,
          borderColor: '#13590c', backgroundColor: 'rgba(19,89,12,0.08)',
          borderWidth: 2, pointRadius: 4, pointHoverRadius: 7,
          fill: true, tension: 0.4, yAxisID: 'y-right'
        },
        {
          label: 'Consumo Total Vapor (1100FTSG12)',
          data: tv,
          borderColor: '#7ac3e0', backgroundColor: 'rgba(122,195,224,0.08)',
          borderWidth: 2, pointRadius: 4, pointHoverRadius: 7,
          fill: true, tension: 0.4, yAxisID: 'y-left'
        }
      ]
    };
    this.mixedOptions = dualLineOptions('Vapor (suma diaria)', 'Ton B100');

    // ── Gráfica 3: ISBL vs B100 (líneas doble eje) ──
    this.isblVsB100Data = {
      labels,
      datasets: [
        {
          label: 'Ton B100 producida',
          data: b100,
          borderColor: '#13590c', backgroundColor: 'rgba(19,89,12,0.08)',
          borderWidth: 2, pointRadius: 4, pointHoverRadius: 7,
          fill: true, tension: 0.4, yAxisID: 'y-right'
        },
        {
          label: 'ISBL Desagregado',
          data: isbl,
          borderColor: '#36A2EB', backgroundColor: 'rgba(54,162,235,0.08)',
          borderWidth: 2, pointRadius: 4, pointHoverRadius: 7,
          fill: true, tension: 0.4, yAxisID: 'y-left'
        }
      ]
    };

    // ── Gráfica 4: FOCO diario (línea coloreada por punto + Ton B100) ──
    this.focoData = {
      labels,
      datasets: [
        {
          label: 'Ton B100 producida',
          data: b100,
          borderColor: '#13590c', backgroundColor: 'rgba(19,89,12,0.06)',
          borderWidth: 1.5, pointRadius: 3,
          fill: true, tension: 0.4, yAxisID: 'y-right'
        },
        {
          label: 'FOCO (kg vapor / Ton B100)',
          data: foco,
          borderColor: '#FF9800', backgroundColor: 'transparent',
          borderWidth: 2, pointRadius: 6, pointHoverRadius: 9,
          pointBackgroundColor: focoColors, pointBorderColor: focoColors,
          fill: false, tension: 0.3, yAxisID: 'y-left'
        },
        {
          label: `Meta (${FOCO_META} kg/Ton)`,
          data: Array(labels.length).fill(FOCO_META),
          borderColor: '#2c3e50', borderWidth: 2,
          borderDash: [6, 4], pointRadius: 0, fill: false,
          yAxisID: 'y-left'
        }
      ]
    };
  }

  filtrarVaporDiarioHora() {
    const mapaSource = this.resolucionVapor === 'hora' ? this.mapaVaporHorario : this.mapaVapor5Min;
    if (!this.selectedDiaVapor || !mapaSource.has(this.selectedDiaVapor)) {
      this.comportamientoData = { labels: [], datasets: [] };
      this.cdr.detectChanges();
      return;
    }

    const registros = mapaSource.get(this.selectedDiaVapor)!;
    const [y, m, d] = this.selectedDiaVapor.split('-');

    const labels = registros.map((r: any) => r.label);
    const calderaData = registros.map((r: any) => r.caldera);
    const isblTotalData = registros.map((r: any) => r.isblTotal);
    const isblDesData = registros.map((r: any) => r.isblDesagregado);
    const u550Data = registros.map((r: any) => r.u550);
    const zona700Data = registros.map((r: any) => r.zona700);

    this.comportamientoData = {
      labels,
      datasets: [
        {
          label: 'Consumo total caldera (1100FTSG12)',
          data: calderaData,
          borderColor: '#34495e', backgroundColor: 'rgba(52,73,94,0.08)',
          borderWidth: 2, pointRadius: 0, pointHoverRadius: 5,
          pointBackgroundColor: '#34495e', pointBorderColor: '#34495e', pointBorderWidth: 0,
          fill: true, tension: 0.4
        },
        {
          label: 'ISBL total (1100FTSG11)',
          data: isblTotalData,
          borderColor: '#2980b9', backgroundColor: 'rgba(41,128,185,0.08)',
          borderWidth: 2, pointRadius: 0, pointHoverRadius: 5,
          pointBackgroundColor: '#2980b9', pointBorderColor: '#2980b9', pointBorderWidth: 0,
          fill: true, tension: 0.4
        },
        {
          label: 'ISBL desagregado',
          data: isblDesData,
          borderColor: '#7ac3e0', backgroundColor: 'rgba(122,195,224,0.08)',
          borderWidth: 2, pointRadius: 0, pointHoverRadius: 5,
          pointBackgroundColor: '#7ac3e0', pointBorderColor: '#7ac3e0', pointBorderWidth: 0,
          fill: true, tension: 0.4
        },
        {
          label: 'Unidad 550 (550FT04)',
          data: u550Data,
          borderColor: '#9b59b6', backgroundColor: 'rgba(155,89,182,0.08)',
          borderWidth: 2, pointRadius: 0, pointHoverRadius: 5,
          pointBackgroundColor: '#9b59b6', pointBorderColor: '#9b59b6', pointBorderWidth: 0,
          fill: true, tension: 0.4
        },
        {
          label: 'Zona 700 y otros consumidores',
          data: zona700Data,
          borderColor: '#e67e22', backgroundColor: 'rgba(230,126,34,0.08)',
          borderWidth: 2, pointRadius: 0, pointHoverRadius: 5,
          pointBackgroundColor: '#e67e22', pointBorderColor: '#e67e22', pointBorderWidth: 0,
          fill: true, tension: 0.4
        }
      ]
    };
    this.cdr.detectChanges();
  }

  cambiarResolucionVapor(res: 'hora' | 'minuto') {
    this.resolucionVapor = res;
    const axisTitle = res === 'hora' ? 'Consumo de Vapor (kg/h)' : 'Consumo de Vapor (kg)';
    if (this.vaporComportamientoOptions.scales?.['y']?.['title']) {
      this.vaporComportamientoOptions.scales['y']['title']['text'] = axisTitle;
    }
    this.filtrarVaporDiarioHora();
  }

  navegarDiaVapor(delta: number) {
    const idx = this.diasDisponiblesVapor.indexOf(this.selectedDiaVapor);
    const newIdx = idx + delta;
    if (newIdx >= 0 && newIdx < this.diasDisponiblesVapor.length) {
      this.selectedDiaVapor = this.diasDisponiblesVapor[newIdx];
      this.filtrarVaporDiarioHora();
    }
  }

  // ─── LÓGICA ASÍNCRONA DATOS ANUALES ──────────────────────────────────────────

  public procesarDatosAnualesLocales(
    b100Historico: any, 
    rawVaporAnual: any[], 
    rawEnergiaAnual: any[],
    anioInicio: string,
    fechaFinAnio: string,
    isAntesDeJunio2026: boolean
  ) {
    const totalB100Anio = (b100Historico?.dailyData || [])
      .filter((d: any) => d.date >= anioInicio && d.date <= fechaFinAnio)
      .reduce((sum: number, d: any) => sum + d.produccion, 0);

    const pad = (n: number) => n.toString().padStart(2, '0');

    // 1. Calcular Vapor Anual sumando las diferencias diarias (con corte a las 6:00 AM)
    let totalVaporAnio = 0;
    if (Array.isArray(rawVaporAnual) && rawVaporAnual.length > 0) {
      const parsedVapor = rawVaporAnual
        .filter((row: any) => row.FechaRegistro)
        .map((row: any) => ({
          time: new Date(row.FechaRegistro).getTime(),
          v3: this.plcsService.parsePlcValue(row['1100FTSG12'])
        }));
      parsedVapor.sort((a: any, b: any) => a.time - b.time);

      const getClosestVaporRecord = (year: number, month: number, day: number, hour: number) => {
        const targetTime = new Date(year, month - 1, day, hour, 0).getTime();
        if (parsedVapor.length === 0) return null;
        let closest = parsedVapor[0];
        let minDiff = Math.abs(closest.time - targetTime);
        for (const r of parsedVapor) {
          const diff = Math.abs(r.time - targetTime);
          if (diff < minDiff) {
            minDiff = diff;
            closest = r;
          }
        }
        return minDiff <= 3600000 ? closest : null;
      };

      const start = new Date(anioInicio);
      const end = new Date(fechaFinAnio);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const recordToday = getClosestVaporRecord(d.getFullYear(), d.getMonth() + 1, d.getDate(), 6);
        const dNext = new Date(d);
        dNext.setDate(dNext.getDate() + 1);
        const recordNext = getClosestVaporRecord(dNext.getFullYear(), dNext.getMonth() + 1, dNext.getDate(), 6);
        if (recordToday && recordNext) {
          const dailyVapor = Math.max(0, recordNext.v3 - recordToday.v3);
          totalVaporAnio += dailyVapor;
        }
      }
    }

    this.kpis.totalB100Anio = totalB100Anio;
    this.kpis.totalVaporAnio = Number(totalVaporAnio.toFixed(2));
    this.kpis.focoAnual = totalB100Anio > 0 ? Number((totalVaporAnio / totalB100Anio).toFixed(2)) : 0;
    console.log(`[Cálculo FOCO Anual Vapor] Total Vapor Año: ${this.kpis.totalVaporAnio} kg / Total B100 Año: ${totalB100Anio} Ton => FOCO Anual: ${this.kpis.focoAnual} kg/Ton`);

    // 2. Calcular Energía Anual sumando consumos
    let totalEnergiaAnio = 0;
    if (Array.isArray(rawEnergiaAnual) && rawEnergiaAnual.length > 0) {
      if (isAntesDeJunio2026) {
        // Lógica de resta diaria a las 6 AM
        const parsedEnergia = rawEnergiaAnual
          .filter((row: any) => row.FechaRegistro || row.timestamp || row.fecharegistro)
          .map((row: any) => {
            const rawFecha = row.FechaRegistro || row.timestamp || row.fecharegistro;
            return {
              time: new Date(rawFecha).getTime(),
              cg: this.plcsService.parsePlcValue(row['ENERGIA'] || row['energia']) / 10
            };
          });

        const getClosestEnergiaRecord = (year: number, month: number, day: number, hour: number) => {
          const targetTime = new Date(year, month - 1, day, hour, 0).getTime();
          if (parsedEnergia.length === 0) return null;
          let closest = parsedEnergia[0];
          let minDiff = Math.abs(closest.time - targetTime);
          for (const r of parsedEnergia) {
            const diff = Math.abs(r.time - targetTime);
            if (diff < minDiff) {
              minDiff = diff;
              closest = r;
            }
          }
          return closest;
        };

        const start = new Date(anioInicio);
        const end = new Date(fechaFinAnio);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const recordToday = getClosestEnergiaRecord(d.getFullYear(), d.getMonth() + 1, d.getDate(), 6);
          const dNext = new Date(d);
          dNext.setDate(dNext.getDate() + 1);
          const recordNext = getClosestEnergiaRecord(dNext.getFullYear(), dNext.getMonth() + 1, dNext.getDate(), 6);
          if (recordToday && recordNext) {
            let diff_cg = Math.max(0, recordNext.cg - recordToday.cg);
            const fechaStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            if (fechaStr === '2026-01-22') diff_cg = 18874;
            else if (fechaStr === '2026-01-23') diff_cg = 19773;
            else if (fechaStr === '2026-01-24') diff_cg = 19202;
            else if (fechaStr === '2026-01-25') diff_cg = 20037;
            else if (fechaStr === '2026-01-26') diff_cg = 20038;
            totalEnergiaAnio += diff_cg;
          }
        }
      } else {
        // Lógica de Max - Min por día
        const energiaDiariaMap = new Map<string, {min: number, max: number}>();
        rawEnergiaAnual.forEach((row: any) => {
          const rawFecha = row.FechaRegistro || row.timestamp || row.fecharegistro;
          if (!rawFecha) return;
          const date = new Date(rawFecha);
          const fecha = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
          
          const cg = this.plcsService.parsePlcValue(row['ENERGIA'] || row['energia']) / 10;
          if (cg > 0) {
            if (!energiaDiariaMap.has(fecha)) {
              energiaDiariaMap.set(fecha, {min: Number.MAX_VALUE, max: -Number.MAX_VALUE});
            }
            const dia = energiaDiariaMap.get(fecha)!;
            if (cg < dia.min) dia.min = cg;
            if (cg > dia.max) dia.max = cg;
          }
        });

        energiaDiariaMap.forEach((dia) => {
          if (dia.max >= dia.min) {
            totalEnergiaAnio += (dia.max - dia.min);
          }
        });
      }
    }

    this.energiaKpis.totalB100Anio = totalB100Anio;
    this.energiaKpis.totalEnergiaAnio = Number(totalEnergiaAnio.toFixed(2));
    this.energiaKpis.anual = totalB100Anio > 0 ? Number((totalEnergiaAnio / totalB100Anio).toFixed(2)) : 0;
    console.log(`[Cálculo FOCO Anual Energía] Total Energía Año: ${this.energiaKpis.totalEnergiaAnio} kWh / Total B100 Año: ${totalB100Anio} Ton => FOCO Anual: ${this.energiaKpis.anual} kWh/Ton`);

    this.cdr.detectChanges();
  }

  public procesarDatosAnualesLocalesDetalle(
    b100Historico: any, 
    sensorDataAnual: any, 
    isVapor: boolean,
    anioInicio: string,
    fechaFinAnio: string
  ) {
    const totalB100Anio = (b100Historico?.dailyData || [])
      .filter((d: any) => d.date >= anioInicio && d.date <= fechaFinAnio)
      .reduce((sum: number, d: any) => sum + d.produccion, 0);

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (isVapor) {
      this.kpis.totalB100Anio = totalB100Anio;
      let totalVaporAnio = 0;
      if (Array.isArray(sensorDataAnual) && sensorDataAnual.length > 0) {
        const parsedVapor = sensorDataAnual
          .filter((row: any) => row.FechaRegistro)
          .map((row: any) => ({
            time: new Date(row.FechaRegistro).getTime(),
            v3: this.plcsService.parsePlcValue(row['1100FTSG12'])
          }));
        parsedVapor.sort((a: any, b: any) => a.time - b.time);

        const getClosestVaporRecord = (year: number, month: number, day: number, hour: number) => {
          const targetTime = new Date(year, month - 1, day, hour, 0).getTime();
          if (parsedVapor.length === 0) return null;
          let closest = parsedVapor[0];
          let minDiff = Math.abs(closest.time - targetTime);
          for (const r of parsedVapor) {
            const diff = Math.abs(r.time - targetTime);
            if (diff < minDiff) {
              minDiff = diff;
              closest = r;
            }
          }
          return minDiff <= 3600000 ? closest : null;
        };

        const start = new Date(anioInicio);
        const end = new Date(fechaFinAnio);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const recordToday = getClosestVaporRecord(d.getFullYear(), d.getMonth() + 1, d.getDate(), 6);
          const dNext = new Date(d);
          dNext.setDate(dNext.getDate() + 1);
          const recordNext = getClosestVaporRecord(dNext.getFullYear(), dNext.getMonth() + 1, dNext.getDate(), 6);
          if (recordToday && recordNext) {
            const dailyVapor = Math.max(0, recordNext.v3 - recordToday.v3);
            totalVaporAnio += dailyVapor;
          }
        }
      }
      this.kpis.totalVaporAnio = Number(totalVaporAnio.toFixed(2));
      this.kpis.focoAnual = totalB100Anio > 0 ? Number((totalVaporAnio / totalB100Anio).toFixed(2)) : 0;
      console.log(`[Cálculo FOCO Anual Vapor] Total Vapor Año: ${this.kpis.totalVaporAnio} kg / Total B100 Año: ${totalB100Anio} Ton => FOCO Anual: ${this.kpis.focoAnual} kg/Ton`);
    } else {
      // 2. Calcular Energía Anual sumando consumos (localmente)
      let totalEnergiaAnio = 0;
      const yearNum = Number(this.selectedYear);
      const monthNum = Number(this.selectedMonth);
      const isAntesDeJunio2026 = (yearNum < 2026) || (yearNum === 2026 && monthNum < 6);

      if (Array.isArray(sensorDataAnual) && sensorDataAnual.length > 0) {
        if (isAntesDeJunio2026) {
          // Lógica de resta diaria a las 6 AM
          const parsedEnergia = sensorDataAnual
            .filter((row: any) => row.FechaRegistro || row.timestamp || row.fecharegistro)
            .map((row: any) => {
              const rawFecha = row.FechaRegistro || row.timestamp || row.fecharegistro;
              return {
                time: new Date(rawFecha).getTime(),
                cg: this.plcsService.parsePlcValue(row['ENERGIA'] || row['energia']) / 10
              };
            });

          const getClosestEnergiaRecord = (year: number, month: number, day: number, hour: number) => {
            const targetTime = new Date(year, month - 1, day, hour, 0).getTime();
            if (parsedEnergia.length === 0) return null;
            let closest = parsedEnergia[0];
            let minDiff = Math.abs(closest.time - targetTime);
            for (const r of parsedEnergia) {
              const diff = Math.abs(r.time - targetTime);
              if (diff < minDiff) {
                minDiff = diff;
                closest = r;
              }
            }
            return closest;
          };

          const start = new Date(anioInicio);
          const end = new Date(fechaFinAnio);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const recordToday = getClosestEnergiaRecord(d.getFullYear(), d.getMonth() + 1, d.getDate(), 6);
            const dNext = new Date(d);
            dNext.setDate(dNext.getDate() + 1);
            const recordNext = getClosestEnergiaRecord(dNext.getFullYear(), dNext.getMonth() + 1, dNext.getDate(), 6);
            if (recordToday && recordNext) {
              let diff_cg = Math.max(0, recordNext.cg - recordToday.cg);
              const fechaStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
              if (fechaStr === '2026-01-22') diff_cg = 18874;
              else if (fechaStr === '2026-01-23') diff_cg = 19773;
              else if (fechaStr === '2026-01-24') diff_cg = 19202;
              else if (fechaStr === '2026-01-25') diff_cg = 20037;
              else if (fechaStr === '2026-01-26') diff_cg = 20038;
              totalEnergiaAnio += diff_cg;
            }
          }
        } else {
          // Lógica de Max - Min por día
          const energiaDiariaMap = new Map<string, {min: number, max: number}>();
          sensorDataAnual.forEach((row: any) => {
            const rawFecha = row.FechaRegistro || row.timestamp || row.fecharegistro;
            if (!rawFecha) return;
            const date = new Date(rawFecha);
            const fecha = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
            
            const cg = this.plcsService.parsePlcValue(row['ENERGIA'] || row['energia']) / 10;
            if (cg > 0) {
              if (!energiaDiariaMap.has(fecha)) {
                energiaDiariaMap.set(fecha, {min: Number.MAX_VALUE, max: -Number.MAX_VALUE});
              }
              const dia = energiaDiariaMap.get(fecha)!;
              if (cg < dia.min) dia.min = cg;
              if (cg > dia.max) dia.max = cg;
            }
          });

          energiaDiariaMap.forEach((dia) => {
            if (dia.max >= dia.min) {
              totalEnergiaAnio += (dia.max - dia.min);
            }
          });
        }
      }

      this.energiaKpis.totalB100Anio = totalB100Anio;
      this.energiaKpis.totalEnergiaAnio = Number(totalEnergiaAnio.toFixed(2));
      this.energiaKpis.anual = totalB100Anio > 0 ? Number((totalEnergiaAnio / totalB100Anio).toFixed(2)) : 0;
      console.log(`[Cálculo FOCO Anual Energía] Total Energía Año: ${this.energiaKpis.totalEnergiaAnio} kWh / Total B100 Año: ${totalB100Anio} Ton => FOCO Anual: ${this.energiaKpis.anual} kWh/Ton`);
    }

    this.cdr.detectChanges();
  }

  // ─── LÓGICA ASÍNCRONA DATOS ANUALES ──────────────────────────────────────────

  public procesarDatosAnuales(b100Historico: any, sensorDataAnual: any, isVapor: boolean) {
    const totalB100Anio = (b100Historico?.dailyData || [])
      .filter((d: any) => d.date.startsWith(this.selectedYear))
      .reduce((sum: number, d: any) => sum + d.produccion, 0);

    if (isVapor) {
      this.kpis.totalB100Anio = totalB100Anio;
      const totalVaporAnio = (sensorDataAnual as {totalVapor: number})?.totalVapor || 0;
      this.kpis.totalVaporAnio = totalVaporAnio;
      this.kpis.focoAnual = totalB100Anio > 0 ? Number((totalVaporAnio / totalB100Anio).toFixed(2)) : 0;
    } else {
      this.energiaKpis.totalB100Anio = totalB100Anio;
      const totalEnergiaAnio = (sensorDataAnual as {totalEnergia: number})?.totalEnergia || 0;
      this.energiaKpis.totalEnergiaAnio = totalEnergiaAnio;
      this.energiaKpis.anual = totalB100Anio > 0 ? Number((totalEnergiaAnio / totalB100Anio).toFixed(2)) : 0;
    }
    this.cdr.detectChanges();
  }
}
