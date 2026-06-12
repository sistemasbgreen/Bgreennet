import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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

const FOCO_META = 730;
const B100_ID = '26'; // idProductoSiesa de B100

@Component({
  selector: 'app-servicios-industriales',
  standalone: true,
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
    meta: 110
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

  fechaCalculoVapor: string = '';
  fechaCalculoEnergia: string = '';
  focoUltimoDiaFecha: string | null = null;

  formatDateToDMY(fechaStr: string): string {
    if (!fechaStr) return '';
    const parts = fechaStr.split('-');
    if (parts.length !== 3) return fechaStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

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
        forkJoin({
          b100Anio: this.b100AnioCache.has(anioKey)
            ? of(this.b100AnioCache.get(anioKey))
            : this.cmiplantaService.obtenerDatos({ ...(req as any), startDate: anioInicio, endDate: fechaFinAnio }).pipe(
                map((d: any) => { this.b100AnioCache.set(anioKey, d); return d; }),
                catchError(() => of({ dailyData: [] }))
              ),
          vaporAnual: this.sensorAnioCache.has(`vapor-${anioKey}`)
            ? of(this.sensorAnioCache.get(`vapor-${anioKey}`))
            : this.plcsService.getVapor(anioInicioPLC, fechaFinAnioPLC).pipe(
                map((d: any) => { this.sensorAnioCache.set(`vapor-${anioKey}`, d); return d; }),
                catchError(() => of([]))
              ),
          energiaAnual: this.sensorAnioCache.has(`energia-${anioKey}`)
            ? of(this.sensorAnioCache.get(`energia-${anioKey}`))
            : this.plcsService.getEnergia(anioInicio, isAntesDeJunio2026 ? fechaFinAnioPLC : fechaFinAnio).pipe(
                map((d: any) => { this.sensorAnioCache.set(`energia-${anioKey}`, d); return d; }),
                catchError(() => of([]))
              )
        }).pipe(takeUntil(this.destroy$)).subscribe((anual: any) => {
          this.procesarDatosAnualesLocales(anual.b100Anio, anual.vaporAnual, anual.energiaAnual, anioInicio, fechaFinAnio, isAntesDeJunio2026);
        });

        return forkJoin({ b100Mes: b100Mes$, vaporMes: sensorMes$, energiaMes: energiaMes$ });
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

  cargarDatos() {
    this.cargando = true;

    const { fechaInicio, fechaFin } = this.getFechaRango(this.selectedMonth, this.selectedYear);
    const hoy = new Date();
    const yearNum = Number(this.selectedYear);
    const monthNum = Number(this.selectedMonth);
    const isAntesDeJunio2026 = (yearNum < 2026) || (yearNum === 2026 && monthNum < 6);
    const fechaFinAnio = fechaFin;

    this.getBaseRequest().pipe(
      switchMap(baseRequest => {
        const isVapor = this.selectedServicio === 'vapor';
        const emptyB100Response = { dailyData: [], totalProduction: 0, totalConsumption: 0, monthlyAccumulated: 0, validDays: 0 };
        const anioInicio = `${this.selectedYear}-01-01`;
        const mesKey    = `${this.selectedYear}-${this.selectedMonth}`;
        const anioKey   = this.selectedYear;
        const svcKey    = isVapor ? 'vapor' : 'energia';

        let fechaInicioPLC = fechaInicio;
        let fechaFinPLC = fechaFin;
        const pad = (n: number) => n.toString().padStart(2, '0');

        // Para vapor (siempre) y energía antes de junio 2026 (para calcular el último día), necesitamos +1 día
        const partsE = fechaFin.split('-').map(Number);
        const dEnd = new Date(partsE[0], partsE[1] - 1, partsE[2]);
        dEnd.setDate(dEnd.getDate() + 1);
        fechaFinPLC = `${dEnd.getFullYear()}-${pad(dEnd.getMonth() + 1)}-${pad(dEnd.getDate())}`;

        if (isVapor) {
          const partsS = fechaInicio.split('-').map(Number);
          const dStart = new Date(partsS[0], partsS[1] - 1, partsS[2]);
          dStart.setDate(dStart.getDate() - 1);
          fechaInicioPLC = `${dStart.getFullYear()}-${pad(dStart.getMonth() + 1)}-${pad(dStart.getDate())}`;
        }

        // ── Datos mensuales sensor — con caché ──
        const cacheKey = `${svcKey}-${mesKey}`;
        const sensorData$ = this.sensorCache.has(cacheKey)
          ? of(this.sensorCache.get(cacheKey))
          : isVapor
            ? this.plcsService.getVapor(fechaInicioPLC, fechaFinPLC).pipe(
                map((data: any[]) => { this.sensorCache.set(cacheKey, data); return data; }),
                catchError(() => of([]))
              )
            : this.plcsService.getEnergia(fechaInicio, isAntesDeJunio2026 ? fechaFinPLC : fechaFin).pipe(
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
        const sensorAnioKey = `${svcKey}-${anioKey}`;
        forkJoin({
          b100Anio: this.b100AnioCache.has(anioKey)
            ? of(this.b100AnioCache.get(anioKey))
            : this.cmiplantaService.obtenerDatos({ ...(baseRequest as any), startDate: anioInicio, endDate: fechaFinAnio }).pipe(
                map((d: any) => { this.b100AnioCache.set(anioKey, d); return d; }),
                catchError(() => of(emptyB100Response as any))
              ),
          sensorAnual: this.sensorAnioCache.has(sensorAnioKey)
            ? of(this.sensorAnioCache.get(sensorAnioKey))
            : isVapor
              ? this.plcsService.getVapor(anioInicioPLC, fechaFinAnioPLC).pipe(
                  map((d: any) => { this.sensorAnioCache.set(sensorAnioKey, d); return d; }),
                  catchError(() => of([]))
                )
              : this.plcsService.getEnergia(anioInicio, isAntesDeJunio2026 ? fechaFinAnioPLC : fechaFinAnio).pipe(
                  map((d: any) => { this.sensorAnioCache.set(sensorAnioKey, d); return d; }),
                  catchError(() => of([]))
                )
        }).pipe(takeUntil(this.destroy$)).subscribe(({ b100Anio, sensorAnual }: any) => {
          this.procesarDatosAnualesLocalesDetalle(b100Anio, sensorAnual, isVapor, anioInicio, fechaFinAnio);
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
            console.log(`[Gráfica Consumo vs B100] Registro: ${fecha} | Consumo Total Caldera (tv): ${tv} kg | Producción B100: ${b100} Ton`);
            
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

          this.buildCharts(labelsMinuto, isblMinuto, zona700Minuto);

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
          const mapaEnergiaHorariaFinal = new Map<string, {hora: string; cg: number; label: string}[]>();
          mapaHorario.forEach((dayMap, fecha) => {
            const horasArr: {hora: string; cg: number; label: string}[] = [];
            for (let i = 0; i < 24; i++) {
              const hh = i.toString().padStart(2, '0');
              const hrData = dayMap.get(hh);
              const cgHora = (hrData && hrData.max >= hrData.min) ? hrData.max - hrData.min : 0;
              horasArr.push({ hora: hh, cg: Number(cgHora.toFixed(2)), label: `${hh}:00` });
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

    // Imprimir los datos de la gráfica "Consumo Eléctrico (energia) / Ton B100 producida" en la consola
    console.log("=== DATOS GRÁFICA: Consumo Eléctrico (energia) / Ton B100 producida ===");
    this.datosDiariosEnergia.forEach(d => {
      console.log(`Fecha: ${d.fecha} | Consumo Planta (cg): ${d.totalEnergia} kWh | Producción B100: ${d.tonB100} Ton => FOCO Calculado (cg/B100): ${d.foco} kWh/Ton`);
    });
    console.log("======================================================================");

    // 1. Consumo Total Eléctrico vs Ton B100
    this.energiaTotalVsB100Data = {
      labels,
      datasets: [
        {
          label: 'Energía / Ton B100 (kWh/Ton)',
          data: foco,
          borderColor: '#27ae60', backgroundColor: 'rgba(39,174,96,0.07)',
          borderWidth: 2.5, pointRadius: 5, pointHoverRadius: 8,
          pointBackgroundColor: '#ffffff', pointBorderColor: '#27ae60', pointBorderWidth: 2,
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
        { label: 'Total consumo planta (energia)', data: cg,     borderColor: '#34495e', pointBackgroundColor: '#34495e', pointBorderColor: '#34495e', pointStyle: 'circle', fill: false, tension: 0.3, pointRadius: 4, pointHoverRadius: 6 },
        { label: 'Potencia generada en planta',      data: potGen, borderColor: '#2ecc71', pointBackgroundColor: '#2ecc71', pointBorderColor: '#2ecc71', pointStyle: 'circle', fill: false, tension: 0.3, pointRadius: 4, pointHoverRadius: 6 },
        { label: 'Consumo ISBL',                     data: isbl,   borderColor: '#3498db', pointBackgroundColor: '#3498db', pointBorderColor: '#3498db', pointStyle: 'circle', fill: false, tension: 0.3, pointRadius: 4, pointHoverRadius: 6 },
        { label: 'Unidad 520',                       data: u520,   borderColor: '#9b59b6', pointBackgroundColor: '#9b59b6', pointBorderColor: '#9b59b6', pointStyle: 'circle', fill: false, tension: 0.3, pointRadius: 4, pointHoverRadius: 6 },
        { label: 'Zona 700',                         data: z700,   borderColor: '#e67e22', pointBackgroundColor: '#e67e22', pointBorderColor: '#e67e22', pointStyle: 'circle', fill: false, tension: 0.3, pointRadius: 4, pointHoverRadius: 6 },
        { label: 'Zona 800',                         data: z800,   borderColor: '#e74c3c', pointBackgroundColor: '#e74c3c', pointBorderColor: '#e74c3c', pointStyle: 'circle', fill: false, tension: 0.3, pointRadius: 4, pointHoverRadius: 6 },
        { label: 'Torre de enfriamiento',            data: torre,  borderColor: '#1abc9c', pointBackgroundColor: '#1abc9c', pointBorderColor: '#1abc9c', pointStyle: 'circle', fill: false, tension: 0.3, pointRadius: 4, pointHoverRadius: 6 },
        { label: 'Edificio administración y chiller',data: admon,  borderColor: '#95a5a6', pointBackgroundColor: '#95a5a6', pointBorderColor: '#95a5a6', pointStyle: 'circle', fill: false, tension: 0.3, pointRadius: 4, pointHoverRadius: 6 },
        { label: 'Consumo OSBL',                     data: osbl,   borderColor: '#d35400', pointBackgroundColor: '#d35400', pointBorderColor: '#d35400', pointStyle: 'circle', fill: false, tension: 0.3, pointRadius: 4, pointHoverRadius: 6 }
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
      v === 0 ? '#bdc3c7' : v <= this.energiaMeta ? '#27ae60' : '#e74c3c'
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
          borderColor: '#27ae60', backgroundColor: 'transparent',
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
}
