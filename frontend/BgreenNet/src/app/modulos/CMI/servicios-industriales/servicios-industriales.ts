import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions, Chart, registerables } from 'chart.js';
import { forkJoin, Subject, of } from 'rxjs';
import { switchMap, takeUntil, catchError } from 'rxjs/operators';

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
  mapaEnergiaHoraria: Map<string, {hora: string; cg: number; label: string}[]> = new Map();

  energiaTotalVsB100Data: ChartData<'line'> = { labels: [], datasets: [] };
  energiaFocoLineaData: ChartData<'line'> = { labels: [], datasets: [] };
  energiaB100BarrasData: ChartData<'bar'> = { labels: [], datasets: [] };
  energiaComportamientoMultiData: ChartData<'line'> = { labels: [], datasets: [] };

  constructor(
    private plcsService: plcsServices,
    private cmiplantaService: cmiplantaservices,
    private productoService: productoservices,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Solo cargar datos si el servicio activo requiere llamadas a la API
    if (this.selectedServicio === 'vapor' || this.selectedServicio === 'energia') {
      this.cargarDatos();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
    if (this.selectedServicio === 'vapor' || this.selectedServicio === 'energia') this.cargarDatos();
  }

  onFiltroChange() {
    if (this.selectedServicio === 'vapor' || this.selectedServicio === 'energia') this.cargarDatos();
  }

  cargarDatos() {
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

        const baseRequest: Omit<MetanolRequest, 'startDate' | 'endDate'> = {
          consumptionProductId: b100.idProductoSiesa || b100.id,
          productionProductId:  b100.idProductoSiesa || b100.id,
          consumptionDocTypes:  b100.consumptionDocTypes,
          productionDocTypes:   b100.productionDocTypes
        };

        const isVapor = this.selectedServicio === 'vapor';
        // 2. Llamar en paralelo con manejo de error individual por llamada
        const emptyB100Response = { dailyData: [], totalProduction: 0, totalConsumption: 0, monthlyAccumulated: 0, validDays: 0 };
        return forkJoin({
          sensorData: (isVapor ? this.plcsService.getVapor() : this.plcsService.getEnergia()).pipe(
            catchError(err => { console.error('❌ Error cargando sensor data (PLC):', err); return of([]); })
          ),
          b100Mes: this.cmiplantaService.obtenerDatos({ ...baseRequest, startDate: fechaInicio, endDate: fechaFin }).pipe(
            catchError(err => { console.error('❌ Error cargando B100 mes:', err.status, err.error); return of(emptyB100Response as any); })
          ),
          b100Historico: this.cmiplantaService.obtenerDatos({ ...baseRequest, startDate: '2025-01-01', endDate: hoy.toISOString().split('T')[0] }).pipe(
            catchError(err => { console.error('❌ Error cargando B100 histórico:', err.status, err.error); return of(emptyB100Response as any); })
          )
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ sensorData, b100Mes, b100Historico }) => {
        if (this.selectedServicio === 'vapor') {
          // ── Datos por MINUTO para Gráfica 1 (Comportamiento) ──
          const labelsMinuto: string[] = [];
          const isblMinuto: number[] = [];
          const zona700Minuto: number[] = [];

          sensorData
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

          sensorData.forEach(row => {
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
          (b100Mes.dailyData || []).forEach((d: any) => mapaB100.set(d.date, d.produccion));

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

          // Días con desviación
          this.diasConDesviacion = this.datosDiarios.filter(d => d.focoStatus === 'desviacion');

          // ── KPIs ──
          const totalVaporMes = this.datosDiarios.reduce((s, d) => s + d.totalVapor, 0);
          const totalB100Mes  = b100Mes.totalProduction || 0;
          const focosValidos  = this.datosDiarios.filter(d => d.foco > 0).map(d => d.foco);

          // KPI anual: sumar vapor año completo
          let totalVaporAnio = 0;
          sensorData.forEach(row => {
            if (!row.FechaRegistro) return;
            if (new Date(row.FechaRegistro).getUTCFullYear().toString() !== this.selectedYear) return;
            totalVaporAnio += this.plcsService.parsePlcValue(row['1100FTSG12']);
          });

          // Calcular total producción B100 del año actual
          const totalB100Anio = (b100Historico.dailyData || [])
            .filter((d: any) => d.date.startsWith(this.selectedYear))
            .reduce((sum: number, d: any) => sum + d.produccion, 0);

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
        } else if (this.selectedServicio === 'energia') {
          console.log("⚡ [Energía] sensorData:", sensorData);
          console.log("⚡ [Energía] b100Mes:", b100Mes);

          // ── Helper para deltas y promedios ──
          const createTracker = () => ({ min: Number.MAX_VALUE, max: -Number.MAX_VALUE, sum: 0, count: 0 });
          const trackVal = (t: any, val: number) => {
            if (val > 0) {
              if (val < t.min) t.min = val;
              if (val > t.max) t.max = val;
            }
            t.sum += val; t.count++;
          };
          const getDelta = (t: any) => (t.min !== Number.MAX_VALUE && t.max >= t.min) ? (t.max - t.min) : 0;
          const getAvg = (t: any) => t.count > 0 ? (t.sum / t.count) : 0;

          // ── Agrupar energía por día Y por hora ──
          const mapaEnergia = new Map<string, any>();
          const mapaEnergiaHorariaTracker = new Map<string, {hora: string; cg: any; label: string}[]>();

          const exactKeys: {[key: string]: string} = {};
          if (sensorData.length > 0) {
            Object.keys(sensorData[0]).forEach(k => exactKeys[k.toLowerCase()] = k);
          }
          const fechaKey = exactKeys['fecharegistro'] || exactKeys['timestamp'];
          const keyEnergia = exactKeys['energia'];
          const keyFt = exactKeys['ft520129'];
          const keyU520 = exactKeys['contador_u520'];
          const keyCcm1 = exactKeys['contador_ccm1'];
          const keyCcm2 = exactKeys['contador_ccm2'];
          const keyCcm3 = exactKeys['contador_ccm3'];
          const keyAdmon = exactKeys['contador_admon'];
          const keyPotGen = exactKeys['potencia_gen'];

          sensorData.forEach((row: any) => {
            const rawFecha = fechaKey ? row[fechaKey] : null;
            if (!rawFecha) return;
            const date = new Date(rawFecha);
            const rowYear  = date.getUTCFullYear().toString();
            const rowMonth = (date.getUTCMonth() + 1).toString().padStart(2, '0');
            if (rowYear !== this.selectedYear || rowMonth !== this.selectedMonth) return;

            const fecha = date.toISOString().split('T')[0];

            const cg = keyEnergia ? this.plcsService.parsePlcValue(row[keyEnergia]) : 0;
            const ft = keyFt ? this.plcsService.parsePlcValue(row[keyFt]) : 0;
            const u520_val = keyU520 ? this.plcsService.parsePlcValue(row[keyU520]) : 0;
            const ccm1 = keyCcm1 ? this.plcsService.parsePlcValue(row[keyCcm1]) : 0;
            const ccm2 = keyCcm2 ? this.plcsService.parsePlcValue(row[keyCcm2]) : 0;
            const ccm3 = keyCcm3 ? this.plcsService.parsePlcValue(row[keyCcm3]) : 0;
            const adm = keyAdmon ? this.plcsService.parsePlcValue(row[keyAdmon]) : 0;
            const potGen = keyPotGen ? this.plcsService.parsePlcValue(row[keyPotGen]) : 0;
            const isbl = ft;
            const u520 = u520_val;
            const z700 = ccm1;
            const z800 = ccm2;
            const torre = ccm3;

            // ── Acumular por día ──
            const ex = mapaEnergia.get(fecha) || {
              cg: createTracker(), potGen: createTracker(), isbl: createTracker(), u520: createTracker(),
              z700: createTracker(), z800: createTracker(), torre: createTracker(), admon: createTracker()
            };
            trackVal(ex.cg, cg);
            trackVal(ex.potGen, potGen);
            trackVal(ex.isbl, isbl);
            trackVal(ex.u520, u520);
            trackVal(ex.z700, z700);
            trackVal(ex.z800, z800);
            trackVal(ex.torre, torre);
            trackVal(ex.admon, adm);
            mapaEnergia.set(fecha, ex);

            // ── Acumular por hora (para gráfica horaria FOCO) ──
            const hh = date.getUTCHours().toString().padStart(2, '0');
            if (!mapaEnergiaHorariaTracker.has(fecha)) mapaEnergiaHorariaTracker.set(fecha, []);
            const horasDelDia = mapaEnergiaHorariaTracker.get(fecha)!;
            let horaEntry = horasDelDia.find(e => e.hora === hh);
            if (!horaEntry) {
              horaEntry = { hora: hh, cg: createTracker(), label: `${hh}:00` };
              horasDelDia.push(horaEntry);
            }
            trackVal(horaEntry.cg, cg);
          });

          // Convertir trackers a valores finales (Deltas)
          const mapaEnergiaHorariaFinal = new Map<string, {hora: string; cg: number; label: string}[]>();
          mapaEnergiaHorariaTracker.forEach((horas, fecha) => {
            horas.sort((a, b) => a.hora.localeCompare(b.hora));
            mapaEnergiaHorariaFinal.set(fecha, horas.map(h => ({
              hora: h.hora, label: h.label, cg: getDelta(h.cg)
            })));
          });
          
          this.mapaEnergiaHoraria = mapaEnergiaHorariaFinal;
          this.diasDisponiblesEnergia = [...mapaEnergiaHorariaFinal.keys()].sort();
          if (!this.selectedDia || !mapaEnergiaHorariaFinal.has(this.selectedDia)) {
            this.selectedDia = this.diasDisponiblesEnergia[this.diasDisponiblesEnergia.length - 1] || '';
          }

          // ── Mapa B100 por fecha ──
          const mapaB100 = new Map<string, number>();
          (b100Mes.dailyData || []).forEach((d: any) => mapaB100.set(d.date, d.produccion));

          // ── Unir por fecha ──
          const todasFechas = [...new Set([...mapaEnergia.keys(), ...mapaB100.keys()])].sort();

          this.datosDiariosEnergia = todasFechas.map(fecha => {
            const [y, m, d] = fecha.split('-');
            const entry = mapaEnergia.get(fecha);
            
            const cg = entry ? Number(getDelta(entry.cg).toFixed(2)) : 0;
            const potGen = entry ? Number(getAvg(entry.potGen).toFixed(2)) : 0;
            const isbl = entry ? Number(getDelta(entry.isbl).toFixed(2)) : 0;
            const u520 = entry ? Number(getDelta(entry.u520).toFixed(2)) : 0;
            const z700 = entry ? Number(getDelta(entry.z700).toFixed(2)) : 0;
            const z800 = entry ? Number(getDelta(entry.z800).toFixed(2)) : 0;
            const torre = entry ? Number(getDelta(entry.torre).toFixed(2)) : 0;
            const admon = entry ? Number(getDelta(entry.admon).toFixed(2)) : 0;
            const osbl = Math.max(0, Number((cg - (isbl + u520 + z700 + z800 + torre + admon)).toFixed(2)));

            const b100 = Number((mapaB100.get(fecha) || 0).toFixed(2));
            // Indicador FOCO = KWh / Ton B100 producida
            const foco = b100 > 0 ? Number((cg / b100).toFixed(2)) : 0;
            const focoStatus: 'ok' | 'desviacion' | 'sin-dato' =
              b100 === 0 ? 'sin-dato' : foco <= this.energiaMeta ? 'ok' : 'desviacion';

            return {
              fecha, etiqueta: `${d}/${m}`,
              totalEnergia: cg, osbl, potGen, isbl, u520, z700, z800, torre, admon,
              tonB100: b100, foco, focoStatus
            };
          });

          console.log("⚡ [Energía] datosDiariosEnergia procesados:", this.datosDiariosEnergia);

          // Días con desviación
          this.diasConDesviacionEnergia = this.datosDiariosEnergia.filter(d => d.focoStatus === 'desviacion');

          // ── KPIs ──
          const totalEnergiaMes = this.datosDiariosEnergia.reduce((s: number, d: any) => s + d.totalEnergia, 0);
          const totalB100Mes  = b100Mes.totalProduction || 0;
          const focosValidos  = this.datosDiariosEnergia.filter((d: any) => d.foco > 0).map((d: any) => d.foco);

          // KPI anual: calcular delta (max - min) energía año completo
          let minCgAnual = Number.MAX_VALUE;
          let maxCgAnual = -Number.MAX_VALUE;
          sensorData.forEach((row: any) => {
            const rawFecha = fechaKey ? row[fechaKey] : null;
            if (!rawFecha) return;
            if (new Date(rawFecha).getUTCFullYear().toString() !== this.selectedYear) return;
            if (keyEnergia) {
              const val = this.plcsService.parsePlcValue(row[keyEnergia]);
              if (val > 0) {
                if (val < minCgAnual) minCgAnual = val;
                if (val > maxCgAnual) maxCgAnual = val;
              }
            }
          });
          const totalEnergiaAnio = (minCgAnual !== Number.MAX_VALUE && maxCgAnual >= minCgAnual) ? (maxCgAnual - minCgAnual) : 0;

          // Calcular total producción B100 del año actual
          const totalB100Anio = (b100Historico.dailyData || [])
            .filter((d: any) => d.date.startsWith(this.selectedYear))
            .reduce((sum: number, d: any) => sum + d.produccion, 0);

          this.energiaKpis = {
            ultimoDia: focosValidos.length ? focosValidos[focosValidos.length - 1] : null,
            mensual:   totalB100Mes  > 0 ? Number((totalEnergiaMes  / totalB100Mes).toFixed(2))  : null,
            anual:     totalB100Anio > 0 ? Number((totalEnergiaAnio / totalB100Anio).toFixed(2)) : null,
            totalEnergiaMes, totalB100Mes,
            totalEnergiaAnio: Number(totalEnergiaAnio.toFixed(2)),
            totalB100Anio,
            meta: this.energiaMeta
          };

          this.buildEnergiaCharts();
        }

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error cargando datos:', err);
        this.cargando = false;
        this.cdr.detectChanges();
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
      plugins: { legend: { position: 'top' } }
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
        tooltip: {
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
      plugins: { legend: { position: 'top' } }
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

    // 1. Consumo Total Eléctrico / Ton B100 (División diaria = kWh/Ton)
    this.energiaTotalVsB100Data = {
      labels,
      datasets: [
        {
          label: 'energia / Ton B100 (kWh/Ton)',
          data: foco,
          borderColor: '#27ae60', backgroundColor: 'rgba(39,174,96,0.07)',
          borderWidth: 2.5, pointRadius: 5, pointHoverRadius: 8,
          pointBackgroundColor: '#ffffff', pointBorderColor: '#27ae60', pointBorderWidth: 2,
          fill: true, tension: 0.3
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
    // foco hora = kWh de esa hora / Ton B100 total del día
    const focoHora = horas.map(h =>
      b100Dia > 0 ? Number((h.cg / b100Dia).toFixed(2)) : 0
    );
    const colores = focoHora.map(v =>
      v === 0 ? '#bdc3c7' : v <= this.energiaMeta ? '#27ae60' : '#e74c3c'
    );

    this.energiaFocoLineaData = {
      labels,
      datasets: [
        {
          label: `FOCO ${d}/${m}/${y} — kWh/Ton B100`,
          data: focoHora,
          borderColor: '#27ae60', backgroundColor: 'rgba(39,174,96,0.06)',
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
    this.cdr.detectChanges();
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
      plugins: { legend: { position: 'top' } }
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
    this.focoOptions = dualLineOptions('kg vapor / Ton B100', 'Ton B100');
  }
}
