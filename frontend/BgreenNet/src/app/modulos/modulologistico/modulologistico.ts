import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogisticoService, TransporteItem } from '../../servicios/LogisticoService';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-modulologistico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modulologistico.html',
  styleUrl: './modulologistico.css',
})
export class Modulologistico implements OnInit, OnDestroy {
  // Filtros de búsqueda requeridos
  companyId: string = '900715610';
  startFecha: string = '';
  endFecha: string = '';
  searchQuery: string = '';
  filtroEstado: string = 'TODOS';

  // Estados del componente
  loading: boolean = false;
  error: boolean = false;
  errorMessage: string = '';
  ultimaActualizacion: Date | null = null;

  // Datos
  transportes: TransporteItem[] = [];
  selectedTransport: TransporteItem | null = null;
  showDetailModal: boolean = false;

  // Paginación
  paginaActual: number = 1;
  elementosPorPagina: number = 12;

  constructor(
    private logisticoSvc: LogisticoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const hoy = new Date();

    this.companyId = localStorage.getItem('LOGISTICO_COMPANY_ID') || '900715610';
    this.endFecha = hoy.toISOString().split('T')[0];
    this.startFecha = hoy.toISOString().split('T')[0];

    this.cargarTransportes();
  }

  cargarTransportes(): void {
    const savedCompanyId = localStorage.getItem('LOGISTICO_COMPANY_ID');
    if (savedCompanyId && savedCompanyId.trim()) {
      this.companyId = savedCompanyId.trim();
    }

    if (!this.companyId || !this.companyId.trim()) {
      this.companyId = '900715610';
    }

    if (this.startFecha && this.endFecha && this.endFecha < this.startFecha) {
      alert('La fecha final no puede ser menor a la fecha inicial.');
      return;
    }

    this.loading = true;
    this.error = false;
    this.errorMessage = '';

    this.logisticoSvc.getTransportes(this.companyId.trim(), this.startFecha, this.endFecha).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.ultimaActualizacion = new Date();
        this.paginaActual = 1;
        this.transportes = this.normalizarRespuesta(res);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar transportes:', err);
        this.loading = false;
        this.error = true;
        this.errorMessage = err?.error?.detalle || err?.error?.error || err?.message || 'No fue posible conectarse con la API de transportes TBS.';
        this.cdr.detectChanges();
      }
    });
  }

  private normalizarRespuesta(res: any): TransporteItem[] {
    if (!res) return [];

    let rawList: any[] = [];
    if (Array.isArray(res)) {
      rawList = res;
    } else if (res && Array.isArray(res.data)) {
      rawList = res.data;
    } else if (res && Array.isArray(res.transports)) {
      rawList = res.transports;
    } else if (res && Array.isArray(res.items)) {
      rawList = res.items;
    } else if (typeof res === 'object') {
      rawList = Object.values(res).filter(item => typeof item === 'object' && item !== null);
    }

    return rawList.map((item, index) => {
      const copy: TransporteItem = { ...item };
      const idVal = item.transport_id || item.id || item.code || (index + 1);
      const plateVal = item.vehicle_plate || item.placa || item.plate || 'N/A';
      const supplier = item.supplier_name || item.origen || item.origin || 'N/A';
      const company = item.company_name || item.destino || item.destination || 'BGREEN S.A.S.';
      const operacion = item.input_output || item.estado || item.status || 'Registrado';
      const dateVal = item.starting_date ? `${item.starting_date} ${item.starting_time || ''}`.trim() : (item.fecha || 'N/A');
      const prodVal = item.products || item.producto || 'N/A';

      const pIni = Number(item.starting_weight_value) || 0;
      const pFin = Number(item.ending_weight_value) || 0;

      const rawIni = item['starting_time'] || item['starting_time_value'] || item['hora_inicio'] || item['horaInicio'];
      const rawFin = item['end_time'] || item['ending_time'] || item['end_time_value'] || item['hora_fin'] || item['horaFin'];

      const hIni = this.formatTime(rawIni);
      const hFin = this.formatTime(rawFin);
      const dur = (hIni !== '—' && hFin !== '—') ? this.calcularDuracion(hIni, hFin) : '—';

      copy['id'] = idVal;
      copy['placa'] = plateVal;
      copy['conductor'] = item.driver_name || item.conductor || item.driver || 'N/A';
      copy['origen'] = supplier;
      copy['destino'] = company;
      copy['estado'] = operacion;
      copy['fecha'] = dateVal;
      copy['guia'] = item.guia || item.remision || item.document_number || `TRP-${idVal}`;
      copy['producto'] = prodVal;
      copy['pesoInicial'] = pIni;
      copy['pesoFinal'] = pFin;
      copy['pesoNeto'] = Math.abs(pFin - pIni);
      copy['horaInicio'] = hIni;
      copy['horaFin'] = hFin;
      copy['duracion'] = dur;

      return copy;
    });
  }

  private formatTime(raw: any): string {
    if (!raw || raw === 'N/A' || raw === '—') return '—';
    const str = String(raw).trim();
    if (str.includes(' ')) {
      const parts = str.split(' ');
      const timePart = parts[parts.length - 1];
      if (timePart && timePart.includes(':')) return this.formatTime(timePart);
    }
    const parts = str.split(':');
    if (parts.length >= 2) {
      const h = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      return `${h}:${m}`;
    }
    return str;
  }

  private calcularDuracion(inicioStr: string, finStr: string): string {
    try {
      const parseTime = (t: string) => {
        const parts = String(t).split(':').map(Number);
        return (parts[0] || 0) * 60 + (parts[1] || 0);
      };
      const m1 = parseTime(inicioStr);
      const m2 = parseTime(finStr);
      let diff = m2 - m1;
      if (diff < 0) diff += 24 * 60;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      if (h === 0) return `${m} min`;
      return `${h}h ${m}m`;
    } catch (e) {
      return '—';
    }
  }

  limpiarFiltros(): void {
    const hoy = new Date();

    this.companyId = '900715610';
    this.endFecha = hoy.toISOString().split('T')[0];
    this.startFecha = hoy.toISOString().split('T')[0];
    this.searchQuery = '';
    this.filtroEstado = 'TODOS';
    this.cargarTransportes();
  }

  // Getters para filtrado y estadísticas
  get transportesFiltrados(): TransporteItem[] {
    const q = this.searchQuery.trim().toLowerCase();

    return this.transportes.filter(t => {
      // Filtro de estado / operación
      if (this.filtroEstado !== 'TODOS') {
        const estStr = String(t.estado || '').toLowerCase();
        if (!estStr.includes(this.filtroEstado.toLowerCase())) {
          return false;
        }
      }

      // Buscador general por texto
      if (!q) return true;

      const searchableText = [
        t.id,
        t.placa,
        t.conductor,
        t.origen,
        t.destino,
        t.estado,
        t.guia,
        t.fecha,
        t.producto
      ].filter(Boolean).join(' ').toLowerCase();

      return searchableText.includes(q);
    });
  }

  get totalRegistros(): number {
    return this.transportes.length;
  }

  get placasUnicas(): number {
    const set = new Set(this.transportes.map(t => t.placa).filter(p => p && p !== 'N/A'));
    return set.size;
  }

  get conductoresUnicos(): number {
    const set = new Set(this.transportes.map(t => t.conductor).filter(c => c && c !== 'N/A'));
    return set.size;
  }

  get totalPesoNeto(): number {
    return this.transportesFiltrados.reduce((sum, t) => sum + (Number(t['pesoNeto']) || 0), 0);
  }

  get listaEstados(): string[] {
    const set = new Set(this.transportes.map(t => String(t.estado || 'Registrado').toUpperCase()));
    return Array.from(set);
  }

  // ===== NUEVOS INDICADORES =====

  get totalEntradas(): number {
    return this.transportes.filter(t => {
      const io = String(t.input_output || t.estado || '').toLowerCase();
      return io.includes('entrada') || io.includes('input') || io.includes('in');
    }).length;
  }

  get totalSalidas(): number {
    return this.transportes.filter(t => {
      const io = String(t.input_output || t.estado || '').toLowerCase();
      return io.includes('salida') || io.includes('output') || io.includes('out');
    }).length;
  }

  get materiaPrimaIngresada(): number {
    return this.transportes
      .filter(t => {
        const io = String(t.input_output || t.estado || '').toLowerCase();
        return io.includes('entrada') || io.includes('input') || io.includes('in');
      })
      .reduce((sum, t) => sum + (Number(t['pesoNeto']) || 0), 0) / 1000;
  }

  get vehiculosEntrada(): number {
    const set = new Set(
      this.transportes
        .filter(t => {
          const io = String(t.input_output || t.estado || '').toLowerCase();
          return io.includes('entrada') || io.includes('input') || io.includes('in');
        })
        .map(t => t.placa)
        .filter(p => p && p !== 'N/A')
    );
    return set.size;
  }

  get productoDespachadoTon(): number {
    return this.transportes
      .filter(t => {
        const io = String(t.input_output || t.estado || '').toLowerCase();
        return io.includes('salida') || io.includes('output') || io.includes('out');
      })
      .reduce((sum, t) => sum + (Number(t['pesoNeto']) || 0), 0) / 1000;
  }

  get vehiculosSalida(): number {
    const set = new Set(
      this.transportes
        .filter(t => {
          const io = String(t.input_output || t.estado || '').toLowerCase();
          return io.includes('salida') || io.includes('output') || io.includes('out');
        })
        .map(t => t.placa)
        .filter(p => p && p !== 'N/A')
    );
    return set.size;
  }

  get vehiculosEntradaFrecuencia(): { placa: string; conductor: string; conteo: number; horaInicio: string; horaFin: string; duracion: string }[] {
    const map = new Map<string, { conductor: string; conteo: number; horaInicio: string; horaFin: string; duracion: string }>();

    for (const t of this.transportes) {
      const io = String(t.input_output || t.estado || '').toLowerCase();
      const isEntrada = io.includes('entrada') || io.includes('input') || io.includes('in');
      if (isEntrada) {
        const placa = String(t['placa'] || 'N/A').toUpperCase().trim();
        const conductor = String(t['conductor'] || t['driver'] || t['driver_name'] || 'N/A').trim();
        const horaInicio = String(t['horaInicio'] || '—');
        const horaFin = String(t['horaFin'] || '—');
        const duracion = String(t['duracion'] || '—');

        if (!map.has(placa)) {
          map.set(placa, { conductor, conteo: 0, horaInicio, horaFin, duracion });
        }
        const item = map.get(placa)!;
        item.conteo++;
        if ((item.conductor === 'N/A' || !item.conductor) && conductor && conductor !== 'N/A') {
          item.conductor = conductor;
        }
        if (item.horaInicio === '—' && horaInicio !== '—') item.horaInicio = horaInicio;
        if (item.horaFin === '—' && horaFin !== '—') item.horaFin = horaFin;
        if (item.duracion === '—' && duracion !== '—') item.duracion = duracion;
      }
    }

    return Array.from(map.entries())
      .map(([placa, data]) => ({
        placa,
        conductor: data.conductor,
        conteo: data.conteo,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        duracion: data.duracion
      }))
      .sort((a, b) => b.conteo - a.conteo);
  }

  get vehiculosSalidaFrecuencia(): { placa: string; conductor: string; conteo: number; horaInicio: string; horaFin: string; duracion: string }[] {
    const map = new Map<string, { conductor: string; conteo: number; horaInicio: string; horaFin: string; duracion: string }>();

    for (const t of this.transportes) {
      const io = String(t.input_output || t.estado || '').toLowerCase();
      const isSalida = io.includes('salida') || io.includes('output') || io.includes('out');
      if (isSalida) {
        const placa = String(t['placa'] || 'N/A').toUpperCase().trim();
        const conductor = String(t['conductor'] || t['driver'] || t['driver_name'] || 'N/A').trim();
        const horaInicio = String(t['horaInicio'] || '—');
        const horaFin = String(t['horaFin'] || '—');
        const duracion = String(t['duracion'] || '—');

        if (!map.has(placa)) {
          map.set(placa, { conductor, conteo: 0, horaInicio, horaFin, duracion });
        }
        const item = map.get(placa)!;
        item.conteo++;
        if ((item.conductor === 'N/A' || !item.conductor) && conductor && conductor !== 'N/A') {
          item.conductor = conductor;
        }
        if (item.horaInicio === '—' && horaInicio !== '—') item.horaInicio = horaInicio;
        if (item.horaFin === '—' && horaFin !== '—') item.horaFin = horaFin;
        if (item.duracion === '—' && duracion !== '—') item.duracion = duracion;
      }
    }

    return Array.from(map.entries())
      .map(([placa, data]) => ({
        placa,
        conductor: data.conductor,
        conteo: data.conteo,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        duracion: data.duracion
      }))
      .sort((a, b) => b.conteo - a.conteo);
  }

  get resumenPorProducto(): {
    producto: string;
    tipo: string;
    pesoTon: number;
    operaciones: number;
    proveedoresClientes: { nombre: string; operaciones: number; pesoTon: number; porcentaje: number }[];
  }[] {
    const map = new Map<string, {
      tipo: string;
      peso: number;
      count: number;
      entities: Map<string, { count: number; peso: number }>;
    }>();

    for (const t of this.transportes) {
      const prod = String(t['producto'] || t['products'] || 'Sin producto').toUpperCase().trim();
      const io = String(t['input_output'] || t['estado'] || '').toLowerCase();
      const isEntrada = io.includes('entrada') || io.includes('input') || io.includes('in');
      const tipo = isEntrada ? 'Entrada' : 'Salida';

      if (!map.has(prod)) {
        map.set(prod, { tipo, peso: 0, count: 0, entities: new Map() });
      }
      const entry = map.get(prod)!;
      const pesoNeto = Number(t['pesoNeto']) || 0;
      entry.peso += pesoNeto;
      entry.count++;

      const entityName = isEntrada
        ? String(t['supplier_name'] || t['origen'] || '').trim()
        : String(t['company_name'] || t['destino'] || '').trim();

      if (entityName && entityName !== 'N/A' && entityName !== '') {
        if (!entry.entities.has(entityName)) {
          entry.entities.set(entityName, { count: 0, peso: 0 });
        }
        const entityData = entry.entities.get(entityName)!;
        entityData.count++;
        entityData.peso += pesoNeto;
      }
    }

    return Array.from(map.entries())
      .map(([producto, data]) => {
        const totalTon = data.peso / 1000;
        return {
          producto,
          tipo: data.tipo,
          pesoTon: totalTon,
          operaciones: data.count,
          proveedoresClientes: Array.from(data.entities.entries())
            .map(([nombre, eData]) => {
              const eTon = eData.peso / 1000;
              const pct = totalTon > 0 ? Math.round((eTon / totalTon) * 100) : 0;
              return {
                nombre,
                operaciones: eData.count,
                pesoTon: eTon,
                porcentaje: pct
              };
            })
            .sort((a, b) => b.pesoTon - a.pesoTon)
        };
      })
      .sort((a, b) => b.pesoTon - a.pesoTon);
  }

  get resumenEmpresas(): {
    nombre: string;
    entradasOps: number;
    entradasTon: number;
    salidasOps: number;
    salidasTon: number;
    totalOps: number;
    totalTon: number;
    placas: string[];
    productos: string[];
  }[] {
    const map = new Map<string, {
      entradasOps: number;
      entradasPeso: number;
      salidasOps: number;
      salidasPeso: number;
      placas: Set<string>;
      productos: Set<string>;
    }>();

    for (const t of this.transportes) {
      const io = String(t['input_output'] || t['estado'] || '').toLowerCase();
      const isEntrada = io.includes('entrada') || io.includes('input') || io.includes('in');
      const pesoNeto = Number(t['pesoNeto']) || 0;
      const placa = String(t['placa'] || '').toUpperCase().trim();
      const prod = String(t['producto'] || t['products'] || '').toUpperCase().trim();

      const entityName = isEntrada
        ? String(t['supplier_name'] || t['origen'] || '').trim()
        : String(t['company_name'] || t['destino'] || '').trim();

      if (!entityName || entityName === 'N/A') continue;

      if (!map.has(entityName)) {
        map.set(entityName, {
          entradasOps: 0,
          entradasPeso: 0,
          salidasOps: 0,
          salidasPeso: 0,
          placas: new Set(),
          productos: new Set()
        });
      }

      const e = map.get(entityName)!;
      if (isEntrada) {
        e.entradasOps++;
        e.entradasPeso += pesoNeto;
      } else {
        e.salidasOps++;
        e.salidasPeso += pesoNeto;
      }
      if (placa && placa !== 'N/A') e.placas.add(placa);
      if (prod && prod !== 'N/A') e.productos.add(prod);
    }

    const q = this.empresaSearchQuery.trim().toLowerCase();

    return Array.from(map.entries())
      .map(([nombre, data]) => ({
        nombre,
        entradasOps: data.entradasOps,
        entradasTon: data.entradasPeso / 1000,
        salidasOps: data.salidasOps,
        salidasTon: data.salidasPeso / 1000,
        totalOps: data.entradasOps + data.salidasOps,
        totalTon: (data.entradasPeso + data.salidasPeso) / 1000,
        placas: Array.from(data.placas),
        productos: Array.from(data.productos)
      }))
      .filter(item => !q || item.nombre.toLowerCase().includes(q) || item.productos.some(p => p.toLowerCase().includes(q)))
      .sort((a, b) => b.totalTon - a.totalTon);
  }

  // Estado modal empresas y gráfica
  showEmpresasModal: boolean = false;
  empresaSearchQuery: string = '';
  empresasViewMode: 'chart' | 'table' = 'chart';
  empresasChartType: 'bar' | 'horizontalBar' | 'doughnut' = 'bar';
  private chartInstance: any = null;

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  abrirModalEmpresas(): void {
    this.showEmpresasModal = true;
    this.renderEmpresasChart();
  }

  cerrarModalEmpresas(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
    this.showEmpresasModal = false;
  }

  setEmpresasViewMode(mode: 'chart' | 'table'): void {
    this.empresasViewMode = mode;
    if (mode === 'chart') {
      this.renderEmpresasChart();
    }
  }

  setEmpresasChartType(type: 'bar' | 'horizontalBar' | 'doughnut'): void {
    this.empresasChartType = type;
    this.renderEmpresasChart();
  }

  renderEmpresasChart(): void {
    if (this.empresasViewMode !== 'chart') return;

    setTimeout(() => {
      const canvas = document.getElementById('empresasChartCanvas') as HTMLCanvasElement;
      if (!canvas) return;

      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
      }

      const list = this.resumenEmpresas.slice(0, 10);
      if (list.length === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const labels = list.map(e => e.nombre.length > 22 ? e.nombre.substring(0, 22) + '...' : e.nombre);

      if (this.empresasChartType === 'doughnut') {
        const totalData = list.map(e => Number(e.totalTon.toFixed(1)));
        const colors = [
          '#1b5e20', '#2e7d32', '#4caf50', '#81c784', '#a5d6a7',
          '#eab308', '#f59e0b', '#d97706', '#0284c7', '#0369a1'
        ];

        this.chartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: totalData,
              backgroundColor: colors.slice(0, list.length),
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: { font: { family: 'system-ui', size: 11, weight: 'bold' } }
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.label}: ${ctx.raw} ton`
                }
              },
              datalabels: {
                color: '#ffffff',
                font: { weight: 'bold', size: 11 },
                formatter: (value: any) => (value && value > 0) ? `${value} ton` : ''
              } as any
            }
          }
        });
      } else {
        const isHorizontal = this.empresasChartType === 'horizontalBar';
        const entradasData = list.map(e => Number(e.entradasTon.toFixed(1)));
        const salidasData = list.map(e => Number(e.salidasTon.toFixed(1)));

        this.chartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Entradas (ton)',
                data: entradasData,
                backgroundColor: 'rgba(46, 125, 50, 0.85)',
                borderColor: '#1b5e20',
                borderWidth: 1,
                borderRadius: 5
              },
              {
                label: 'Salidas (ton)',
                data: salidasData,
                backgroundColor: 'rgba(234, 179, 8, 0.85)',
                borderColor: '#ca8a04',
                borderWidth: 1,
                borderRadius: 5
              }
            ]
          },
          options: {
            indexAxis: isHorizontal ? 'y' : 'x',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: { font: { family: 'system-ui', size: 12, weight: 'bold' } }
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw} ton`
                }
              },
              datalabels: {
                anchor: 'end',
                align: isHorizontal ? 'right' : 'top',
                font: { weight: 'bold', size: 10 },
                color: '#334155',
                formatter: (value: any) => (value && value > 0) ? `${value} ton` : ''
              } as any
            },
            scales: {
              x: { beginAtZero: true, grace: isHorizontal ? '15%' : '0%', grid: { color: '#f1f5f9' } },
              y: { beginAtZero: true, grace: isHorizontal ? '0%' : '15%', grid: { color: '#f1f5f9' } }
            }
          }
        });
      }
    }, 100);
  }

  cargarAnoActual(): void {
    const currentYear = new Date().getFullYear();
    this.startFecha = `${currentYear}-01-01`;
    const hoy = new Date().toISOString().split('T')[0];
    this.endFecha = hoy;
    this.cargarTransportes();
    if (this.showEmpresasModal) {
      setTimeout(() => this.renderEmpresasChart(), 500);
    }
  }

  get periodoFormateado(): string {
    if (!this.startFecha || !this.endFecha) return '';
    const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const start = new Date(this.startFecha + 'T00:00:00');
    const end = new Date(this.endFecha + 'T00:00:00');
    return `${start.toLocaleDateString('es-CO', opciones)} → ${end.toLocaleDateString('es-CO', opciones)}`;
  }

  // Paginación
  get totalPaginas(): number {
    return Math.ceil(this.transportesFiltrados.length / this.elementosPorPagina) || 1;
  }

  get transportesPaginados(): TransporteItem[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    return this.transportesFiltrados.slice(inicio, inicio + this.elementosPorPagina);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
    }
  }

  // Estado badges
  isSuccessState(estado: string | undefined | null): boolean {
    if (!estado) return false;
    const e = String(estado).toLowerCase();
    return e.includes('salida') || e.includes('entregad') || e.includes('finalizad') || e.includes('activo');
  }

  isWarningState(estado: string | undefined | null): boolean {
    if (!estado) return false;
    const e = String(estado).toLowerCase();
    return e.includes('entrada') || e.includes('transit') || e.includes('camino') || e.includes('pendient');
  }

  // Modal de Detalle
  abrirDetalle(t: TransporteItem): void {
    this.selectedTransport = t;
    this.showDetailModal = true;
  }

  cerrarDetalle(): void {
    this.showDetailModal = false;
    this.selectedTransport = null;
  }

  getTransporteProperties(t: TransporteItem): { key: string; value: any }[] {
    if (!t) return [];
    return Object.keys(t).map(key => ({
      key: this.formatearClave(key),
      value: t[key] !== null && t[key] !== undefined ? t[key] : '—'
    }));
  }

  private formatearClave(clave: string): string {
    return clave
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  // Exportar datos a CSV
  exportarCSV(): void {
    if (this.transportesFiltrados.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const headers = ['ID Transporte', 'Placa', 'Operación', 'Proveedor / Origen', 'Destino', 'Producto', 'Fecha', 'Peso Inicial (kg)', 'Peso Final (kg)', 'Peso Neto (kg)'];
    const rows = this.transportesFiltrados.map(t => [
      `"${t['id'] || ''}"`,
      `"${t['placa'] || ''}"`,
      `"${t['estado'] || ''}"`,
      `"${t['origen'] || ''}"`,
      `"${t['destino'] || ''}"`,
      `"${t['producto'] || ''}"`,
      `"${t['fecha'] || ''}"`,
      `"${t['pesoInicial'] || 0}"`,
      `"${t['pesoFinal'] || 0}"`,
      `"${t['pesoNeto'] || 0}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Transportes_TBS_${this.startFecha}_a_${this.endFecha}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
