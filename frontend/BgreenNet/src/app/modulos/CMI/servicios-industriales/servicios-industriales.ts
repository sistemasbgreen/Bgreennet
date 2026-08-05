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

  energiaTotalVsB100Data: ChartData<'line'> = { labels: [], datasets: [] };
  energiaFocoLineaData: ChartData<'line'> = { labels: [], datasets: [] };
  energiaB100BarrasData: ChartData<'bar'> = { labels: [], datasets: [] };
  energiaComportamientoMultiData: ChartData<'line'> = { labels: [], datasets: [] };

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
    const hoy = new Date();
    const fechaFinAnio = hoy.getFullYear().toString() === this.selectedYear
      ? hoy.toISOString().split('T')[0]
      : `${this.selectedYear}-12-31`;
    const anioInicio = `${this.selectedYear}-01-01`;
    const mesKey  = `${this.selectedYear}-${this.selectedMonth}`;
    const anioKey = this.selectedYear;

    this.getBaseRequest().pipe(
      switchMap(req => {
        // ── FASE 1: solo datos mensuales (rápidos) ──
        const b100Mes$ = this.b100MesCache.has(mesKey)
          ? of(this.b100MesCache.get(mesKey))
          : this.cmiplantaService.obtenerDatos({ ...(req as any), startDate: fechaInicio, endDate: fechaFin }).pipe(
              map((d: any) => { this.b100MesCache.set(mesKey, d); return d; }),
              catchError(() => of({ totalProduction: 0 }))
            );

        const sensorMes$ = this.sensorCache.has(`vapor-${mesKey}`)
          ? of(this.sensorCache.get(`vapor-${mesKey}`))
          : this.plcsService.getVapor(fechaInicio, fechaFin).pipe(
              map((d: any) => { this.sensorCache.set(`vapor-${mesKey}`, d); return d; }),
              catchError(() => of([]))
            );

        const energiaMes$ = this.sensorCache.has(`energia-${mesKey}`)
          ? of(this.sensorCache.get(`energia-${mesKey}`))
          : this.plcsService.getEnergia(fechaInicio, fechaFin).pipe(
              map((d: any) => { this.sensorCache.set(`energia-${mesKey}`, d); return d; }),
              catchError(() => of([]))
            );

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
            : this.plcsService.getVaporTotalAnio(this.selectedYear).pipe(
                map((d: any) => { this.sensorAnioCache.set(`vapor-${anioKey}`, d); return d; }),
                catchError(() => of(null))
              ),
          energiaAnual: this.sensorAnioCache.has(`energia-${anioKey}`)
            ? of(this.sensorAnioCache.get(`energia-${anioKey}`))
            : this.plcsService.getEnergiaTotalAnio(this.selectedYear).pipe(
                map((d: any) => { this.sensorAnioCache.set(`energia-${anioKey}`, d); return d; }),
                catchError(() => of(null))
              )
        }).pipe(takeUntil(this.destroy$)).subscribe((anual: any) => {
          (this as any).procesarDatosAnuales(anual.b100Anio, anual.vaporAnual, true);
          (this as any).procesarDatosAnuales(anual.b100Anio, anual.energiaAnual, false);
          this.cdr.detectChanges();
        });

        return forkJoin({ b100Mes: b100Mes$, vaporMes: sensorMes$, energiaMes: energiaMes$ });
      }),
      takeUntil(this.destroy$)
    ).subscribe((res: any) => {
       if (!res) { this.cargando = false; return; }

       // Procesar Vapor mensual
       let totalVaporMes = 0;
       res.vaporMes.forEach((row: any) => {
         totalVaporMes += this.plcsService.parsePlcValue(row['1100FTSG12']);
       });
       const totalB100Mes = res.b100Mes?.totalProduction || 0;
       this.kpis.totalVaporMes = totalVaporMes;
       this.kpis.totalB100Mes = totalB100Mes;
       this.kpis.focoMensual = totalB100Mes > 0 ? Number((totalVaporMes / totalB100Mes).toFixed(2)) : 0;

       // Procesar Energía mensual
       const energiaMensualMap = new Map<string, {min: number, max: number}>();
       res.energiaMes.forEach((row: any) => {
         const rawFecha = row.FechaRegistro || row.timestamp || row.fecharegistro;
         if (!rawFecha) return;
         const fecha = new Date(rawFecha).toISOString().split('T')[0];
         const cg = this.plcsService.parsePlcValue(row['ENERGIA'] || row['energia']) / 10;
         if (cg > 0) {
           if (!energiaMensualMap.has(fecha)) energiaMensualMap.set(fecha, {min: Number.MAX_VALUE, max: -Number.MAX_VALUE});
           const dia = energiaMensualMap.get(fecha)!;
           if (cg < dia.min) dia.min = cg;
           if (cg > dia.max) dia.max = cg;
         }
       });
       let totalEnergiaMes = 0;
       energiaMensualMap.forEach(dia => {
         if (dia.max >= dia.min) totalEnergiaMes += (dia.max - dia.min);
       });
       this.energiaKpis.totalEnergiaMes = totalEnergiaMes;
       this.energiaKpis.totalB100Mes = totalB100Mes;
       this.energiaKpis.mensual = totalB100Mes > 0 ? Number((totalEnergiaMes / totalB100Mes).toFixed(2)) : 0;

       this.cargando = false;
       this.cdr.detectChanges();
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
    const fechaFinAnio = hoy.getFullYear().toString() === this.selectedYear
      ? hoy.toISOString().split('T')[0]
      : `${this.selectedYear}-12-31`;

    this.getBaseRequest().pipe(
      switchMap(baseRequest => {
        const isVapor = this.selectedServicio === 'vapor';
        const emptyB100Response = { dailyData: [], totalProduction: 0, totalConsumption: 0, monthlyAccumulated: 0, validDays: 0 };
        const anioInicio = `${this.selectedYear}-01-01`;
        const mesKey    = `${this.selectedYear}-${this.selectedMonth}`;
        const anioKey   = this.selectedYear;
        const svcKey    = isVapor ? 'vapor' : 'energia';

        // ── Datos mensuales sensor — con caché ──
        const cacheKey = `${svcKey}-${mesKey}`;
        const sensorData$ = this.sensorCache.has(cacheKey)
          ? of(this.sensorCache.get(cacheKey))
          : isVapor
            ? this.plcsService.getVapor(fechaInicio, fechaFin).pipe(
                map((data: any[]) => { this.sensorCache.set(cacheKey, data); return data; }),
                catchError(() => of([]))
              )
            : this.plcsService.getEnergia(fechaInicio, fechaFin).pipe(
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
              ? this.plcsService.getVaporTotalAnio(this.selectedYear).pipe(
                  map((d: any) => { this.sensorAnioCache.set(sensorAnioKey, d); return d; }),
                  catchError(() => of(null))
                )
              : this.plcsService.getEnergiaTotalAnio(this.selectedYear).pipe(
                  map((d: any) => { this.sensorAnioCache.set(sensorAnioKey, d); return d; }),
                  catchError(() => of(null))
                )
        }).pipe(takeUntil(this.destroy$)).subscribe(({ b100Anio, sensorAnual }: any) => {
          (this as any).procesarDatosAnuales(b100Anio, sensorAnual, isVapor);
          this.cdr.detectChanges();
        });

        return forkJoin({ sensorData: sensorData$, b100Mes: b100Mes$ });
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ sensorData, b100Mes }: any) => {
        const isVapor = this.selectedServicio === 'vapor';

        if (isVapor) {
          // ── Un solo recorrido: labels por minuto + agrupado por día ──
          const labelsMinuto: string[] = [];
          const isblMinuto: number[] = [];
          const zona700Minuto: number[] = [];
          const mapaVapor = new Map<string, { tv: number; isbl: number; z700: number }>();

          for (const row of sensorData) {
            if (!row.FechaRegistro) continue;
            const date = new Date(row.FechaRegistro);
            const rowYear  = date.getFullYear().toString();
            const rowMonth = (date.getMonth() + 1).toString().padStart(2, '0');
            if (rowYear !== this.selectedYear || rowMonth !== this.selectedMonth) continue;

            const v1 = this.plcsService.parsePlcValue(row['1100FTSG11']);
            const v2 = this.plcsService.parsePlcValue(row['550FT04']);
            const v3 = this.plcsService.parsePlcValue(row['1100FTSG12']);

            // Labels por minuto
            const hh = date.getHours().toString().padStart(2, '0');
            const mm = date.getMinutes().toString().padStart(2, '0');
            const dd = date.getDate().toString().padStart(2, '0');
            labelsMinuto.push(`${dd}/${rowMonth} ${hh}:${mm}`);
            isblMinuto.push(Number((v1 - v2).toFixed(2)));
            zona700Minuto.push(Number((v3 - v1).toFixed(2)));

            // Agrupado por día
            const fecha = `${rowYear}-${rowMonth}-${date.getDate().toString().padStart(2, '0')}`;
            const ex = mapaVapor.get(fecha);
            if (ex) {
              ex.tv   += v3;
              ex.isbl += (v1 - v2);
              ex.z700 += (v3 - v1);
            } else {
              mapaVapor.set(fecha, { tv: v3, isbl: v1 - v2, z700: v3 - v1 });
            }
          }

          const mapaB100 = new Map<string, number>();
          (b100Mes.dailyData || []).forEach((d: any) => mapaB100.set(d.date, d.produccion));

          const todasFechas = [...new Set([...mapaVapor.keys(), ...mapaB100.keys()])].sort();

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

          // Asignar el valor del día anterior a hoy para evitar N/D
          const hoy = new Date();
          const ayer = new Date(hoy);
          ayer.setDate(hoy.getDate() - 1);
          const ayerStr = `${ayer.getFullYear()}-${(ayer.getMonth() + 1).toString().padStart(2, '0')}-${ayer.getDate().toString().padStart(2, '0')}`;
          
          const datoAyer = this.datosDiarios.find(d => d.fecha === ayerStr);
          if (datoAyer && datoAyer.tonB100 > 0 && datoAyer.totalVapor > 0) {
            this.kpis.focoUltimoDia = datoAyer.foco;
          } else {
            // Fallback al último de la lista que tenga producción
            const validosVapor = this.datosDiarios.filter(d => d.tonB100 > 0);
            this.kpis.focoUltimoDia = validosVapor.length > 0 ? validosVapor[validosVapor.length - 1].foco : null;
          }

          const totalVaporMes = this.datosDiarios.reduce((s, d) => s + d.totalVapor, 0);
          const totalB100Mes  = b100Mes.totalProduction || 0;
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
          this.diasDisponiblesEnergia = [...mapaEnergiaHorariaFinal.keys()].sort();
          if (!this.selectedDia || !this.diasDisponiblesEnergia.includes(this.selectedDia)) {
            const hoy = new Date();
            const hoyStr = `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, '0')}-${hoy.getDate().toString().padStart(2, '0')}`;
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

          const todasFechas = [...new Set([...mapaEnergiaOriginal.keys(), ...mapaB100.keys()])].sort();

          const calc = (v: {min: number, max: number} | undefined) => {
            if (!v || v.max === -Number.MAX_VALUE) return 0;
            return v.max >= v.min ? Number((v.max - v.min).toFixed(2)) : 0;
          };

          this.datosDiariosEnergia = todasFechas.map(fecha => {
            const [y, m, d] = fecha.split('-');
            const entry = mapaEnergiaOriginal.get(fecha);
            const cg    = calc(entry?.cg);
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
            console.log(`Consumo Eléctrico (energia) / Ton B100 producida [${fecha}]: Energía=${cg} kWh, B100=${b100} Ton => FOCO=${foco}`);
            return { fecha, etiqueta: `${d}/${m}`, totalEnergia: cg, osbl, potGen, isbl, u520, z700, z800, torre, admon, tonB100: b100, foco, focoStatus };
          });

          this.diasConDesviacionEnergia = this.datosDiariosEnergia.filter(d => d.focoStatus === 'desviacion');

          // Asignar el valor del día anterior a hoy para evitar N/D en Energía
          const hoyEnergia = new Date();
          const ayerEnergia = new Date(hoyEnergia);
          ayerEnergia.setDate(hoyEnergia.getDate() - 1);
          const ayerStrEnergia = `${ayerEnergia.getFullYear()}-${(ayerEnergia.getMonth() + 1).toString().padStart(2, '0')}-${ayerEnergia.getDate().toString().padStart(2, '0')}`;

          const datoAyerEnergia = this.datosDiariosEnergia.find(d => d.fecha === ayerStrEnergia);
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
          const totalB100Mes  = b100Mes.totalProduction || 0;
          this.energiaKpis.totalEnergiaMes = totalEnergiaMes;
          this.energiaKpis.totalB100Mes = totalB100Mes;
          this.energiaKpis.mensual = totalB100Mes > 0 ? Number((totalEnergiaMes / totalB100Mes).toFixed(2)) : 0;

          this.buildEnergiaCharts();
        }

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
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
    const focoHora = horas.map(h => {
      const focoH = b100Dia > 0 ? Number((h.cg / b100Dia).toFixed(2)) : 0;
      console.log(`Tendencia FOCO Diario Hora a Hora [${this.selectedDia} ${h.label}]: VALORES: MAX(${h.max}) - MIN(${h.min}) => Energía Hora=${h.cg} kWh, B100 Total Día=${b100Dia} Ton => FOCO Hora=${focoH}`);
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
    this.focoOptions = dualLineOptions('kg vapor / Ton B100', 'Ton B100');
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
