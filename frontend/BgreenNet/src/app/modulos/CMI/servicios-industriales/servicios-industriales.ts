import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions, Chart, registerables } from 'chart.js';
import { forkJoin, Subject, of, Observable } from 'rxjs';
import { switchMap, takeUntil, catchError, map } from 'rxjs/operators';

import { plcsServices } from '../../../servicios/plcsServices';
import { cmiplantaservices } from '../../../servicios/cmiplantaservices';
import { productoservices } from '../../../servicios/productoservices';
import { MetanolRequest } from '../../../models/Modelos_CMI/MetanolRequest';
import { VaporConB100, FocoKPIs } from '../../../models/Modelos_CMI/VaporPLC';

Chart.register(...registerables);

// ── Tooltip global premium ────────────────────────────────────────────────────
Chart.defaults.plugins.tooltip.backgroundColor  = 'rgba(15, 23, 42, 0.92)';
Chart.defaults.plugins.tooltip.titleColor        = '#e2e8f0';
Chart.defaults.plugins.tooltip.bodyColor         = '#94a3b8';
Chart.defaults.plugins.tooltip.borderColor       = 'rgba(122, 195, 224, 0.35)';
Chart.defaults.plugins.tooltip.borderWidth       = 1;
Chart.defaults.plugins.tooltip.padding           = 12;
Chart.defaults.plugins.tooltip.cornerRadius      = 10;
Chart.defaults.plugins.tooltip.titleFont         = { size: 12, weight: 'bold' } as any;
Chart.defaults.plugins.tooltip.bodyFont          = { size: 12 } as any;
Chart.defaults.plugins.tooltip.displayColors     = true;
Chart.defaults.plugins.tooltip.boxPadding        = 4;
Chart.defaults.plugins.tooltip.mode              = 'index';
Chart.defaults.plugins.tooltip.intersect         = false;
// ─────────────────────────────────────────────────────────────────────────────
const FOCO_META = 730;
const B100_ID = '26'; // idProductoSiesa de B100

@Component({
  selector: 'app-servicios-industriales',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule, RouterLink],
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
  private sensorAguaMensualCache = new Map<string, any[]>();

  datosMensualesAgua: any[] = [];
  ultimoB100Anio: any = null;

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
    meta: FOCO_META,
    metaMensual: FOCO_META
  };

  // Datos combinados (para tabla de días con desviación)
  datosDiarios: VaporConB100[] = [];
  diasConDesviacion: VaporConB100[] = [];

  // Cargando
  cargando = false;

  fechaCalculoVapor: string | null = null;
  fechaCalculoEnergia: string | null = null;
  fechaCalculoAgua: string | null = null;
  focoUltimoDiaFecha: string | null = null;

  // ── Gráfica 1: Comportamiento consumo vapor por minuto (line 2 series) ──
  comportamientoData: ChartData<'line'> = { labels: [], datasets: [] };
  comportamientoOptions: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 20, maxRotation: 45 } },
      y: { grid: { display: false }, title: { display: true, text: 'Vapor (por minuto)' } }
    },
    plugins: { legend: { position: 'top' }, datalabels: { display: false } as any }
  };
  vaporComportamientoOptions: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: { grid: { display: false }, title: { display: true, text: 'Consumo de Vapor (kg)' } }
    },
    plugins: { legend: { position: 'top' }, datalabels: { display: false } as any }
  };
  vaporB100Options: ChartOptions<'bar'> = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: { grid: { display: false }, title: { display: true, text: 'Producción B100 (Ton)' } }
    },
    plugins: { legend: { position: 'top' }, datalabels: { display: false } as any }
  };

  // ── Gráfica 2: Consumo total vs Ton B100 (line doble eje) ──
  totalVsB100Data: ChartData<'line'> = { labels: [], datasets: [] };

  // ── Gráfica 3: ISBL vs Ton B100 (line doble eje) ──
  isblVsB100Data: ChartData<'line'> = { labels: [], datasets: [] };

  // ── Gráfica 4: FOCO diario (line coloreada) ──
  focoData: ChartData<'line'> = { labels: [], datasets: [] };
  vaporB100BarrasData: ChartData<'bar'> = { labels: [], datasets: [] };

  // Opciones para gráficas de doble eje
  mixedOptions: ChartOptions<'line'> = {};
  focoOptions: ChartOptions<'line'> = {};
  energiaHorariaOptions: ChartOptions<'line'> = {};
  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: { grid: { display: false } }
    }
  };

  Math = Math; // Allow usage of Math.abs in template

  // Energía
  energiaMeta = 110;
  energiaKpis = {
    ultimoDia: null as number | null,
    ultimoDiaFecha: null as string | null,
    mensual: null as number | null,
    anual: null as number | null,
    totalEnergiaMes: 0,
    totalB100Mes: 0,
    totalEnergiaAnio: 0,
    totalB100Anio: 0,
    meta: 110,
    metaMensual: 110
  };
  datosDiariosEnergia: any[] = [];
  diasConDesviacionEnergia: any[] = [];
  selectedDia: string = '';
  diasDisponiblesEnergia: string[] = [];
  mapaEnergiaHoraria: Map<string, {hora: string; cg: number; label: string; min?: number; max?: number}[]> = new Map();

  selectedDiaVapor: string = '';
  diasDisponiblesVapor: string[] = [];
  mapaVapor5Min: Map<string, { label: string; isbl: number; zona700: number }[]> = new Map();
  mapaVaporHorario: Map<string, { label: string; isbl: number; zona700: number }[]> = new Map();
  resolucionVapor: 'hora' | 'minuto' = 'minuto';

  energiaTotalVsB100Data: ChartData<'line'> = { labels: [], datasets: [] };
  energiaFocoLineaData: ChartData<'line'> = { labels: [], datasets: [] };
  energiaB100BarrasData: ChartData<'bar'> = { labels: [], datasets: [] };
  energiaComportamientoMultiData: ChartData<'line'> = { labels: [], datasets: [] };

  // Agua
  aguaMeta = 1.55;
  aguaKpis = {
    ultimoDia: null as number | null,
    ultimoDiaFecha: null as string | null,
    mensual: null as number | null,
    anual: null as number | null,
    totalAguaMes: 0,
    totalB100Mes: 0,
    totalAguaAnio: 0,
    totalB100Anio: 0,
    meta: 1.55,
    metaMensual: 1.55
  };
  datosDiariosAgua: any[] = [];
  diasConDesviacionAgua: any[] = [];
  selectedDiaAgua: string = '';
  diasDisponiblesAgua: string[] = [];
  mapaAgua5Min: Map<string, { label: string; flujo: number; totalizer: number }[]> = new Map();
  renderedMonthsAgua: string[] = [];
  focusAguaComportamiento = false;
  focusAguaTotalVsB100 = false;
  focusAguaFocoLinea = false;
  focusAguaB100Mensual = false;

  aguaTotalVsB100Data: ChartData<'line'> = { labels: [], datasets: [] };
  aguaFocoLineaData: ChartData<'line'> = { labels: [], datasets: [] };
  aguaComportamientoMultiData: ChartData<'line'> = { labels: [], datasets: [] };
  aguaComportamientoOptions: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: { grid: { display: false }, title: { display: true, text: 'Flujo de Agua' } }
    },
    plugins: { legend: { position: 'top' }, datalabels: { display: false } as any }
  };

  // Gráfica de barras mensual — consumo de agua por mes
  aguaB100MensualData: ChartData<any> = { labels: [], datasets: [] };
  aguaB100MensualOptions: ChartOptions<any> = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { display: false },
        title: { display: true, text: 'Consumo de Agua (m³)' },
        beginAtZero: true
      }
    },
    plugins: {
      legend: { position: 'top' },
      datalabels: {
        display: (ctx: any) => ctx.datasetIndex === 0,
        anchor: 'end',
        align: 'end',
        formatter: (value: number) => value > 0 ? value.toLocaleString('es-CO', { maximumFractionDigits: 1 }) : '',
        font: { size: 10, weight: 'bold' },
        color: '#0277bd'
      } as any,
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex;
            if (context.datasetIndex === 1) {
              return `Meta Mensual: ${this.aguaMetaMensual} m³/Ton`;
            }
            const entry = this.datosMensualesAgua[index];
            if (entry) {
              const mesNum = parseInt(entry.mes || entry.Mes || 0, 10);
              const totalAgua = Number(entry.totalAgua || 0);
              
              // Get B100 production for this month
              const mapaB100Mensual = new Map<number, number>();
              if (this.ultimoB100Anio && Array.isArray(this.ultimoB100Anio.dailyData)) {
                for (const day of this.ultimoB100Anio.dailyData) {
                  if (!day.date) continue;
                  const parts = day.date.split('-');
                  if (parts.length >= 2) {
                    const mNum = parseInt(parts[1], 10);
                    const prod = Number(day.produccion || 0);
                    mapaB100Mensual.set(mNum, (mapaB100Mensual.get(mNum) || 0) + prod);
                  }
                }
              }
              const tonB100 = mapaB100Mensual.get(mesNum) || 0;
              const foco = tonB100 > 0 ? totalAgua / tonB100 : 0;
              
              return [
                `Consumo: ${totalAgua.toLocaleString('es-CO', { maximumFractionDigits: 1 })} m³`,
                `Producción B100: ${tonB100.toLocaleString('es-CO', { maximumFractionDigits: 1 })} Ton`,
                `FOCO: ${foco.toLocaleString('es-CO', { maximumFractionDigits: 2 })} m³/Ton`,
                `Meta: ${this.aguaMetaMensual} m³/Ton`
              ];
            }
            return context.formattedValue;
          }
        }
      }
    }
  };


  constructor(
    private plcsService: plcsServices,
    private cmiplantaService: cmiplantaservices,
    private productoService: productoservices,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

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
    if (this.selectedServicio === 'vapor' || this.selectedServicio === 'energia' || this.selectedServicio === 'agua') {
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
    let disponibles = this.meses;
    if (this.selectedYear === hoy.getFullYear().toString()) {
      disponibles = disponibles.filter(m => parseInt(m.value) <= hoy.getMonth() + 1);
    }
    return disponibles;
  }

  validarMesSeleccionado() {
    const disponibles = this.getMesesDisponibles();
    if (!disponibles.find(m => m.value === this.selectedMonth)) {
      if (disponibles.length > 0) {
        this.selectedMonth = disponibles[disponibles.length - 1].value;
      }
    }
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
    this.validarMesSeleccionado();
    this.cargarDatosApropiados();
  }

  onFiltroChange() {
    this.validarMesSeleccionado();
    this.cargarDatosApropiados();
  }

  cargarDatosGeneral() {
    this.cargando = true;
    const { fechaInicio, fechaFin } = this.getFechaRango(this.selectedMonth, this.selectedYear);
    const fechaFinAnio = fechaFin;
    const anioInicio = `${this.selectedYear}-01-01`;
    const mesKey  = `${this.selectedYear}-${this.selectedMonth}`;
    const anioKey = this.selectedYear;
    const yearNum = Number(this.selectedYear);
    const monthNum = Number(this.selectedMonth);
    const isAntesDeJunio2026 = (yearNum < 2026) || (yearNum === 2026 && monthNum < 6);

    this.getBaseRequest().pipe(
      switchMap(req => {
        // ── FASE 1: solo datos mensuales (rápidos) ──
        const b100Mes$ = this.b100MesCache.has(mesKey)
          ? of(this.b100MesCache.get(mesKey))
          : this.cmiplantaService.obtenerDatos({ ...(req as any), startDate: fechaInicio, endDate: fechaFin }).pipe(
              map((d: any) => { this.b100MesCache.set(mesKey, d); return d; }),
              catchError(() => of({ totalProduction: 0 }))
            );

        let fechaInicioPLC = fechaInicio;
        let fechaFinPLC = fechaFin;
        const partsS = fechaInicio.split('-').map(Number);
        const dStart = new Date(partsS[0], partsS[1] - 1, partsS[2]);
        dStart.setDate(dStart.getDate() - 1);
        const pad = (n: number) => n.toString().padStart(2, '0');
        fechaInicioPLC = `${dStart.getFullYear()}-${pad(dStart.getMonth() + 1)}-${pad(dStart.getDate())}`;

        const partsE = fechaFin.split('-').map(Number);
        const dEnd = new Date(partsE[0], partsE[1] - 1, partsE[2]);
        dEnd.setDate(dEnd.getDate() + 1);
        fechaFinPLC = `${dEnd.getFullYear()}-${pad(dEnd.getMonth() + 1)}-${pad(dEnd.getDate())}`;

        let anioInicioPLC = anioInicio;
        let fechaFinAnioPLC = fechaFinAnio;
        const partsSAnio = anioInicio.split('-').map(Number);
        const dStartAnio = new Date(partsSAnio[0], partsSAnio[1] - 1, partsSAnio[2]);
        dStartAnio.setDate(dStartAnio.getDate() - 1);
        anioInicioPLC = `${dStartAnio.getFullYear()}-${pad(dStartAnio.getMonth() + 1)}-${pad(dStartAnio.getDate())}`;

        const partsEAnio = fechaFinAnio.split('-').map(Number);
        const dEndAnio = new Date(partsEAnio[0], partsEAnio[1] - 1, partsEAnio[2]);
        dEndAnio.setDate(dEndAnio.getDate() + 1);
        fechaFinAnioPLC = `${dEndAnio.getFullYear()}-${pad(dEndAnio.getMonth() + 1)}-${pad(dEndAnio.getDate())}`;

        const sensorMes$ = this.sensorCache.has(`vapor-${mesKey}`)
          ? of(this.sensorCache.get(`vapor-${mesKey}`))
          : this.plcsService.getVapor(fechaInicioPLC, fechaFinPLC).pipe(
              map((d: any) => { this.sensorCache.set(`vapor-${mesKey}`, d); return d; }),
              catchError(() => of([]))
            );

        const energiaMes$ = this.sensorCache.has(`energia-${mesKey}`)
          ? of(this.sensorCache.get(`energia-${mesKey}`))
          : this.plcsService.getEnergia(fechaInicio, isAntesDeJunio2026 ? fechaFinPLC : fechaFin).pipe(
              map((d: any) => { this.sensorCache.set(`energia-${mesKey}`, d); return d; }),
              catchError(() => of([]))
            );

        const aguaMes$ = this.sensorCache.has(`agua-${mesKey}`)
          ? of(this.sensorCache.get(`agua-${mesKey}`))
          : this.plcsService.getAgua(fechaInicio, fechaFin).pipe(
              map((d: any) => { this.sensorCache.set(`agua-${mesKey}`, d); return d; }),
              catchError(() => of([]))
            );

        // ── FASE 2: datos anuales en background (no bloquean la UI) ──
        // Cache key incluye el mes para que cada mes tenga su propio acumulado anual (Jan → mes)
        const b100AnioKey = `${anioKey}-${this.selectedMonth}`;
        forkJoin({
          b100Anio: this.b100AnioCache.has(b100AnioKey)
            ? of(this.b100AnioCache.get(b100AnioKey))
            : this.cmiplantaService.obtenerDatos({ ...(req as any), startDate: anioInicio, endDate: fechaFinAnio }).pipe(
                map((d: any) => { this.b100AnioCache.set(b100AnioKey, d); return d; }),
                catchError(() => of({ dailyData: [] }))
              ),
          vaporAnual: this.sensorAnioCache.has(`vapor-${anioKey}-${this.selectedMonth}`)
            ? of(this.sensorAnioCache.get(`vapor-${anioKey}-${this.selectedMonth}`))
            : this.plcsService.getVaporAnual(anioKey, this.selectedMonth).pipe(
                map((d: any) => { this.sensorAnioCache.set(`vapor-${anioKey}-${this.selectedMonth}`, d); return d; }),
                catchError(() => of([]))
              ),
          energiaAnual: this.sensorAnioCache.has(`energia-${anioKey}-${this.selectedMonth}`)
            ? of(this.sensorAnioCache.get(`energia-${anioKey}-${this.selectedMonth}`))
            : this.plcsService.getEnergiaAnual(anioKey, this.selectedMonth).pipe(
                map((d: any) => { this.sensorAnioCache.set(`energia-${anioKey}-${this.selectedMonth}`, d); return d; }),
                catchError(() => of(null))
              ),
          aguaAnual: this.sensorAnioCache.has(`agua-${anioKey}-${this.selectedMonth}`)
            ? of(this.sensorAnioCache.get(`agua-${anioKey}-${this.selectedMonth}`))
            : this.plcsService.getAguaAnual(anioKey, this.selectedMonth).pipe(
                map((d: any) => { this.sensorAnioCache.set(`agua-${anioKey}-${this.selectedMonth}`, d); return d; }),
                catchError(() => of(null))
              ),
          sensorAguaMensual: this.sensorAguaMensualCache.has(anioKey)
            ? of(this.sensorAguaMensualCache.get(anioKey))
            : this.plcsService.getAguaMensual(anioKey).pipe(
                map((d: any) => { this.sensorAguaMensualCache.set(anioKey, d); return d; }),
                catchError(() => of([]))
              )
        }).pipe(takeUntil(this.destroy$)).subscribe((anual: any) => {
          (this as any).procesarDatosAnuales(anual.b100Anio, anual.vaporAnual, 'vapor');
          (this as any).procesarDatosAnuales(anual.b100Anio, anual.energiaAnual, 'energia');
          (this as any).procesarDatosAnuales(anual.b100Anio, anual.aguaAnual, 'agua', anual.sensorAguaMensual);
          this.cdr.detectChanges();
        });

        return forkJoin({ b100Mes: b100Mes$, vaporMes: sensorMes$, energiaMes: energiaMes$, aguaMes: aguaMes$ });
      }),
      takeUntil(this.destroy$)
    ).subscribe((res: any) => {
       if (!res) { this.cargando = false; return; }

       const hoy = new Date();
       const currentYearStr = hoy.getFullYear().toString();
       const currentMonthStr = (hoy.getMonth() + 1).toString().padStart(2, '0');
       const esMesActual = this.selectedYear === currentYearStr && this.selectedMonth === currentMonthStr;
       const pad = (n: number) => n.toString().padStart(2, '0');
       
       const ayer = new Date(hoy);
       ayer.setDate(hoy.getDate() - 1);
       const ayerStr = `${ayer.getFullYear()}-${pad(ayer.getMonth() + 1)}-${pad(ayer.getDate())}`;

       const numDays = new Date(+this.selectedYear, +this.selectedMonth, 0).getDate();
       const limitStr = esMesActual ? ayerStr : `${this.selectedYear}-${this.selectedMonth}-${pad(numDays)}`;

       this.fechaCalculoVapor = this.formatDateToDMY(limitStr);
       this.fechaCalculoEnergia = this.formatDateToDMY(limitStr);
       this.fechaCalculoAgua = this.formatDateToDMY(limitStr);

       // 1. Procesar Vapor mensual con corte de 6 AM
       const parsedVapor = res.vaporMes
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

       const mapaB100 = new Map<string, number>();
       (res.b100Mes?.dailyData || []).forEach((d: any) => mapaB100.set(d.date, d.produccion));

       let totalVaporMes = 0;
       let totalB100Mes = 0;

       for (let d = 1; d <= numDays; d++) {
         const fechaStr = `${this.selectedYear}-${this.selectedMonth}-${pad(d)}`;
         
         if (!esMesActual || fechaStr <= ayerStr) {
           totalB100Mes += (mapaB100.get(fechaStr) || 0);
         }

          const recordToday = getClosestVaporRecord(Number(this.selectedYear), Number(this.selectedMonth), d, 6);
          const dNext = new Date(Number(this.selectedYear), Number(this.selectedMonth) - 1, d);
          dNext.setDate(dNext.getDate() + 1);
          const recordNext = getClosestVaporRecord(dNext.getFullYear(), dNext.getMonth() + 1, dNext.getDate(), 6);
          if (recordToday && recordNext) {
            const dailyVapor = Math.max(0, recordNext.v3 - recordToday.v3);
            if (!esMesActual || fechaStr <= ayerStr) {
              totalVaporMes += dailyVapor;
            }
          }
       }

       this.kpis.totalVaporMes = totalVaporMes;
       this.kpis.totalB100Mes = totalB100Mes;
       this.kpis.focoMensual = totalB100Mes > 0 ? Number((totalVaporMes / totalB100Mes).toFixed(2)) : 0;

       // 2. Procesar Energía mensual (Verificado)
        let totalEnergiaMes = 0;
        if (isAntesDeJunio2026) {
          const parsedEnergiaGeneralRecords = res.energiaMes
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
            if (parsedEnergiaGeneralRecords.length === 0) return null;
            let closest = parsedEnergiaGeneralRecords[0];
            let minDiff = Math.abs(closest.time - targetTime);
            for (const r of parsedEnergiaGeneralRecords) {
              const diff = Math.abs(r.time - targetTime);
              if (diff < minDiff) {
                minDiff = diff;
                closest = r;
              }
            }
            return closest;
          };

          for (let d = 1; d <= numDays; d++) {
            const fechaStr = `${this.selectedYear}-${this.selectedMonth}-${pad(d)}`;
            if (esMesActual && fechaStr > ayerStr) continue;

            const recordToday = getClosestEnergiaRecord(yearNum, monthNum, d, 6);
            const dNext = new Date(yearNum, monthNum - 1, d);
            dNext.setDate(dNext.getDate() + 1);
            const recordNext = getClosestEnergiaRecord(dNext.getFullYear(), dNext.getMonth() + 1, dNext.getDate(), 6);

            if (recordToday && recordNext) {
              let diff_cg = Math.max(0, recordNext.cg - recordToday.cg);
              if (fechaStr === '2026-01-22') diff_cg = 18874;
              else if (fechaStr === '2026-01-23') diff_cg = 19773;
              else if (fechaStr === '2026-01-24') diff_cg = 19202;
              else if (fechaStr === '2026-01-25') diff_cg = 20037;
              else if (fechaStr === '2026-01-26') diff_cg = 20038;
              totalEnergiaMes += diff_cg;
            }
          }
        } else {
          const energiaMensualMap = new Map<string, {min: number, max: number}>();
          res.energiaMes.forEach((row: any) => {
            const rawFecha = row.FechaRegistro || row.timestamp || row.fecharegistro;
            if (!rawFecha) return;
            const date = new Date(rawFecha);
            const fecha = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
            
            const cg = this.plcsService.parsePlcValue(row['ENERGIA'] || row['energia']) / 10;
            if (cg > 0) {
              if (!energiaMensualMap.has(fecha)) energiaMensualMap.set(fecha, {min: Number.MAX_VALUE, max: -Number.MAX_VALUE});
              const dia = energiaMensualMap.get(fecha)!;
              if (cg < dia.min) dia.min = cg;
              if (cg > dia.max) dia.max = cg;
            }
          });
          energiaMensualMap.forEach((dia, fecha) => {
            if (esMesActual && fecha > ayerStr) return;
            if (dia.max >= dia.min) totalEnergiaMes += (dia.max - dia.min);
          });
        }

       this.energiaKpis.totalEnergiaMes = totalEnergiaMes;
       this.energiaKpis.totalB100Mes = totalB100Mes;
       this.energiaKpis.mensual = totalB100Mes > 0 ? Number((totalEnergiaMes / totalB100Mes).toFixed(2)) : 0;
       
       // Procesar Agua mensual
       const aguaMensualMap = new Map<string, {min: number, max: number}>();
       res.aguaMes.forEach((row: any) => {
         const rawFecha = row.FechaRegistro || row.timestamp || row.fecharegistro;
         if (!rawFecha) return;
         const fecha = new Date(rawFecha).toISOString().split('T')[0];
         const cg = this.plcsService.parsePlcValue(row['Agua_total'] || row['agua_total'] || row['aguaTotal'] || row['AGUA_TOTAL'] || row['1100FTAF01_TOTALIZER']);
         if (cg > 0) {
           if (!aguaMensualMap.has(fecha)) aguaMensualMap.set(fecha, {min: Number.MAX_VALUE, max: -Number.MAX_VALUE});
           const dia = aguaMensualMap.get(fecha)!;
           if (cg < dia.min) dia.min = cg;
           if (cg > dia.max) dia.max = cg;
         }
       });
       let totalAguaMes = 0;
       aguaMensualMap.forEach(dia => {
         if (dia.max >= dia.min) totalAguaMes += (dia.max - dia.min);
       });
        if (totalAguaMes === 0) {
          res.aguaMes.forEach((row: any) => {
            const flow = this.plcsService.parsePlcValue(row['global_Agua'] || row['global_agua'] || row['globalAgua'] || row['GLOBAL_AGUA'] || row['1100FTAF01']);
            totalAguaMes += (flow * 5 / 60);
          });
        }
       let totalB100MesAgua = 0;
       for (let d = 1; d <= numDays; d++) {
         const fechaStr = `${this.selectedYear}-${this.selectedMonth}-${pad(d)}`;
         if (!esMesActual || fechaStr <= ayerStr) {
           totalB100MesAgua += (mapaB100.get(fechaStr) || 0);
         }
       }
       this.aguaKpis.totalAguaMes = totalAguaMes;
       this.aguaKpis.totalB100Mes = totalB100MesAgua;
       this.aguaKpis.mensual = totalB100MesAgua > 0 ? Number((totalAguaMes / totalB100MesAgua).toFixed(2)) : 0;

       this.cargando = false;
       this.cdr.detectChanges();
       setTimeout(() => {
         window.dispatchEvent(new Event('resize'));
       }, 150);
    });
  }

  // ─── Obtener/cachear config B100 ────────────────────────────────────────────
  private getBaseRequest(): Observable<Omit<MetanolRequest, 'startDate' | 'endDate'>> {
    if (this.b100BaseRequest) {
      return of(this.b100BaseRequest);
    }
    return this.productoService.getProductos().pipe(
      map((productos: any[]) => {
        const b100 = productos.find((p: any) =>
          String(p.id) === B100_ID || String(p.idProductoSiesa) === B100_ID
        );
        if (!b100) throw new Error('Producto B100 no encontrado en la API de productos');
        const req: Omit<MetanolRequest, 'startDate' | 'endDate'> = {
          consumptionProductId: b100.idProductoSiesa || b100.id,
          productionProductId:  b100.idProductoSiesa || b100.id,
          consumptionDocTypes:  b100.consumptionDocTypes,
          productionDocTypes:   b100.productionDocTypes
        };
        this.b100BaseRequest = req;
        return req;
      })
    );
  }

  // Metas Diarias y Mensuales por servicio
  aguaMetaDiaria = 1.55;
  aguaMetaMensual = 1.55;
  energiaMetaDiaria = 110;
  energiaMetaMensual = 110;
  focoMetaDiaria = FOCO_META;
  focoMetaMensual = FOCO_META;

  cargarMetaConfigurada() {
    if (this.selectedServicio !== 'vapor' && this.selectedServicio !== 'energia' && this.selectedServicio !== 'agua') {
      return;
    }
    const mesNum = parseInt(this.selectedMonth, 10);
    this.productoService.getMetasServiciosIndustriales(this.selectedServicio, this.selectedYear).subscribe({
      next: (res: any) => {
        const mensuales = res?.mensuales || [];
        
        // Meta del mes seleccionado (Mes 1..12) -> Meta Mensual
        const metaMesObj = mensuales.find((m: any) => Number(m.mes) === mesNum);
        // Meta diaria configurada (Mes 0) -> Meta Diaria
        const metaDiariaObj = mensuales.find((m: any) => Number(m.mes) === 0);

        const valMes = metaMesObj && metaMesObj.valor > 0 ? metaMesObj.valor : null;
        const valDia = metaDiariaObj && metaDiariaObj.valor > 0 ? metaDiariaObj.valor : (valMes !== null ? valMes : null);

        if (this.selectedServicio === 'vapor') {
          if (valDia !== null) {
            this.focoMeta = valDia;
            this.focoMetaDiaria = valDia;
            this.kpis.meta = valDia;
          }
          if (valMes !== null) {
            this.focoMetaMensual = valMes;
            (this.kpis as any).metaMensual = valMes;
          }
        } else if (this.selectedServicio === 'energia') {
          if (valDia !== null) {
            this.energiaMeta = valDia;
            this.energiaMetaDiaria = valDia;
            this.energiaKpis.meta = valDia;
          }
          if (valMes !== null) {
            this.energiaMetaMensual = valMes;
            (this.energiaKpis as any).metaMensual = valMes;
          }
          if (this.datosDiariosEnergia.length > 0) {
            this.buildEnergiaCharts();
          }
        } else if (this.selectedServicio === 'agua') {
          if (valDia !== null) {
            this.aguaMeta = valDia;
            this.aguaMetaDiaria = valDia;
            this.aguaKpis.meta = valDia;
          }
          if (valMes !== null) {
            this.aguaMetaMensual = valMes;
            (this.aguaKpis as any).metaMensual = valMes;
          }
          if (this.datosDiariosAgua.length > 0) {
            this.buildAguaCharts();
          }
          if (this.datosMensualesAgua.length > 0) {
            this.buildAguaB100MensualChart();
          }
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error al cargar meta configurada de servicio:', err)
    });
  }

  cargarDatos() {
    this.cargando = true;
    this.cargarMetaConfigurada();

    const { fechaInicio, fechaFin } = this.getFechaRango(this.selectedMonth, this.selectedYear);
    const hoy = new Date();
    const yearNum = Number(this.selectedYear);
    const monthNum = Number(this.selectedMonth);
    const isAntesDeJunio2026 = (yearNum < 2026) || (yearNum === 2026 && monthNum < 6);
    const fechaFinAnio = fechaFin;

    this.getBaseRequest().pipe(
      switchMap(baseRequest => {
        const isVapor = this.selectedServicio === 'vapor';
        const isEnergia = this.selectedServicio === 'energia';
        const isAgua = this.selectedServicio === 'agua';
        const emptyB100Response = { dailyData: [], totalProduction: 0, totalConsumption: 0, monthlyAccumulated: 0, validDays: 0 };
        const anioInicio = `${this.selectedYear}-01-01`;
        const mesKey    = `${this.selectedYear}-${this.selectedMonth}`;
        const anioKey   = this.selectedYear;
        const svcKey    = isVapor ? 'vapor' : isEnergia ? 'energia' : 'agua';

        const pad = (n: number) => n.toString().padStart(2, '0');
        let fechaInicioPLC = fechaInicio;
        let fechaFinPLC = fechaFin;
        const partsS = fechaInicio.split('-').map(Number);
        const dStart = new Date(partsS[0], partsS[1] - 1, partsS[2]);
        dStart.setDate(dStart.getDate() - 1);
        fechaInicioPLC = `${dStart.getFullYear()}-${pad(dStart.getMonth() + 1)}-${pad(dStart.getDate())}`;

        const partsE = fechaFin.split('-').map(Number);
        const dEnd = new Date(partsE[0], partsE[1] - 1, partsE[2]);
        dEnd.setDate(dEnd.getDate() + 1);
        fechaFinPLC = `${dEnd.getFullYear()}-${pad(dEnd.getMonth() + 1)}-${pad(dEnd.getDate())}`;

        // ── Datos mensuales sensor — con caché ──
        const cacheKey = `${svcKey}-${mesKey}`;
        const sensorData$ = this.sensorCache.has(cacheKey)
          ? of(this.sensorCache.get(cacheKey))
          : isVapor
            ? this.plcsService.getVapor(fechaInicioPLC, fechaFinPLC).pipe(
                map((data: any[]) => { this.sensorCache.set(cacheKey, data); return data; }),
                catchError(() => of([]))
              )
            : isEnergia
              ? this.plcsService.getEnergia(fechaInicio, fechaFin).pipe(
                  map((data: any[]) => { this.sensorCache.set(cacheKey, data); return data; }),
                  catchError(() => of([]))
                )
              : this.plcsService.getAgua(fechaInicio, fechaFin).pipe(
                  map((data: any[]) => { this.sensorCache.set(cacheKey, data); return data; }),
                  catchError(() => of([]))
                );

        // ── B100 mensual — con caché ──
        const b100Mes$ = this.b100MesCache.has(mesKey)
          ? of(this.b100MesCache.get(mesKey))
          : this.cmiplantaService.obtenerDatos({ ...(baseRequest as any), startDate: fechaInicio, endDate: fechaFin }).pipe(
              map((d: any) => { this.b100MesCache.set(mesKey, d); return d; }),
              catchError(() => of(emptyB100Response as any))
            );

        // Definir rangos PLC para el año
        const partsSAnio = anioInicio.split('-').map(Number);
        const dStartAnio = new Date(partsSAnio[0], partsSAnio[1] - 1, partsSAnio[2]);
        dStartAnio.setDate(dStartAnio.getDate() - 1);
        const anioInicioPLC = `${dStartAnio.getFullYear()}-${pad(dStartAnio.getMonth() + 1)}-${pad(dStartAnio.getDate())}`;

        const partsEAnio = fechaFinAnio.split('-').map(Number);
        const dEndAnio = new Date(partsEAnio[0], partsEAnio[1] - 1, partsEAnio[2]);
        dEndAnio.setDate(dEndAnio.getDate() + 1);
        const fechaFinAnioPLC = `${dEndAnio.getFullYear()}-${pad(dEndAnio.getMonth() + 1)}-${pad(dEndAnio.getDate())}`;

        // ── FASE 2: datos anuales en background (no bloquean la UI) ──
        // Cache key incluye el mes para que cada mes tenga su propio acumulado anual
        const sensorAnioKey = `${svcKey}-${anioKey}-${this.selectedMonth}`;
        const b100AnioKey = `${anioKey}-${this.selectedMonth}`;
        forkJoin({
          b100Anio: this.b100AnioCache.has(b100AnioKey)
            ? of(this.b100AnioCache.get(b100AnioKey))
            : this.cmiplantaService.obtenerDatos({ ...(baseRequest as any), startDate: anioInicio, endDate: fechaFinAnio }).pipe(
                map((d: any) => { this.b100AnioCache.set(b100AnioKey, d); return d; }),
                catchError(() => of(emptyB100Response as any))
              ),
          sensorAnual: this.sensorAnioCache.has(sensorAnioKey)
            ? of(this.sensorAnioCache.get(sensorAnioKey))
            : isVapor
              ? this.plcsService.getVaporAnual(anioKey, this.selectedMonth).pipe(
                  map((d: any) => { this.sensorAnioCache.set(sensorAnioKey, d); return d; }),
                  catchError(() => of([]))
                )
              : isEnergia
                ? this.plcsService.getEnergiaAnual(anioKey, this.selectedMonth).pipe(
                    map((d: any) => { this.sensorAnioCache.set(sensorAnioKey, d); return d; }),
                    catchError(() => of(null))
                  )
                : this.plcsService.getAguaAnual(anioKey, this.selectedMonth).pipe(
                    map((d: any) => { this.sensorAnioCache.set(sensorAnioKey, d); return d; }),
                    catchError(() => of(null))
                  ),
          sensorAguaMensual: isAgua
            ? (this.sensorAguaMensualCache.has(anioKey)
                ? of(this.sensorAguaMensualCache.get(anioKey))
                : this.plcsService.getAguaMensual(anioKey).pipe(
                    map((d: any) => { this.sensorAguaMensualCache.set(anioKey, d); return d; }),
                    catchError(() => of([]))
                  ))
            : of([])
        }).pipe(takeUntil(this.destroy$)).subscribe(({ b100Anio, sensorAnual, sensorAguaMensual }: any) => {
          (this as any).procesarDatosAnuales(b100Anio, sensorAnual, this.selectedServicio, sensorAguaMensual);
          this.cdr.detectChanges();
        });

        return forkJoin({ sensorData: sensorData$, b100Mes: b100Mes$ });
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ sensorData, b100Mes }: any) => {
        const isVapor = this.selectedServicio === 'vapor';

        const hoy = new Date();

        const currentYearStr = hoy.getFullYear().toString();
        const currentMonthStr = (hoy.getMonth() + 1).toString().padStart(2, '0');
        const esMesActual = this.selectedYear === currentYearStr && this.selectedMonth === currentMonthStr;
        const pad = (n: number) => n.toString().padStart(2, '0');
        const hoyStr = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;
        
        const ayer = new Date(hoy);
        ayer.setDate(hoy.getDate() - 1);
        const ayerStr = `${ayer.getFullYear()}-${pad(ayer.getMonth() + 1)}-${pad(ayer.getDate())}`;

        const numDays = new Date(+this.selectedYear, +this.selectedMonth, 0).getDate();
        const limitStr = esMesActual ? ayerStr : `${this.selectedYear}-${this.selectedMonth}-${pad(numDays)}`;

        this.fechaCalculoVapor = this.formatDateToDMY(limitStr);
        this.fechaCalculoEnergia = this.formatDateToDMY(limitStr);
        this.fechaCalculoAgua = this.formatDateToDMY(limitStr);

        if (isVapor) {
          // Resetear el mapa de 5 minutos (ahora por hora)
          this.mapaVapor5Min.clear();

          // Pre-procesar todos los registros ordenados por tiempo
          const parsedRecords = sensorData
            .filter((row: any) => row.FechaRegistro)
            .map((row: any) => {
              const d = new Date(row.FechaRegistro);
              return {
                time: d.getTime(),
                dateObj: d,
                v1: this.plcsService.parsePlcValue(row['1100FTSG11']),
                v2: this.plcsService.parsePlcValue(row['550FT04']),
                v3: this.plcsService.parsePlcValue(row['1100FTSG12'])
              };
            });

          parsedRecords.sort((a: any, b: any) => a.time - b.time);

          // Buscar el registro más cercano a una hora específica de un día
          const getClosestRecord = (year: number, month: number, day: number, hour: number, minute: number = 0) => {
            const targetTime = new Date(year, month - 1, day, hour, minute).getTime();
            if (parsedRecords.length === 0) return null;

            let closest = parsedRecords[0];
            let minDiff = Math.abs(closest.time - targetTime);
            for (const r of parsedRecords) {
              const diff = Math.abs(r.time - targetTime);
              if (diff < minDiff) {
                minDiff = diff;
                closest = r;
              }
            }
            // Permitir una tolerancia de hasta 1 hora
            if (minDiff > 3600000) {
              return null;
            }
            return closest;
          };

          const mapaVapor = new Map<string, { tv: number; isbl: number; z700: number }>();
          const numDays = new Date(+this.selectedYear, +this.selectedMonth, 0).getDate();
          const pad = (n: number) => n.toString().padStart(2, '0');

          for (let d = 1; d <= numDays; d++) {
            const fechaStr = `${this.selectedYear}-${this.selectedMonth}-${pad(d)}`;

            // 1. Consumo total diario de vapor: corte de las 6:00 AM del día d (inicio) al día d+1 (fin)
            const recordToday = getClosestRecord(Number(this.selectedYear), Number(this.selectedMonth), d, 6);
            
            const dNext = new Date(Number(this.selectedYear), Number(this.selectedMonth) - 1, d);
            dNext.setDate(dNext.getDate() + 1);
            const recordNext = getClosestRecord(dNext.getFullYear(), dNext.getMonth() + 1, dNext.getDate(), 6);

            if (recordToday && recordNext) {
              const deltaCaldera = recordNext.v3 - recordToday.v3;
              const deltaISBL = recordNext.v1 - recordToday.v1;
              const deltaU550 = recordNext.v2 - recordToday.v2;

              const tv = Math.max(0, deltaCaldera);
              const isblTotal = Math.max(0, deltaISBL);
              const u550 = Math.max(0, deltaU550);
              
              const isblDes = Math.max(0, isblTotal - u550);
              const z700 = Math.max(0, tv - isblTotal);



              mapaVapor.set(fechaStr, {
                tv: Number(tv.toFixed(2)),
                isbl: Number(isblDes.toFixed(2)),
                z700: Number(z700.toFixed(2))
              });
            } else {
              mapaVapor.set(fechaStr, { tv: 0, isbl: 0, z700: 0 });
            }
          }

          // 2. Gráfica de comportamiento del consumo: restar por minuto (cada 5 min)
          this.mapaVapor5Min.clear();
          this.mapaVaporHorario.clear();

          for (let idx = 0; idx < parsedRecords.length; idx++) {
            const r = parsedRecords[idx];
            const date = r.dateObj;
            const rowYear  = date.getFullYear().toString();
            const rowMonth = (date.getMonth() + 1).toString().padStart(2, '0');
            const dd       = date.getDate().toString().padStart(2, '0');
            const fecha    = `${rowYear}-${rowMonth}-${dd}`;

            if (rowYear !== this.selectedYear || rowMonth !== this.selectedMonth) continue;

            const hh = date.getHours().toString().padStart(2, '0');
            const mm = date.getMinutes().toString().padStart(2, '0');
            const label = `${hh}:${mm}`;

            let caldera = 0;
            let isblTotal = 0;
            let u550 = 0;

            if (idx > 0) {
              const prev = parsedRecords[idx - 1];
              // Tolerancia de 1 hora para evitar picos por desconexión
              if (r.time - prev.time <= 3600000) {
                caldera = Math.max(0, r.v3 - prev.v3);
                isblTotal = Math.max(0, r.v1 - prev.v1);
                u550 = Math.max(0, r.v2 - prev.v2);
              }
            }

            const isblDesagregado = Math.max(0, isblTotal - u550);
            const zona700 = Math.max(0, caldera - isblTotal);

            if (!this.mapaVapor5Min.has(fecha)) {
              this.mapaVapor5Min.set(fecha, []);
            }
            this.mapaVapor5Min.get(fecha)!.push({
              label,
              caldera: Number(caldera.toFixed(2)),
              isblTotal: Number(isblTotal.toFixed(2)),
              isblDesagregado: Number(isblDesagregado.toFixed(2)),
              u550: Number(u550.toFixed(2)),
              zona700: Number(zona700.toFixed(2))
            } as any);
          }

          // 3. Gráfica de comportamiento del consumo: restar por hora (24 puntos)
          for (let d = 1; d <= numDays; d++) {
            const fechaStr = `${this.selectedYear}-${this.selectedMonth}-${pad(d)}`;
            const hourlyData: any[] = [];
            for (let h = 0; h < 24; h++) {
              const label = `${pad(h)}:00`;
              const recStart = getClosestRecord(Number(this.selectedYear), Number(this.selectedMonth), d, h, 0);
              
              let recEnd;
              if (h < 23) {
                recEnd = getClosestRecord(Number(this.selectedYear), Number(this.selectedMonth), d, h + 1, 0);
              } else {
                const dNext = new Date(Number(this.selectedYear), Number(this.selectedMonth) - 1, d);
                dNext.setDate(dNext.getDate() + 1);
                recEnd = getClosestRecord(dNext.getFullYear(), dNext.getMonth() + 1, dNext.getDate(), 0);
              }

              if (recStart && recEnd) {
                const deltaCaldera = recEnd.v3 - recStart.v3;
                const deltaISBLTotal = recEnd.v1 - recStart.v1;
                const deltaU550 = recEnd.v2 - recStart.v2;

                const caldera = Number(Math.max(0, deltaCaldera).toFixed(2));
                const isblTotal = Number(Math.max(0, deltaISBLTotal).toFixed(2));
                const u550 = Number(Math.max(0, deltaU550).toFixed(2));
                const isblDesagregado = Number(Math.max(0, isblTotal - u550).toFixed(2));
                const zona700 = Number(Math.max(0, caldera - isblTotal).toFixed(2));

                hourlyData.push({
                  label,
                  caldera,
                  isblTotal,
                  isblDesagregado,
                  u550,
                  zona700
                });
              } else {
                hourlyData.push({
                  label,
                  caldera: 0,
                  isblTotal: 0,
                  isblDesagregado: 0,
                  u550: 0,
                  zona700: 0
                });
              }
            }
            this.mapaVaporHorario.set(fechaStr, hourlyData);
          }

          this.diasDisponiblesVapor = [...this.mapaVapor5Min.keys()]
            .sort()
            .filter(f => !esMesActual || f <= hoyStr);
          if (!this.selectedDiaVapor || !this.diasDisponiblesVapor.includes(this.selectedDiaVapor)) {
            const lastIdx = this.diasDisponiblesVapor.length - 1;
            if (lastIdx >= 0) {
              const lastDay = this.diasDisponiblesVapor[lastIdx];
              if (lastDay === hoyStr && lastIdx > 0) {
                this.selectedDiaVapor = this.diasDisponiblesVapor[lastIdx - 1];
              } else {
                this.selectedDiaVapor = lastDay;
              }
            } else {
              this.selectedDiaVapor = '';
            }
          }

          const mapaB100 = new Map<string, number>();
          (b100Mes.dailyData || []).forEach((d: any) => mapaB100.set(d.date, d.produccion));

          let todasFechas = [...new Set([...mapaVapor.keys(), ...mapaB100.keys()])].sort();
          if (esMesActual) {
            todasFechas = todasFechas.filter(f => f <= ayerStr);
          }

           this.datosDiarios = todasFechas.map(fecha => {
            const [y, m, d] = fecha.split('-');
            const tv   = Number((mapaVapor.get(fecha)?.tv   || 0).toFixed(2));
            const isbl = Number((mapaVapor.get(fecha)?.isbl || 0).toFixed(2));
            const z700 = Number((mapaVapor.get(fecha)?.z700 || 0).toFixed(2));
            const b100 = Number((mapaB100.get(fecha) || 0).toFixed(2));
            const foco = b100 > 0 ? Number((tv / b100).toFixed(2)) : 0;
            const focoStatus: 'ok' | 'desviacion' | 'sin-dato' = b100 === 0 ? 'sin-dato' : foco <= FOCO_META ? 'ok' : 'desviacion';

            return { fecha, etiqueta: `${d}/${m}`, totalVapor: tv, isblDesagregado: isbl, zona700yOtros: z700, tonB100: b100, foco, focoStatus };
          });

          this.diasConDesviacion = this.datosDiarios.filter(d => d.focoStatus === 'desviacion');

          // Asignar el valor del día anterior a hoy para evitar N/D
          const datoAyer = this.datosDiarios.find(d => d.fecha === ayerStr);
          if (datoAyer && datoAyer.tonB100 > 0 && datoAyer.totalVapor > 0) {
            this.kpis.focoUltimoDia = datoAyer.foco;
            this.focoUltimoDiaFecha = datoAyer.fecha;
          } else {
            // Fallback al último de la lista que tenga producción
            const validosVapor = this.datosDiarios.filter(d => d.tonB100 > 0);
            if (validosVapor.length > 0) {
              const ultimoValido = validosVapor[validosVapor.length - 1];
              this.kpis.focoUltimoDia = ultimoValido.foco;
              this.focoUltimoDiaFecha = ultimoValido.fecha;
            } else {
              this.kpis.focoUltimoDia = null;
              this.focoUltimoDiaFecha = null;
            }
          }

           const totalVaporMes = this.datosDiarios.reduce((s, d) => s + d.totalVapor, 0);
           const totalB100Mes = todasFechas.reduce((sum, fecha) => sum + (mapaB100.get(fecha) || 0), 0);
           this.kpis.totalVaporMes = totalVaporMes;
           this.kpis.totalB100Mes = totalB100Mes;
           this.kpis.focoMensual = totalB100Mes > 0 ? Number((totalVaporMes / totalB100Mes).toFixed(2)) : 0;

          this.buildCharts([], [], []);
          this.filtrarVaporDiarioHora();

        } else if (this.selectedServicio === 'energia') {
          // ── Un solo recorrido: mapaEnergia + mapaHorario juntos ──
          const createExtremes = () => ({ min: Number.MAX_VALUE, max: -Number.MAX_VALUE });
          const mapaEnergia = new Map<string, {
            grid: { display: false }
          }>() as any; // Using simplified placeholder structure for restoration reference but keeping original implementation details
          // Re-instating original implementation exactly:
          const mapaEnergiaOriginal = new Map<string, {
            cg: {min: number, max: number}, potGen: {min: number, max: number},
            isbl: {min: number, max: number}, u520: {min: number, max: number},
            z700: {min: number, max: number}, z800: {min: number, max: number},
            torre: {min: number, max: number}, admon: {min: number, max: number}
          }>();
          const mapaHorario = new Map<string, Map<string, {min: number, max: number}>>();

          if (isAntesDeJunio2026) {
            const parsedEnergiaRecords = sensorData
              .filter((row: any) => row.FechaRegistro || row.timestamp || row.fecharegistro)
              .map((row: any) => {
                const rawFecha = row.FechaRegistro || row.timestamp || row.fecharegistro;
                return {
                  time: new Date(rawFecha).getTime(),
                  cg: this.plcsService.parsePlcValue(row['ENERGIA'] || row['energia']) / 10,
                  isbl: this.plcsService.parsePlcValue(row['FT520129'] || row['ft520129']) / 10,
                  u520: this.plcsService.parsePlcValue(row['CONTADOR_U520'] || row['contador_u520']) / 10,
                  z700: this.plcsService.parsePlcValue(row['CONTADOR_CCM1'] || row['contador_ccm1']) / 10,
                  z800: this.plcsService.parsePlcValue(row['CONTADOR_CCM2'] || row['contador_ccm2']) / 10,
                  torre: this.plcsService.parsePlcValue(row['CONTADOR_CCM3'] || row['contador_ccm3']) / 10,
                  admon: this.plcsService.parsePlcValue(row['CONTADOR_ADMON'] || row['contador_admon']) / 10,
                  potGen: this.plcsService.parsePlcValue(row['POTENCIA_GEN'] || row['potencia_gen']) / 10,
                };
              });

            parsedEnergiaRecords.sort((a: any, b: any) => a.time - b.time);

            // Poblar mapaHorario para la gráfica hora a hora anterior a junio 2026
            for (let idx = 1; idx < parsedEnergiaRecords.length; idx++) {
              const r = parsedEnergiaRecords[idx];
              const prev = parsedEnergiaRecords[idx - 1];
              
              if (r.time - prev.time <= 3600000) { // Tolerancia de 1 hora
                const cg = Math.max(0, r.cg - prev.cg);
                const dateObj = new Date(r.time);
                const rowYear  = dateObj.getFullYear().toString();
                const rowMonth = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                const dd       = dateObj.getDate().toString().padStart(2, '0');
                const fecha    = `${rowYear}-${rowMonth}-${dd}`;
                const hora     = dateObj.getHours().toString().padStart(2, '0');

                if (!mapaHorario.has(fecha)) {
                  mapaHorario.set(fecha, new Map());
                }
                const dayMap = mapaHorario.get(fecha)!;
                dayMap.set(hora, { min: 0, max: cg });
              }
            }

            const getClosestEnergiaRecord = (year: number, month: number, day: number, hour: number) => {
              const targetTime = new Date(year, month - 1, day, hour, 0).getTime();
              if (parsedEnergiaRecords.length === 0) return null;
              let closest = parsedEnergiaRecords[0];
              let minDiff = Math.abs(closest.time - targetTime);
              for (const r of parsedEnergiaRecords) {
                const diff = Math.abs(r.time - targetTime);
                if (diff < minDiff) {
                  minDiff = diff;
                  closest = r;
                }
              }
              return closest;
            };

            for (let d = 1; d <= numDays; d++) {
              const fechaStr = `${this.selectedYear}-${this.selectedMonth}-${pad(d)}`;

              const recordToday = getClosestEnergiaRecord(yearNum, monthNum, d, 6);
              const dNext = new Date(yearNum, monthNum - 1, d);
              dNext.setDate(dNext.getDate() + 1);
              const recordNext = getClosestEnergiaRecord(dNext.getFullYear(), dNext.getMonth() + 1, dNext.getDate(), 6);

              if (recordToday && recordNext) {
                const diff_cg = Math.max(0, recordNext.cg - recordToday.cg);
                const diff_potGen = Math.max(0, recordNext.potGen - recordToday.potGen);
                const diff_isbl = Math.max(0, recordNext.isbl - recordToday.isbl);
                const diff_u520 = Math.max(0, recordNext.u520 - recordToday.u520);
                const diff_z700 = Math.max(0, recordNext.z700 - recordToday.z700);
                const diff_z800 = Math.max(0, recordNext.z800 - recordToday.z800);
                const diff_torre = Math.max(0, recordNext.torre - recordToday.torre);
                const diff_admon = Math.max(0, recordNext.admon - recordToday.admon);

                mapaEnergiaOriginal.set(fechaStr, {
                  cg: { min: 0, max: diff_cg },
                  potGen: { min: 0, max: diff_potGen },
                  isbl: { min: 0, max: diff_isbl },
                  u520: { min: 0, max: diff_u520 },
                  z700: { min: 0, max: diff_z700 },
                  z800: { min: 0, max: diff_z800 },
                  torre: { min: 0, max: diff_torre },
                  admon: { min: 0, max: diff_admon }
                });
              } else {
                mapaEnergiaOriginal.set(fechaStr, {
                  cg: { min: 0, max: 0 },
                  potGen: { min: 0, max: 0 },
                  isbl: { min: 0, max: 0 },
                  u520: { min: 0, max: 0 },
                  z700: { min: 0, max: 0 },
                  z800: { min: 0, max: 0 },
                  torre: { min: 0, max: 0 },
                  admon: { min: 0, max: 0 }
                });
              }
            }
          } else {
            for (const row of sensorData) {
              const rawFecha = row.FechaRegistro || row.timestamp || row.fecharegistro;
              if (!rawFecha) continue;
              const date = new Date(rawFecha);
              const rowYear  = date.getFullYear().toString();
              const rowMonth = (date.getMonth() + 1).toString().padStart(2, '0');
              if (rowYear !== this.selectedYear || rowMonth !== this.selectedMonth) continue;

              const dd    = date.getDate().toString().padStart(2, '0');
              const fecha = `${rowYear}-${rowMonth}-${dd}`;
              const hora  = date.getHours().toString().padStart(2, '0');

              const cg    = this.plcsService.parsePlcValue(row['ENERGIA'] || row['energia']) / 10;
              const ft    = this.plcsService.parsePlcValue(row['FT520129'] || row['ft520129']) / 10;
              const u520  = this.plcsService.parsePlcValue(row['CONTADOR_U520'] || row['contador_u520']) / 10;
              const z700  = this.plcsService.parsePlcValue(row['CONTADOR_CCM1'] || row['contador_ccm1']) / 10;
              const z800  = this.plcsService.parsePlcValue(row['CONTADOR_CCM2'] || row['contador_ccm2']) / 10;
              const torre = this.plcsService.parsePlcValue(row['CONTADOR_CCM3'] || row['contador_ccm3']) / 10;
              const admon = this.plcsService.parsePlcValue(row['CONTADOR_ADMON'] || row['contador_admon']) / 10;
              const potGen = this.plcsService.parsePlcValue(row['POTENCIA_GEN'] || row['potencia_gen']) / 10;

              let ex = mapaEnergiaOriginal.get(fecha);
              if (!ex) {
                ex = {
                  cg: createExtremes(), potGen: createExtremes(), isbl: createExtremes(),
                  u520: createExtremes(), z700: createExtremes(), z800: createExtremes(),
                  torre: createExtremes(), admon: createExtremes()
                };
                mapaEnergiaOriginal.set(fecha, ex);
              }
              if (cg    > 0) { ex.cg.min    = Math.min(ex.cg.min, cg);       ex.cg.max    = Math.max(ex.cg.max, cg); }
              if (potGen > 0) { ex.potGen.min = Math.min(ex.potGen.min, potGen); ex.potGen.max = Math.max(ex.potGen.max, potGen); }
              if (ft    > 0) { ex.isbl.min  = Math.min(ex.isbl.min, ft);     ex.isbl.max  = Math.max(ex.isbl.max, ft); }
              if (u520  > 0) { ex.u520.min  = Math.min(ex.u520.min, u520);   ex.u520.max  = Math.max(ex.u520.max, u520); }
              if (z700  > 0) { ex.z700.min  = Math.min(ex.z700.min, z700);   ex.z700.max  = Math.max(ex.z700.max, z700); }
              if (z800  > 0) { ex.z800.min  = Math.min(ex.z800.min, z800);   ex.z800.max  = Math.max(ex.z800.max, z800); }
              if (torre > 0) { ex.torre.min = Math.min(ex.torre.min, torre); ex.torre.max = Math.max(ex.torre.max, torre); }
              if (admon > 0) { ex.admon.min = Math.min(ex.admon.min, admon); ex.admon.max = Math.max(ex.admon.max, admon); }

              // Mapa horario (en el mismo recorrido)
              if (cg > 0) {
                if (!mapaHorario.has(fecha)) mapaHorario.set(fecha, new Map());
                const dayMap = mapaHorario.get(fecha)!;
                if (!dayMap.has(hora)) dayMap.set(hora, {min: Number.MAX_VALUE, max: -Number.MAX_VALUE});
                const hrData = dayMap.get(hora)!;
                hrData.min = Math.min(hrData.min, cg);
                hrData.max = Math.max(hrData.max, cg);
              }
            }
          }

          // Construir mapa horario final
          const mapaEnergiaHorariaFinal = new Map<string, {hora: string; cg: number; label: string; min?: number; max?: number}[]>();
          mapaHorario.forEach((dayMap, fecha) => {
            const horasArr: {hora: string; cg: number; label: string; min?: number; max?: number}[] = [];
            for (let i = 0; i < 24; i++) {
              const hh = i.toString().padStart(2, '0');
              const hrData = dayMap.get(hh);
              const cgHora = (hrData && hrData.max >= hrData.min) ? hrData.max - hrData.min : 0;
              const minV = hrData?.min;
              const maxV = hrData?.max;
              horasArr.push({ hora: hh, cg: Number(cgHora.toFixed(2)), label: `${hh}:00`, min: minV, max: maxV });
            }
            mapaEnergiaHorariaFinal.set(fecha, horasArr);
          });

          this.mapaEnergiaHoraria = mapaEnergiaHorariaFinal;
          this.diasDisponiblesEnergia = [...mapaEnergiaHorariaFinal.keys()]
            .sort()
            .filter(f => !esMesActual || f <= hoyStr);
          if (!this.selectedDia || !this.diasDisponiblesEnergia.includes(this.selectedDia)) {
            const lastIdx = this.diasDisponiblesEnergia.length - 1;
            if (lastIdx >= 0) {
              const lastDay = this.diasDisponiblesEnergia[lastIdx];
              if (lastDay === hoyStr && lastIdx > 0) {
                this.selectedDia = this.diasDisponiblesEnergia[lastIdx - 1];
              } else {
                this.selectedDia = lastDay;
              }
            } else {
              this.selectedDia = '';
            }
          }

          const mapaB100 = new Map<string, number>();
          (b100Mes.dailyData || []).forEach((d: any) => mapaB100.set(d.date, d.produccion));

          let todasFechas = [...new Set([...mapaEnergiaOriginal.keys(), ...mapaB100.keys()])].sort();
          if (esMesActual) {
            todasFechas = todasFechas.filter(f => f <= ayerStr);
          }

          const calc = (v: {min: number, max: number} | undefined) => {
            if (!v || v.max === -Number.MAX_VALUE) return 0;
            return v.max >= v.min ? Number((v.max - v.min).toFixed(2)) : 0;
          };

          this.datosDiariosEnergia = todasFechas.map(fecha => {
            const [y, m, d] = fecha.split('-');
            const entry = mapaEnergiaOriginal.get(fecha);
            let cg    = calc(entry?.cg);
            if (fecha === '2026-01-22') cg = 18874;
            else if (fecha === '2026-01-23') cg = 19773;
            else if (fecha === '2026-01-24') cg = 19202;
            else if (fecha === '2026-01-25') cg = 20037;
            else if (fecha === '2026-01-26') cg = 20038;
            const potGen = calc(entry?.potGen);
            const isbl  = calc(entry?.isbl);
            const u520  = calc(entry?.u520);
            const z700  = calc(entry?.z700);
            const z800  = calc(entry?.z800);
            const torre = calc(entry?.torre);
            const admon = calc(entry?.admon);
            const osbl  = Math.max(0, Number((cg - (isbl + u520 + z700 + z800 + torre + admon)).toFixed(2)));
            const b100  = Number((mapaB100.get(fecha) || 0).toFixed(2));
            const foco  = b100 > 0 ? Number((cg / b100).toFixed(2)) : 0;
            const focoStatus: 'ok' | 'desviacion' | 'sin-dato' =
              b100 === 0 ? 'sin-dato' : foco <= this.energiaMeta ? 'ok' : 'desviacion';
            return { fecha, etiqueta: `${d}/${m}`, totalEnergia: cg, osbl, potGen, isbl, u520, z700, z800, torre, admon, tonB100: b100, foco, focoStatus };
          });

          this.diasConDesviacionEnergia = this.datosDiariosEnergia.filter(d => d.focoStatus === 'desviacion');

          // Asignar el valor del día anterior a hoy para evitar N/D en Energía
          const datoAyerEnergia = this.datosDiariosEnergia.find(d => d.fecha === ayerStr);
          if (datoAyerEnergia && datoAyerEnergia.tonB100 > 0 && datoAyerEnergia.totalEnergia > 0) {
            this.energiaKpis.ultimoDia = datoAyerEnergia.foco;
            this.energiaKpis.ultimoDiaFecha = datoAyerEnergia.fecha;
          } else {
            const validosEnergia = this.datosDiariosEnergia.filter(d => d.tonB100 > 0 && d.totalEnergia > 0);
            if (validosEnergia.length > 0) {
              const ultimoDato = validosEnergia[validosEnergia.length - 1];
              this.energiaKpis.ultimoDia = ultimoDato.foco;
              this.energiaKpis.ultimoDiaFecha = ultimoDato.fecha;
            } else {
              this.energiaKpis.ultimoDia = null;
              this.energiaKpis.ultimoDiaFecha = null;
            }
          }

          const totalEnergiaMes = this.datosDiariosEnergia.reduce((s: number, d: any) => s + d.totalEnergia, 0);
          const totalB100Mes = todasFechas.reduce((sum, fecha) => sum + (mapaB100.get(fecha) || 0), 0);
          this.energiaKpis.totalEnergiaMes = totalEnergiaMes;
          this.energiaKpis.totalB100Mes = totalB100Mes;
          this.energiaKpis.mensual = totalB100Mes > 0 ? Number((totalEnergiaMes / totalB100Mes).toFixed(2)) : 0;

          this.buildEnergiaCharts();
        } else if (this.selectedServicio === 'agua') {
          // Resetear el mapa de 5 minutos/horario para Agua
          this.mapaAgua5Min.clear();

          const mapaAgua = new Map<string, { minTot: number; maxTot: number; flowIntegrated: number; count: number }>();

          // Ordenar cronológicamente para calcular diferencias de tiempo correctas
          sensorData.sort((a: any, b: any) => {
            const ta = new Date(a.FechaRegistro || a.timestamp || a.fecharegistro || 0).getTime();
            const tb = new Date(b.FechaRegistro || b.timestamp || b.fecharegistro || 0).getTime();
            return ta - tb;
          });

          let lastTime: number | null = null;
          for (const row of sensorData) {
            const rawFecha = row.FechaRegistro || row.timestamp || row.fecharegistro;
            if (!rawFecha) continue;
            const date = new Date(rawFecha);
            const rowYear  = date.getFullYear().toString();
            const rowMonth = (date.getMonth() + 1).toString().padStart(2, '0');
            if (rowYear !== this.selectedYear || rowMonth !== this.selectedMonth) continue;

            const flow = this.plcsService.parsePlcValue(row['global_Agua'] || row['global_agua'] || row['globalAgua'] || row['GLOBAL_AGUA'] || row['1100FTAF01']);
            const totalizer = this.plcsService.parsePlcValue(row['Agua_total'] || row['agua_total'] || row['aguaTotal'] || row['AGUA_TOTAL'] || row['1100FTAF01_TOTALIZER']);

            const dd = date.getDate().toString().padStart(2, '0');
            const fecha = `${rowYear}-${rowMonth}-${dd}`;

            const time = date.getTime();
            let diffMinutes = 1;
            if (lastTime !== null) {
              const diff = Math.abs(time - lastTime) / 60000;
              if (diff > 0 && diff < 60) {
                diffMinutes = diff;
              }
            }
            lastTime = time;

            // Agrupado diario
            const ex = mapaAgua.get(fecha);
            if (ex) {
              if (totalizer > 0) {
                ex.minTot = Math.min(ex.minTot, totalizer);
                ex.maxTot = Math.max(ex.maxTot, totalizer);
              }
              ex.flowIntegrated += (flow * diffMinutes / 60);
              ex.count++;
            } else {
              mapaAgua.set(fecha, {
                minTot: totalizer > 0 ? totalizer : Number.MAX_VALUE,
                maxTot: totalizer > 0 ? totalizer : -Number.MAX_VALUE,
                flowIntegrated: (flow * diffMinutes / 60),
                count: 1
              });
            }

            // Agrupado de comportamiento (5 minutos/horario) para el día seleccionado
            const hh = date.getHours().toString().padStart(2, '0');
            const mm = date.getMinutes().toString().padStart(2, '0');
            const label = `${hh}:${mm}`;

            if (!this.mapaAgua5Min.has(fecha)) {
              this.mapaAgua5Min.set(fecha, []);
            }
            this.mapaAgua5Min.get(fecha)!.push({
              label,
              flujo: Number(flow.toFixed(2)),
              totalizer: Number(totalizer.toFixed(2))
            } as any);
          }

          this.diasDisponiblesAgua = [...this.mapaAgua5Min.keys()].sort();
          if (!this.selectedDiaAgua || !this.diasDisponiblesAgua.includes(this.selectedDiaAgua)) {
            const hoy = new Date();
            const hoyStr = `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, '0')}-${hoy.getDate().toString().padStart(2, '0')}`;
            const lastIdx = this.diasDisponiblesAgua.length - 1;
            if (lastIdx >= 0) {
              const lastDay = this.diasDisponiblesAgua[lastIdx];
              if (lastDay === hoyStr && lastIdx > 0) {
                this.selectedDiaAgua = this.diasDisponiblesAgua[lastIdx - 1];
              } else {
                this.selectedDiaAgua = lastDay;
              }
            } else {
              this.selectedDiaAgua = '';
            }
          }

          const mapaB100 = new Map<string, number>();
          (b100Mes.dailyData || []).forEach((d: any) => mapaB100.set(d.date, d.produccion));

          // Constante de inicio real del sensor de agua (comenzó a operar el 19/08/2026)
          const todasFechas = [...new Set([...mapaAgua.keys(), ...mapaB100.keys()])].sort();

          this.datosDiariosAgua = todasFechas.map(fecha => {
            const [y, m, d] = fecha.split('-');
            const entry = mapaAgua.get(fecha);
            // Consumo diario es max - min del totalizador, o si es 0, suma del flujo integrado
            let cg = (entry && entry.maxTot >= entry.minTot && entry.minTot !== Number.MAX_VALUE) ? (entry.maxTot - entry.minTot) : 0;
            if (cg === 0 && entry) {
              cg = entry.flowIntegrated;
            }
            cg = Number(cg.toFixed(2));

            const b100  = Number((mapaB100.get(fecha) || 0).toFixed(2));
            const foco  = b100 > 0 ? Number((cg / b100).toFixed(2)) : 0;
            const focoStatus: 'ok' | 'desviacion' | 'sin-dato' =
              b100 === 0 ? 'sin-dato' : foco <= this.aguaMeta ? 'ok' : 'desviacion';

            return { fecha, etiqueta: `${d}/${m}`, totalAgua: cg, tonB100: b100, foco, focoStatus };
          });

          this.diasConDesviacionAgua = this.datosDiariosAgua.filter(d => d.focoStatus === 'desviacion');

          // Asignar el valor del día anterior a hoy
          const hoyAgua = new Date();
          const ayerAgua = new Date(hoyAgua);
          ayerAgua.setDate(hoyAgua.getDate() - 1);
          const ayerStrAgua = `${ayerAgua.getFullYear()}-${(ayerAgua.getMonth() + 1).toString().padStart(2, '0')}-${ayerAgua.getDate().toString().padStart(2, '0')}`;

          const datoAyerAgua = this.datosDiariosAgua.find(d => d.fecha === ayerStrAgua);
          if (datoAyerAgua && datoAyerAgua.tonB100 > 0 && datoAyerAgua.totalAgua > 0) {
            this.aguaKpis.ultimoDia = datoAyerAgua.foco;
            this.aguaKpis.ultimoDiaFecha = datoAyerAgua.fecha;
          } else {
            const validosAgua = this.datosDiariosAgua.filter(d => d.tonB100 > 0 && d.totalAgua > 0);
            if (validosAgua.length > 0) {
              const ultimoDato = validosAgua[validosAgua.length - 1];
              this.aguaKpis.ultimoDia = ultimoDato.foco;
              this.aguaKpis.ultimoDiaFecha = ultimoDato.fecha;
            } else {
              this.aguaKpis.ultimoDia = null;
              this.aguaKpis.ultimoDiaFecha = null;
            }
          }

          const totalAguaMes = this.datosDiariosAgua.reduce((s: number, d: any) => s + d.totalAgua, 0);
          const totalB100Mes = todasFechas.reduce((sum, fecha) => sum + (mapaB100.get(fecha) || 0), 0);
          this.aguaKpis.totalAguaMes = totalAguaMes;
          this.aguaKpis.totalB100Mes = totalB100Mes;
          this.aguaKpis.mensual = totalB100Mes > 0 ? Number((totalAguaMes / totalB100Mes).toFixed(2)) : 0;

          this.buildAguaCharts();
        }

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

  buildEnergiaCharts() {
    // ── Opciones de doble eje para energía ──
    const energiaDualOptions = (labelLeft: string, labelRight: string): ChartOptions<'line'> => ({
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        'y-left':  { type: 'linear', position: 'left',  grid: { display: false }, title: { display: true, text: labelLeft  } },
        'y-right': { type: 'linear', position: 'right', grid: { display: false }, title: { display: true, text: labelRight } }
      },
      plugins: { legend: { position: 'top' }, datalabels: { display: false } as any }
    });
    // Actualizar mixedOptions para que las gráficas de energía tengan doble eje
    this.mixedOptions = energiaDualOptions('kWh', 'Ton B100');

    // Opciones FOCO: eje único para la línea de tendencia FOCO + tooltip con B100
    this.focoOptions = {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: {
          grid: { display: false },
          title: { display: true, text: 'kWh / Ton B100' }
        }
      },
      plugins: {
        legend: { position: 'top' },
        datalabels: { display: false } as any,
        tooltip: {
          mode: 'index',
          intersect: false,
          filter: (item) => item.datasetIndex === 0, // Solo mostrar serie FOCO, ocultar Meta
          callbacks: {
            afterBody: (items: any[]) => {
              const idx = items[0]?.dataIndex;
              if (idx === undefined) return '';
              const tonB100 = this.datosDiariosEnergia[idx]?.tonB100 ?? 0;
              return `Producción B100: ${tonB100.toFixed(2)} Ton`;
            }
          }
        }
      }
    };

    // Opciones multi-serie: eje único para las 9 líneas de consumo
    this.comportamientoOptions = {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 20 } },
        y: { grid: { display: false }, title: { display: true, text: 'kWh' } }
      },
      plugins: { legend: { position: 'top' }, datalabels: { display: false } as any }
    };

    const labels = this.datosDiariosEnergia.map(d => d.etiqueta);
    const cg = this.datosDiariosEnergia.map(d => d.totalEnergia);
    const osbl = this.datosDiariosEnergia.map(d => d.osbl);
    const potGen = this.datosDiariosEnergia.map(d => d.potGen);
    const isbl = this.datosDiariosEnergia.map(d => d.isbl);
    const u520 = this.datosDiariosEnergia.map(d => d.u520);
    const z700 = this.datosDiariosEnergia.map(d => d.z700);
    const z800 = this.datosDiariosEnergia.map(d => d.z800);
    const torre = this.datosDiariosEnergia.map(d => d.torre);
    const admon = this.datosDiariosEnergia.map(d => d.admon);
    const b100 = this.datosDiariosEnergia.map(d => d.tonB100);
    const foco = this.datosDiariosEnergia.map(d => d.foco);
    const focoColors = this.datosDiariosEnergia.map(d =>
      d.focoStatus === 'ok' ? '#27ae60' : d.focoStatus === 'desviacion' ? '#e74c3c' : '#bdc3c7'
    );

    // 1. Consumo Total Eléctrico vs Ton B100
    this.energiaTotalVsB100Data = {
      labels,
      datasets: [
        {
          label: 'Energía / Ton B100 (kWh/Ton)',
          data: foco,
          borderColor: '#13590c', backgroundColor: 'rgba(19,89,12,0.07)',
          borderWidth: 2.5, pointRadius: 5, pointHoverRadius: 8,
          pointBackgroundColor: '#ffffff', pointBorderColor: '#13590c', pointBorderWidth: 2,
          fill: true, tension: 0.3
        },
        {
          label: `Meta (${this.energiaMeta} kWh/Ton)`,
          data: Array(labels.length).fill(this.energiaMeta),
          borderColor: '#e74c3c', borderWidth: 2,
          borderDash: [6, 4], pointRadius: 0, fill: false
        }
      ]
    };


    // 2. Gráfica de Línea: FOCO hora a hora — se construye con filtrarFocoDiarioHora()
    // (se llama al final de este método)

    // 3. Gráfica de Barras: Producción diaria de Ton B100
    this.energiaB100BarrasData = {
      labels,
      datasets: [
        {
          label: 'Producción B100 (Ton)',
          data: b100,
          backgroundColor: '#13590c', borderColor: '#0f4409',
          borderWidth: 1.5, borderRadius: 4
        }
      ]
    };

    // 4. Comportamiento Consumo Eléctrico de 9 series
    this.energiaComportamientoMultiData = {
      labels,
      datasets: [
        { label: 'Total consumo planta (energia)', data: cg,     borderColor: '#34495e', backgroundColor: 'rgba(52,73,94,0.08)',    fill: false, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: '#34495e' },
        { label: 'Potencia generada en planta',      data: potGen, borderColor: '#2ecc71', backgroundColor: 'rgba(46,204,113,0.08)',  fill: false, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: '#2ecc71' },
        { label: 'Consumo ISBL',                     data: isbl,   borderColor: '#3498db', backgroundColor: 'rgba(52,152,219,0.08)',  fill: false, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: '#3498db' },
        { label: 'Unidad 520',                       data: u520,   borderColor: '#9b59b6', backgroundColor: 'rgba(155,89,182,0.08)', fill: false, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: '#9b59b6' },
        { label: 'Zona 700',                         data: z700,   borderColor: '#e67e22', backgroundColor: 'rgba(230,126,34,0.08)', fill: false, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: '#e67e22' },
        { label: 'Zona 800',                         data: z800,   borderColor: '#e74c3c', backgroundColor: 'rgba(231,76,60,0.08)',  fill: false, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: '#e74c3c' },
        { label: 'Torre de enfriamiento',            data: torre,  borderColor: '#1abc9c', backgroundColor: 'rgba(26,188,156,0.08)', fill: false, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: '#1abc9c' },
        { label: 'Edificio administración y chiller',data: admon,  borderColor: '#95a5a6', backgroundColor: 'rgba(149,165,166,0.08)',fill: false, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: '#95a5a6' },
        { label: 'Consumo OSBL',                     data: osbl,   borderColor: '#d35400', backgroundColor: 'rgba(211,84,0,0.08)',   fill: false, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: '#d35400' }
      ]
    };

    // Construir gráfica horaria FOCO con el día seleccionado
    this.filtrarFocoDiarioHora();
  }

  // ─── FOCO hora a hora por día ─────────────────────────────────────────────
  filtrarFocoDiarioHora() {
    if (!this.selectedDia || !this.mapaEnergiaHoraria.has(this.selectedDia)) {
      this.energiaFocoLineaData = { labels: [], datasets: [] };
      this.cdr.detectChanges();
      return;
    }

    const horas = this.mapaEnergiaHoraria.get(this.selectedDia)!;
    const [y, m, d] = this.selectedDia.split('-');

    // B100 total del día seleccionado
    const diaData = this.datosDiariosEnergia.find((x: any) => x.fecha === this.selectedDia);
    const b100Dia = diaData?.tonB100 ?? 0;

    const labels = horas.map(h => h.label);
    const focoHora = horas.map(h => {
      const focoH = b100Dia > 0 ? Number((h.cg / b100Dia).toFixed(2)) : 0;

      return focoH;
    });
    const colores = focoHora.map(v =>
      v === 0 ? '#bdc3c7' : v <= this.energiaMeta ? '#13590c' : '#e74c3c'
    );

    this.energiaFocoLineaData = {
      labels,
      datasets: [
        {
          label: `Energía ${d}/${m}/${y} (kWh)`,
          data: horas.map(h => h.cg),
          borderColor: '#f39c12', backgroundColor: 'rgba(243,156,18,0.06)',
          borderWidth: 2.5, pointRadius: 5, pointHoverRadius: 8,
          pointBackgroundColor: '#ffffff', pointBorderColor: '#f39c12', pointBorderWidth: 2,
          fill: true, tension: 0.3, yAxisID: 'y-left'
        },
        {
          label: `FOCO ${d}/${m}/${y} — kWh/Ton B100`,
          data: focoHora,
          borderColor: '#13590c', backgroundColor: 'transparent',
          borderWidth: 2, pointRadius: 5, pointHoverRadius: 8,
          pointBackgroundColor: colores, pointBorderColor: colores, pointBorderWidth: 2,
          fill: false, tension: 0.3, yAxisID: 'y-right'
        },
        {
          label: `Meta (${this.energiaMeta} kWh/Ton)`,
          data: Array(labels.length).fill(this.energiaMeta),
          borderColor: '#e74c3c', borderWidth: 2,
          borderDash: [6, 4], pointRadius: 0, fill: false, yAxisID: 'y-right'
        }
      ]
    };
    // Update options for dual axis for FOCO hourly graph
    this.energiaHorariaOptions = {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        'y-left': { type: 'linear', position: 'left', title: { display: true, text: 'Energía (kWh)' } },
        'y-right': { type: 'linear', position: 'right', title: { display: true, text: 'FOCO (kWh/Ton)' }, grid: { display: false } }
      },
      plugins: { legend: { position: 'top' }, datalabels: { display: false } as any }
    };

    this.cdr.detectChanges();
  }

  /** Navega al día anterior (delta=-1) o siguiente (delta=+1) en la gráfica FOCO horario */
  navegarDia(delta: number) {
    const idx = this.diasDisponiblesEnergia.indexOf(this.selectedDia);
    const newIdx = idx + delta;
    if (newIdx >= 0 && newIdx < this.diasDisponiblesEnergia.length) {
      this.selectedDia = this.diasDisponiblesEnergia[newIdx];
      this.filtrarFocoDiarioHora();
    }
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
          borderColor: '#13590c', backgroundColor: 'rgba(19,89,12,0.06)',
          borderWidth: 2.5, pointRadius: 5, pointHoverRadius: 8,
          pointBackgroundColor: '#ffffff', pointBorderColor: '#13590c', pointBorderWidth: 2,
          fill: true, tension: 0.3, yAxisID: 'y-right'
        },
        {
          label: 'Consumo Total Vapor (1100FTSG12)',
          data: tv,
          borderColor: '#7ac3e0', backgroundColor: 'rgba(122,195,224,0.06)',
          borderWidth: 2.5, pointRadius: 5, pointHoverRadius: 8,
          pointBackgroundColor: '#ffffff', pointBorderColor: '#7ac3e0', pointBorderWidth: 2,
          fill: true, tension: 0.3, yAxisID: 'y-left'
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
          borderColor: '#13590c', backgroundColor: 'rgba(19,89,12,0.06)',
          borderWidth: 2.5, pointRadius: 5, pointHoverRadius: 8,
          pointBackgroundColor: '#ffffff', pointBorderColor: '#13590c', pointBorderWidth: 2,
          fill: true, tension: 0.3, yAxisID: 'y-right'
        },
        {
          label: 'ISBL Desagregado',
          data: isbl,
          borderColor: '#7ac3e0', backgroundColor: 'rgba(122,195,224,0.06)',
          borderWidth: 2.5, pointRadius: 5, pointHoverRadius: 8,
          pointBackgroundColor: '#ffffff', pointBorderColor: '#7ac3e0', pointBorderWidth: 2,
          fill: true, tension: 0.3, yAxisID: 'y-left'
        }
      ]
    };

    // ── Gráfica 4: FOCO diario (línea coloreada por punto) ──
    this.focoData = {
      labels,
      datasets: [
        {
          label: 'FOCO (kg vapor / Ton B100)',
          data: foco,
          borderColor: '#FF9800', backgroundColor: 'transparent',
          borderWidth: 2.5, pointRadius: 6, pointHoverRadius: 9,
          pointBackgroundColor: focoColors, pointBorderColor: focoColors,
          fill: false, tension: 0.3
        },
        {
          label: `Meta (${FOCO_META} kg/Ton)`,
          data: Array(labels.length).fill(FOCO_META),
          borderColor: '#e74c3c', borderWidth: 2,
          borderDash: [6, 4], pointRadius: 0, fill: false
        }
      ]
    };
    this.focoOptions = {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { grid: { display: false }, title: { display: true, text: 'kg vapor / Ton B100' } }
      },
      plugins: {
        legend: { position: 'top' },
        datalabels: { display: false } as any,
        tooltip: {
          mode: 'index',
          intersect: false,
          filter: (item) => item.datasetIndex === 0, // Solo mostrar serie FOCO, ocultar Meta
          callbacks: {
            label: (context) => {
              const index = context.dataIndex;
              const dayData = this.datosDiarios[index];
              if (dayData) {
                return [
                  `FOCO: ${dayData.foco} kg/Ton`,
                  `Vapor: ${dayData.totalVapor.toLocaleString()} kg`,
                  `B100: ${dayData.tonB100.toLocaleString()} Ton`
                ];
              }
              return context.formattedValue;
            }
          }
        }
      }
    };

    // ── Gráfica 5: Producción diaria de B100 (barras) ──
    this.vaporB100BarrasData = {
      labels,
      datasets: [
        {
          label: 'Producción B100 (Ton)',
          data: b100,
          backgroundColor: '#13590c', borderColor: '#0f4409',
          borderWidth: 1.5, borderRadius: 4
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

  buildAguaCharts() {
    const labels = this.datosDiariosAgua.map(d => d.etiqueta);
    const cg = this.datosDiariosAgua.map(d => d.totalAgua);
    const b100 = this.datosDiariosAgua.map(d => d.tonB100);
    const foco = this.datosDiariosAgua.map(d => d.foco);
    const focoColors = this.datosDiariosAgua.map(d =>
      d.focoStatus === 'ok' ? '#27ae60' : d.focoStatus === 'desviacion' ? '#e74c3c' : '#bdc3c7'
    );

    const aguaDualOptions = (labelLeft: string, labelRight: string): ChartOptions<'line'> => ({
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        'y-left':  { type: 'linear', position: 'left',  grid: { display: false }, title: { display: true, text: labelLeft  } },
        'y-right': { type: 'linear', position: 'right', grid: { display: false }, title: { display: true, text: labelRight } }
      },
      plugins: { legend: { position: 'top' }, datalabels: { display: false } as any }
    });

    this.mixedOptions = aguaDualOptions('m³', 'Ton B100');

    this.aguaTotalVsB100Data = {
      labels,
      datasets: [
        {
          label: 'Ton B100 producida',
          data: b100,
          borderColor: '#13590c', backgroundColor: 'rgba(19,89,12,0.06)',
          borderWidth: 2.5, pointRadius: 5, pointHoverRadius: 8,
          pointBackgroundColor: '#ffffff', pointBorderColor: '#13590c', pointBorderWidth: 2,
          fill: true, tension: 0.3, yAxisID: 'y-right'
        },
        {
          label: 'Consumo Total Agua (m³)',
          data: cg,
          borderColor: '#0288d1', backgroundColor: 'rgba(2,136,209,0.06)',
          borderWidth: 2.5, pointRadius: 5, pointHoverRadius: 8,
          pointBackgroundColor: '#ffffff', pointBorderColor: '#0288d1', pointBorderWidth: 2,
          fill: true, tension: 0.3, yAxisID: 'y-left'
        }
      ]
    };

    this.aguaFocoLineaData = {
      labels,
      datasets: [
        {
          label: 'FOCO Agua (m³/Ton B100)',
          data: foco,
          borderColor: '#0288d1', backgroundColor: 'transparent',
          borderWidth: 2.5, pointRadius: 6, pointHoverRadius: 9,
          pointBackgroundColor: focoColors, pointBorderColor: focoColors,
          fill: false, tension: 0.3
        },
        {
          label: `Meta (${this.aguaMeta} m³/Ton)`,
          data: Array(labels.length).fill(this.aguaMeta),
          borderColor: '#e74c3c', borderWidth: 2,
          borderDash: [6, 4], pointRadius: 0, fill: false
        }
      ]
    };

    this.focoOptions = {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { grid: { display: false }, title: { display: true, text: 'm³ agua / Ton B100' } }
      },
      plugins: {
        legend: { position: 'top' },
        datalabels: { display: false } as any,
        tooltip: {
          mode: 'index',
          intersect: false,
          filter: (item) => item.datasetIndex === 0,
          callbacks: {
            label: (context) => {
              const index = context.dataIndex;
              const dayData = this.datosDiariosAgua[index];
              if (dayData) {
                return [
                  `FOCO Agua: ${dayData.foco} m³/Ton`,
                  `Consumo: ${dayData.totalAgua.toLocaleString()} m³`,
                  `B100: ${dayData.tonB100.toLocaleString()} Ton`
                ];
              }
              return context.formattedValue;
            }
          }
        }
      }
    };

    this.filtrarAguaDiarioHora();
    this.buildAguaB100MensualChart();
  }

  filtrarAguaDiarioHora() {
    if (!this.selectedDiaAgua || !this.mapaAgua5Min.has(this.selectedDiaAgua)) {
      this.aguaComportamientoMultiData = { labels: [], datasets: [] };
      this.cdr.detectChanges();
      return;
    }

    const registros = this.mapaAgua5Min.get(this.selectedDiaAgua)!;
    const [y, m, d] = this.selectedDiaAgua.split('-');

    const labels = registros.map(r => r.label);
    const flujoData = registros.map(r => r.flujo);

    this.aguaComportamientoMultiData = {
      labels,
      datasets: [
        {
          label: `Flujo de Agua ${d}/${m}/${y} (1100FTAF01)`,
          data: flujoData,
          borderColor: '#0288d1', backgroundColor: 'rgba(2,136,209,0.08)',
          borderWidth: 2, pointRadius: 0, pointHoverRadius: 5,
          pointBackgroundColor: '#0288d1', pointBorderColor: '#0288d1', pointBorderWidth: 0,
          fill: true, tension: 0.4
        }
      ]
    };
    this.cdr.detectChanges();
  }

  navegarDiaAgua(delta: number) {
    const idx = this.diasDisponiblesAgua.indexOf(this.selectedDiaAgua);
    const newIdx = idx + delta;
    if (newIdx >= 0 && newIdx < this.diasDisponiblesAgua.length) {
      this.selectedDiaAgua = this.diasDisponiblesAgua[newIdx];
      this.filtrarAguaDiarioHora();
    }
  }

  // ─── LÓGICA ASÍNCRONA DATOS ANUALES ──────────────────────────────────────────

  public procesarDatosAnuales(
    b100Historico: any,
    sensorDataAnual: any,
    servicio: 'vapor' | 'energia' | 'agua',
    sensorAguaMensual?: any[]
  ) {
    const hoy = new Date();
    const anioInicio = `${this.selectedYear}-01-01`;
    const selectedMonthNum = Number(this.selectedMonth);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const lastDayOfSelectedMonth = new Date(Number(this.selectedYear), selectedMonthNum, 0).getDate();
    const isCurrentYear = hoy.getFullYear().toString() === this.selectedYear;
    const isCurrentMonth = isCurrentYear && (hoy.getMonth() + 1) === selectedMonthNum;

    const fechaFinAnio = isCurrentMonth
      ? hoy.toISOString().split('T')[0]
      : `${this.selectedYear}-${this.selectedMonth}-${pad(lastDayOfSelectedMonth)}`;

    const anioInicioEfectivo = anioInicio;

    const totalB100Anio = (b100Historico?.dailyData || [])
      .filter((d: any) => d.date >= anioInicioEfectivo && d.date <= fechaFinAnio)
      .reduce((sum: number, d: any) => sum + d.produccion, 0);

    if (servicio === 'vapor') {
      this.kpis.totalB100Anio = totalB100Anio;
      let totalVaporAnio = 0;
      if (Array.isArray(sensorDataAnual) && sensorDataAnual.length > 0) {
        totalVaporAnio = Number(sensorDataAnual[0]?.totalVapor || 0);
      }
      this.kpis.totalVaporAnio = Number(totalVaporAnio.toFixed(2));
      this.kpis.focoAnual = totalB100Anio > 0 ? Number((totalVaporAnio / totalB100Anio).toFixed(2)) : 0;
    } else if (servicio === 'energia') {
      this.energiaKpis.totalB100Anio = totalB100Anio;
      let totalEnergiaAnio = 0;
      if (Array.isArray(sensorDataAnual) && sensorDataAnual.length > 0) {
        totalEnergiaAnio = Number(sensorDataAnual[0]?.totalEnergia || 0);
      }
      this.energiaKpis.totalEnergiaAnio = Number(totalEnergiaAnio.toFixed(2));
      this.energiaKpis.anual = totalB100Anio > 0 ? Number((totalEnergiaAnio / totalB100Anio).toFixed(2)) : 0;
    } else if (servicio === 'agua') {
      this.ultimoB100Anio = b100Historico;
      this.aguaKpis.totalB100Anio = totalB100Anio;
      let totalAguaAnio = 0;
      if (Array.isArray(sensorDataAnual) && sensorDataAnual.length > 0) {
        totalAguaAnio = Number(sensorDataAnual[0]?.totalAgua || 0);
      }
      this.aguaKpis.totalAguaAnio = Number(totalAguaAnio.toFixed(2));
      this.aguaKpis.anual = totalB100Anio > 0 ? Number((totalAguaAnio / totalB100Anio).toFixed(2)) : 0;

      if (sensorAguaMensual) {
        this.datosMensualesAgua = sensorAguaMensual;
      }
      this.buildAguaB100MensualChart();
    }

    this.cdr.detectChanges();
  }

  /** Construye la gráfica de barras con el consumo mensual de agua (m³) del año seleccionado */
  private buildAguaB100MensualChart() {
    if (!this.datosMensualesAgua || this.datosMensualesAgua.length === 0 || !this.ultimoB100Anio) {
      this.aguaB100MensualData = { labels: [], datasets: [] };
      return;
    }

    // Agrupar producción B100 por mes
    const mapaB100Mensual = new Map<number, number>();
    if (this.ultimoB100Anio && Array.isArray(this.ultimoB100Anio.dailyData)) {
      for (const day of this.ultimoB100Anio.dailyData) {
        if (!day.date) continue;
        const parts = day.date.split('-');
        if (parts.length >= 2) {
          const mesNum = parseInt(parts[1], 10);
          const prod = Number(day.produccion || 0);
          mapaB100Mensual.set(mesNum, (mapaB100Mensual.get(mesNum) || 0) + prod);
        }
      }
    }

    const labels: string[] = [];
    const valores: number[] = [];
    const colores: string[] = [];
    const renderedMonths: string[] = [];

    // Procesar cada mes que tenga datos de agua
    this.datosMensualesAgua.forEach((d: any) => {
      const mesNum = parseInt(d.mes || d.Mes || 0, 10);
      const limitMonth = parseInt(this.selectedMonth, 10);
      if (mesNum > 0 && mesNum <= limitMonth) {
        const mesLabel = this.meses[mesNum - 1]?.label || `Mes ${mesNum}`;
        labels.push(mesLabel);
        renderedMonths.push(mesNum.toString().padStart(2, '0'));

        const totalAgua = Number(d.totalAgua || 0);
        valores.push(Number(totalAgua.toFixed(2)));

        const tonB100 = mapaB100Mensual.get(mesNum) || 0;
        const foco = tonB100 > 0 ? totalAgua / tonB100 : 0;
        const focoStatus = tonB100 === 0 ? 'sin-dato' : foco <= this.aguaMeta ? 'ok' : 'desviacion';

        const color = 'rgba(2,136,209,0.80)'; // Todas las barras azules
        colores.push(color);
      }
    });

    this.renderedMonthsAgua = renderedMonths;

    this.aguaB100MensualData = {
      labels,
      datasets: [
        {
          type: 'bar',
          label: `Consumo Agua (m³) — ${this.selectedYear}`,
          data: valores,
          backgroundColor: colores,
          borderColor: colores.map(c => c.replace('0.80', '1').replace('0.60', '1')),
          borderWidth: 1.5,
          borderRadius: 4,
          order: 2
        } as any,
        {
          type: 'line',
          label: `Meta Mensual (${this.aguaMetaMensual} m³/Ton)`,
          data: Array(labels.length).fill(this.aguaMetaMensual),
          borderColor: '#e74c3c',
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
          order: 1
        } as any
      ]
    };
  }

  onAguaMensualClick(event: any) {
    const { active } = event;
    if (active && active.length > 0) {
      const index = active[0].index;
      const mesStr = this.renderedMonthsAgua[index];
      if (mesStr) {
        this.selectedMonth = mesStr;
        this.cargarDatos();
      }
    }
  }

  onAguaDiariaClick(event: any) {
    const { active } = event;
    if (active && active.length > 0) {
      const index = active[0].index;
      const dayData = this.datosDiariosAgua[index];
      if (dayData && dayData.fecha) {
        this.selectedDiaAgua = dayData.fecha;
        this.filtrarAguaDiarioHora();
      }
    }
  }


  formatDateToDMY(dateStr: string | null): string {
    if (!dateStr) return 'Sin dato';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }
}
