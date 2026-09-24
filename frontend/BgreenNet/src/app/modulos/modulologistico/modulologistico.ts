import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LogisticoService, TransporteItem, ProductoConfigItem } from '../../servicios/LogisticoService';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-modulologistico',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
  showOcultosModal: boolean = false;

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

    this.cargarProductosPermitidos();
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
        this.sincronizarProductosDetectados();
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
      const trailerVal = item.trailer_number || item.trailer || item.remolque || null;
      const citizenVal = item.citizen_card || item.cedula || item.identification || null;
      const chargeTypeName = item.charge_type_name || item.tipo_carga || (item.charge_type ? `Tipo ${item.charge_type}` : null);
      const categoryVal = item.category_name || item.categoria || null;
      const interfaceCodeVal = item.interface_code || item.codigo_interfaz || null;
      const qRec = (item.quantity_received !== undefined && item.quantity_received !== null && item.quantity_received !== '') ? Number(item.quantity_received) : null;
      const qMan = (item.quantity_manifested !== undefined && item.quantity_manifested !== null && item.quantity_manifested !== '') ? Number(item.quantity_manifested) : null;
      const diffQty = (qRec !== null && qMan !== null) ? (qRec - qMan) : null;
      const supplier = item.supplier_name || item.origen || item.origin || 'N/A';
      const company = item.company_name || item.destino || item.destination || 'BGREEN S.A.S.';
      const operacion = item.input_output || item.estado || item.status || 'Registrado';
      const dateVal = item.starting_date ? `${item.starting_date} ${item.starting_time || ''}`.trim() : (item.fecha || 'N/A');
      const endDateVal = item.end_date ? `${item.end_date} ${item.end_time || ''}`.trim() : (item.fecha_fin || '—');
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
      copy['remolque'] = trailerVal;
      copy['conductor'] = item.driver_name || item.conductor || item.driver || 'N/A';
      copy['cedulaConductor'] = citizenVal;
      copy['tipoCarga'] = chargeTypeName;
      copy['categoria'] = categoryVal;
      copy['codigoInterfaz'] = interfaceCodeVal;
      copy['cantidadRecibida'] = qRec;
      copy['cantidadManifestada'] = qMan;
      copy['diferenciaCantidad'] = diffQty;
      copy['origen'] = supplier;
      copy['destino'] = company;
      copy['estado'] = operacion;
      copy['fecha'] = dateVal;
      copy['fechaFin'] = endDateVal;
      copy['guia'] = item.guia || item.remision || item.document_number || `TRP-${idVal}`;
      copy['producto'] = this.limpiarNombreProducto(prodVal);
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

  // Lista de productos permitidos por defecto (fallback de seguridad)
  private readonly PRODUCTOS_PERMITIDOS_DEFAULT: string[] = [
    '(MP) ACEITE CRUDO DE PALMA',
    'BIODIESEL DESTILADO',
    'RESIDUO LIQUIDO (DESECHO SIN VALOR COMERCIAL)',
    '(MP) METANOL',
    '(INS) METILATO DE SODIO',
    '(INS) ESTEARINA DE PALMA',
    '(INS) NITROGENO LIQUIDO',
    'GLICERINA CRUDA',
    'FONDOS DE DESTILACION',
    '(INS) ACIDO CLORHIDRICO',
    'DESECHOS SIN VALOR -TIERRAS USADAS',
    'DESECHOS SIN VALOR - TIERRAS USADAS',
    '(INS) ACIDO FOSFORICO',
    '(INS) SODA CAUSTICA LIQUIDA',
    'DESECHOS DE RESINAS USADAS',
    '(INS) RESINA DE GUARD LEWATIT MONO PLUS SP112 H',
    '(INS) RESINA DE GUARD LEWATIT  MONO PLUS SP112 H'
  ];

  productosPermitidosList: string[] = [...this.PRODUCTOS_PERMITIDOS_DEFAULT];

  private allowedProductsNormalized: Set<string> = new Set(
    this.PRODUCTOS_PERMITIDOS_DEFAULT.map(p => this.normalizeString(p))
  );

  actualizarSetPermitidos(lista: string[]): void {
    if (!lista || lista.length === 0) {
      lista = this.PRODUCTOS_PERMITIDOS_DEFAULT;
    }
    this.productosPermitidosList = lista;
    this.allowedProductsNormalized = new Set(
      lista.map(p => this.normalizeString(p))
    );
  }

  cargarProductosPermitidos(): void {
    this.logisticoSvc.getProductosPermitidos().subscribe({
      next: (lista: string[]) => {
        if (Array.isArray(lista) && lista.length > 0) {
          this.actualizarSetPermitidos(lista);
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        console.warn('No se pudo cargar la lista de productos permitidos desde BD, usando default:', err?.error?.detalle || err?.message || err);
        this.actualizarSetPermitidos(this.PRODUCTOS_PERMITIDOS_DEFAULT);
      }
    });
  }

  private normalizeString(str: string | undefined | null): string {
    if (!str) return '';
    return str
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  limpiarNombreProducto(rawProd: string | undefined | null): string {
    if (!rawProd || rawProd === 'N/A') return 'N/A';

    const parts = String(rawProd).split('-').map(p => p.trim()).filter(Boolean);
    if (parts.length <= 1) return String(rawProd).trim();

    const seen = new Set<string>();
    const uniqueParts: string[] = [];

    for (const part of parts) {
      const norm = this.normalizeString(part);
      if (!seen.has(norm)) {
        seen.add(norm);
        uniqueParts.push(part);
      }
    }

    return uniqueParts.join(' - ');
  }

  isProductoPermitido(producto: string | undefined | null): boolean {
    if (!producto) return false;

    // Direct normalized match
    const norm = this.normalizeString(producto);
    if (this.allowedProductsNormalized.has(norm)) return true;

    // Cleaned match
    const cleaned = this.limpiarNombreProducto(producto);
    const normCleaned = this.normalizeString(cleaned);
    if (this.allowedProductsNormalized.has(normCleaned)) return true;

    // Sub-parts match
    const parts = String(producto).split('-').map(p => this.normalizeString(p)).filter(Boolean);
    return parts.some(part => this.allowedProductsNormalized.has(part));
  }

  // Permite saber transportes permitidos
  get transportesPermitidos(): TransporteItem[] {
    return this.transportes.filter(t => this.isProductoPermitido(t['producto'] || t['products']));
  }

  // Permite saber transportes ocultos (excluidos por no estar permitidos en BD)
  get transportesOcultos(): TransporteItem[] {
    return this.transportes.filter(t => !this.isProductoPermitido(t['producto'] || t['products']));
  }

  get totalToneladasOcultas(): number {
    return this.transportesOcultos.reduce((acc, t) => acc + (Number(t.pesoNeto) || 0), 0) / 1000;
  }

  get totalOperacionesOcultas(): number {
    return this.transportesOcultos.length;
  }

  get totalPesoOcultoTon(): number {
    return this.totalToneladasOcultas;
  }

  get resumenProductosOcultos(): {
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

    for (const t of this.transportesOcultos) {
      const prod = String(t['producto'] || t['products'] || 'Sin producto').toUpperCase().trim();
      const io = String(t['input_output'] || t['estado'] || '').toLowerCase();
      const isEntrada = io.includes('entrada') || io.includes('input') || io.includes('in') || io.includes('descargue');
      const tipo = isEntrada ? 'Descargue' : 'Cargue';
      const entityName = isEntrada
        ? String(t['supplier_name'] || t['origen'] || '').trim()
        : String(t['company_name'] || t['destino'] || '').trim();

      const key = `${prod}:::${tipo}`;
      if (!map.has(key)) {
        map.set(key, { tipo, peso: 0, count: 0, entities: new Map() });
      }
      const entry = map.get(key)!;
      const pesoNeto = Number(t['pesoNeto']) || 0;
      entry.peso += pesoNeto;
      entry.count++;

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
      .map(([key, data]) => {
        const prodName = key.split(':::')[0];
        const totalTon = data.peso / 1000;
        return {
          producto: prodName,
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
      .sort((a, b) => {
        if (a.tipo === 'Cargue' && b.tipo !== 'Cargue') return -1;
        if (a.tipo !== 'Cargue' && b.tipo === 'Cargue') return 1;
        return b.pesoTon - a.pesoTon;
      });
  }

  permitirProducto(producto: string): void {
    if (!producto) return;
    this.logisticoSvc.permitirProducto(producto).subscribe({
      next: () => {
        this.cargarProductosPermitidos();
      },
      error: (err: any) => {
        console.error('Error al permitir producto:', err);
      }
    });
  }

  sincronizarProductosDetectados(): void {
    const rawProds = new Set<string>();
    for (const t of this.transportes) {
      const p = String(t['producto'] || t['products'] || '').trim();
      if (p && p !== 'N/A' && p !== '—') {
        rawProds.add(p);
      }
    }

    if (rawProds.size === 0) return;

    this.logisticoSvc.getProductosConfig().subscribe({
      next: (configList: ProductoConfigItem[]) => {
        const existingMap = new Set(
          (configList || []).map(c => this.normalizeString(c.nombreProducto))
        );

        for (const p of rawProds) {
          const norm = this.normalizeString(p);
          if (!existingMap.has(norm)) {
            // Guardar en BD como no permitido (oculto) para que aparezca en configuración
            this.logisticoSvc.guardarProductoConfig({
              nombreProducto: p,
              permitido: false,
              usuario: 'DETECTADO_TBS'
            }).subscribe({
              next: () => {
                existingMap.add(norm);
              },
              error: () => {}
            });
          }
        }
      },
      error: () => {}
    });
  }

  abrirModalOcultos(): void {
    this.showOcultosModal = true;
    this.cdr.detectChanges();
  }

  cerrarModalOcultos(): void {
    this.showOcultosModal = false;
    this.cdr.detectChanges();
  }

  // Getters para filtrado y estadísticas
  get transportesFiltrados(): TransporteItem[] {
    const q = this.searchQuery.trim().toLowerCase();

    return this.transportesPermitidos.filter(t => {
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
        t.remolque,
        t.conductor,
        t.cedulaConductor,
        t.tipoCarga,
        t.categoria,
        t.codigoInterfaz,
        t.origen,
        t.destino,
        t.estado,
        t.guia,
        t.fecha,
        t.fechaFin,
        t.producto
      ].filter(Boolean).join(' ').toLowerCase();

      return searchableText.includes(q);
    });
  }

  get totalOperacionesMostradas(): number {
    return this.transportesPermitidos.length;
  }

  get totalRegistros(): number {
    return this.transportesPermitidos.length;
  }

  get placasUnicas(): number {
    const set = new Set(this.transportesPermitidos.map(t => t.placa).filter(p => p && p !== 'N/A'));
    return set.size;
  }

  get conductoresUnicos(): number {
    const set = new Set(this.transportesPermitidos.map(t => t.conductor).filter(c => c && c !== 'N/A'));
    return set.size;
  }

  get totalPesoNeto(): number {
    return this.transportesFiltrados.reduce((sum, t) => sum + (Number(t['pesoNeto']) || 0), 0);
  }

  get listaEstados(): string[] {
    const set = new Set(this.transportesPermitidos.map(t => String(t.estado || 'Registrado').toUpperCase()));
    return Array.from(set);
  }

  // ===== NUEVOS INDICADORES =====

  get totalEntradas(): number {
    return this.transportesPermitidos.filter(t => {
      const io = String(t.input_output || t.estado || '').toLowerCase();
      return io.includes('entrada') || io.includes('input') || io.includes('in');
    }).length;
  }

  get totalSalidas(): number {
    return this.transportesPermitidos.filter(t => {
      const io = String(t.input_output || t.estado || '').toLowerCase();
      return io.includes('salida') || io.includes('output') || io.includes('out');
    }).length;
  }

  get materiaPrimaIngresada(): number {
    return this.transportesPermitidos
      .filter(t => {
        const io = String(t.input_output || t.estado || '').toLowerCase();
        return io.includes('entrada') || io.includes('input') || io.includes('in');
      })
      .reduce((sum, t) => sum + (Number(t['pesoNeto']) || 0), 0) / 1000;
  }

  get vehiculosEntrada(): number {
    const set = new Set(
      this.transportesPermitidos
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
    return this.transportesPermitidos
      .filter(t => {
        const io = String(t.input_output || t.estado || '').toLowerCase();
        return io.includes('salida') || io.includes('output') || io.includes('out');
      })
      .reduce((sum, t) => sum + (Number(t['pesoNeto']) || 0), 0) / 1000;
  }

  get vehiculosSalida(): number {
    const set = new Set(
      this.transportesPermitidos
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

    for (const t of this.transportesPermitidos) {
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

    for (const t of this.transportesPermitidos) {
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

    for (const t of this.transportesPermitidos) {
      const prod = String(t['producto'] || t['products'] || 'Sin producto').toUpperCase().trim();
      const io = String(t['input_output'] || t['estado'] || '').toLowerCase();
      const isEntrada = io.includes('entrada') || io.includes('input') || io.includes('in');
      const tipo = isEntrada ? 'Descargue' : 'Cargue';

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
      .sort((a, b) => {
        if (a.tipo === 'Cargue' && b.tipo !== 'Cargue') return -1;
        if (a.tipo !== 'Cargue' && b.tipo === 'Cargue') return 1;
        return b.pesoTon - a.pesoTon;
      });
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

    for (const t of this.transportesPermitidos) {
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

  // Estado acordeón proveedores en tarjetas de producto
  acordeonAbiertoMap: Map<string, boolean> = new Map<string, boolean>();

  getAccordionKey(producto: string, tipo: string): string {
    return `${producto}_${tipo}`;
  }

  toggleAccordion(key: string): void {
    const currentState = this.acordeonAbiertoMap.get(key) || false;
    this.acordeonAbiertoMap.set(key, !currentState);
  }

  isAccordionOpen(key: string): boolean {
    return this.acordeonAbiertoMap.get(key) || false;
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
                label: 'Descargues (ton)',
                data: entradasData,
                backgroundColor: 'rgba(46, 125, 50, 0.85)',
                borderColor: '#1b5e20',
                borderWidth: 1,
                borderRadius: 5
              },
              {
                label: 'Cargues (ton)',
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

    const headers = [
      'ID Transporte',
      'Placa',
      'Remolque',
      'Conductor',
      'Cédula Conductor',
      'Operación',
      'Tipo Carga',
      'Categoría',
      'Código Interfaz',
      'Proveedor / Origen',
      'Destino / Empresa',
      'Producto',
      'Fecha Inicio',
      'Hora Inicio',
      'Fecha Fin',
      'Hora Fin',
      'Duración',
      'Cant. Manifestada (kg)',
      'Cant. Recibida (kg)',
      'Diferencia (kg)',
      'Peso Inicial / Tara (kg)',
      'Peso Final / Bruto (kg)',
      'Peso Neto (kg)'
    ];

    const rows = this.transportesFiltrados.map(t => [
      `"${t['id'] || ''}"`,
      `"${t['placa'] || ''}"`,
      `"${t['remolque'] || ''}"`,
      `"${t['conductor'] || ''}"`,
      `"${t['cedulaConductor'] || ''}"`,
      `"${t['estado'] || ''}"`,
      `"${t['tipoCarga'] || ''}"`,
      `"${t['categoria'] || ''}"`,
      `"${t['codigoInterfaz'] || ''}"`,
      `"${t['origen'] || ''}"`,
      `"${t['destino'] || ''}"`,
      `"${t['producto'] || ''}"`,
      `"${t['starting_date'] || t['fecha'] || ''}"`,
      `"${t['horaInicio'] || ''}"`,
      `"${t['end_date'] || t['fechaFin'] || ''}"`,
      `"${t['horaFin'] || ''}"`,
      `"${t['duracion'] || ''}"`,
      `"${t['cantidadManifestada'] !== null && t['cantidadManifestada'] !== undefined ? t['cantidadManifestada'] : ''}"`,
      `"${t['cantidadRecibida'] !== null && t['cantidadRecibida'] !== undefined ? t['cantidadRecibida'] : ''}"`,
      `"${t['diferenciaCantidad'] !== null && t['diferenciaCantidad'] !== undefined ? t['diferenciaCantidad'] : ''}"`,
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
