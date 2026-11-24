import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ItemsService } from '../../servicios/items.service';
import { ItemExistencia, BodegaInfo, ItemResumen, ItemRequisicion } from '../../models/items/item-existencia.model';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './items.html',
  styleUrl: './items.css'
})
export class Items implements OnInit {

  // Datos principales
  items: ItemExistencia[] = [];
  itemsFiltrados: ItemExistencia[] = [];
  bodegas: BodegaInfo[] = [];

  // Modo de visualización (Por defecto 'tarjetas')
  vistaModo: 'tarjetas' | 'tabla' = 'tarjetas';

  // Filtros de bodega
  bodegaSeleccionada: string = 'TODAS'; // 'TODAS' o código de bodega (ej: 'BALG')
  bodegasMultiples: string[] = [];
  modoSeleccionMultiple: boolean = false;

  // Otros Filtros
  busqueda: string = '';
  filtroStock: 'todos' | 'con_stock' | 'sin_stock' | 'negativo' = 'todos';
  filtroCia: string = 'todas';
  ciasDisponibles: number[] = [];

  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 24;
  itemsPorPaginaOpciones: number[] = [12, 24, 48, 96, 192];

  // Ordenamiento
  columnaOrden: keyof ItemExistencia = 'itemId';
  ordenAsc: boolean = true;

  // Estados
  cargando: boolean = false;
  cargandoBodegas: boolean = false;
  error: string | null = null;
  fechaConsulta: Date | null = null;
  copiadoItemId: string | null = null;
  mensajeToast: string | null = null;

  // ==================== ARMA TU REQUISICIÓN ====================
  requisicion: ItemRequisicion[] = [];
  mostrarModalRequisicion: boolean = false;
  notaRequisicion: string = 'Esta opción solo te sirve para que armes tu requisición y lleves los ítems listos a Siesa, no te creará la requisición enseguida, solo es modo consulta.';
  referenciaRequisicion: string = '';
  centroCostoRequisicion: string = '';
  resumenCopiado: boolean = false;

  // Resumen / KPIs
  resumen = {
    totalItems: 0,
    itemsConStock: 0,
    itemsSinStock: 0,
    totalStock: 0,
    valorTotalInventario: 0,
    totalBodegasEncontradas: 0
  };

  constructor(
    private itemsService: ItemsService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private location: Location
  ) {}

  /**
   * Regresar a la vista previa o a la pantalla principal Home
   */
  regresar(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/home']);
    }
  }

  ngOnInit(): void {
    this.cargarBodegas();
    this.consultarExistencias();
  }

  /**
   * Carga la lista completa de bodegas desde Siesa (f400_id_cia = 2)
   */
  cargarBodegas(): void {
    this.cargandoBodegas = true;
    this.itemsService.getBodegas().subscribe({
      next: (data) => {
        this.bodegas = data || [];
        this.cargandoBodegas = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar bodegas:', err);
        this.cargandoBodegas = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Consulta las existencias en Siesa (f400_id_cia = 2)
   */
  consultarExistencias(): void {
    this.cargando = true;
    this.error = null;

    let paramBodega = '';
    if (this.modoSeleccionMultiple && this.bodegasMultiples.length > 0) {
      paramBodega = this.bodegasMultiples.join(',');
    } else if (this.bodegaSeleccionada && this.bodegaSeleccionada !== 'TODAS') {
      paramBodega = this.bodegaSeleccionada;
    }

    this.itemsService.getExistencias(paramBodega).subscribe({
      next: (data) => {
        this.items = data || [];
        this.fechaConsulta = new Date();
        this.extraerCias();
        this.aplicarFiltros();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al consultar existencias:', err);
        this.error = 'No se pudieron consultar los ítems en Siesa. Verifique la conexión con la base de datos.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Extrae las compañías presentes en los resultados
   */
  extraerCias(): void {
    const cias = new Set<number>();
    this.items.forEach(it => {
      if (it.cia !== undefined && it.cia !== null) {
        cias.add(it.cia);
      }
    });
    this.ciasDisponibles = Array.from(cias).sort((a, b) => a - b);
  }

  /**
   * Selección rápida de bodega individual
   */
  seleccionarBodega(bodegaId: string): void {
    this.modoSeleccionMultiple = false;
    this.bodegasMultiples = [];
    this.bodegaSeleccionada = bodegaId;
    this.paginaActual = 1;
    this.consultarExistencias();
  }

  /**
   * Alterna selección en modo múltiple
   */
  toggleBodegaMultiple(bodegaId: string): void {
    this.modoSeleccionMultiple = true;
    const idx = this.bodegasMultiples.indexOf(bodegaId);
    if (idx >= 0) {
      this.bodegasMultiples.splice(idx, 1);
    } else {
      this.bodegasMultiples.push(bodegaId);
    }

    if (this.bodegasMultiples.length === 0) {
      this.bodegaSeleccionada = 'TODAS';
      this.modoSeleccionMultiple = false;
    }

    this.paginaActual = 1;
    this.consultarExistencias();
  }

  isBodegaActiva(bodegaId: string): boolean {
    if (this.modoSeleccionMultiple) {
      return this.bodegasMultiples.includes(bodegaId);
    }
    return this.bodegaSeleccionada === bodegaId;
  }

  /**
   * Aplica filtros de búsqueda, stock y compañía
   */
  aplicarFiltros(): void {
    let filtrados = [...this.items];

    // Filtro por término de búsqueda (item_id, descripción o bodega)
    if (this.busqueda && this.busqueda.trim()) {
      const q = this.busqueda.trim().toLowerCase();
      filtrados = filtrados.filter(it =>
        (it.itemId && it.itemId.toLowerCase().includes(q)) ||
        (it.descripcion && it.descripcion.toLowerCase().includes(q)) ||
        (it.bodega && it.bodega.toLowerCase().includes(q)) ||
        (it.nombreBodega && it.nombreBodega.toLowerCase().includes(q))
      );
    }

    // Filtro por estado de stock
    if (this.filtroStock === 'con_stock') {
      filtrados = filtrados.filter(it => (it.stockActual || 0) > 0);
    } else if (this.filtroStock === 'sin_stock') {
      filtrados = filtrados.filter(it => (it.stockActual || 0) === 0);
    } else if (this.filtroStock === 'negativo') {
      filtrados = filtrados.filter(it => (it.stockActual || 0) < 0);
    }

    // Filtro por compañía
    if (this.filtroCia !== 'todas') {
      const ciaNum = Number(this.filtroCia);
      filtrados = filtrados.filter(it => it.cia === ciaNum);
    }

    // Ordenar resultados
    filtrados.sort((a, b) => {
      const valorA = a[this.columnaOrden];
      const valorB = b[this.columnaOrden];

      if (valorA === valorB) return 0;
      if (valorA === null || valorA === undefined) return 1;
      if (valorB === null || valorB === undefined) return -1;

      if (typeof valorA === 'string' && typeof valorB === 'string') {
        const cmp = valorA.localeCompare(valorB, undefined, { numeric: true, sensitivity: 'base' });
        return this.ordenAsc ? cmp : -cmp;
      }

      if (valorA < valorB) return this.ordenAsc ? -1 : 1;
      if (valorA > valorB) return this.ordenAsc ? 1 : -1;
      return 0;
    });

    this.itemsFiltrados = filtrados;
    this.paginaActual = 1;
    this.calcularResumen();
  }

  /**
   * Calcula los totales y KPIs en base a los datos filtrados
   */
  calcularResumen(): void {
    let stock = 0;
    let valor = 0;
    let conStock = 0;
    let sinStock = 0;
    const bodegasUnicas = new Set<string>();

    for (const it of this.itemsFiltrados) {
      const s = it.stockActual || 0;
      const v = it.valorTotalInventario || 0;
      stock += s;
      valor += v;
      if (s > 0) {
        conStock++;
      } else {
        sinStock++;
      }
      if (it.bodega) {
        bodegasUnicas.add(it.bodega);
      }
    }

    this.resumen = {
      totalItems: this.itemsFiltrados.length,
      itemsConStock: conStock,
      itemsSinStock: sinStock,
      totalStock: stock,
      valorTotalInventario: valor,
      totalBodegasEncontradas: bodegasUnicas.size
    };
  }

  /**
   * Cambia la columna de ordenación
   */
  ordenarPor(columna: keyof ItemExistencia): void {
    if (this.columnaOrden === columna) {
      this.ordenAsc = !this.ordenAsc;
    } else {
      this.columnaOrden = columna;
      this.ordenAsc = true;
    }
    this.aplicarFiltros();
  }

  /**
   * Retorna los items de la página actual
   */
  get itemsPaginados(): ItemExistencia[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.itemsFiltrados.slice(inicio, fin);
  }

  /**
   * Total de páginas calculado
   */
  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.itemsFiltrados.length / this.itemsPorPagina));
  }

  /**
   * Navegación de páginas
   */
  irAPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas) {
      this.paginaActual = p;
    }
  }

  cambiarItemsPorPagina(cantidad: number): void {
    this.itemsPorPagina = cantidad;
    this.paginaActual = 1;
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroStock = 'todos';
    this.filtroCia = 'todas';
    this.bodegaSeleccionada = 'TODAS';
    this.bodegasMultiples = [];
    this.modoSeleccionMultiple = false;
    this.columnaOrden = 'itemId';
    this.ordenAsc = true;
    this.consultarExistencias();
  }

  /**
   * Copia el ID del ítem al portapapeles
   */
  copiarId(itemId: string): void {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(itemId);
      this.copiadoItemId = itemId;
      setTimeout(() => {
        if (this.copiadoItemId === itemId) {
          this.copiadoItemId = null;
          this.cdr.detectChanges();
        }
      }, 1800);
    }
  }

  // ==================== LÓGICA DE REQUISICIÓN ====================

  /**
   * Agrega un ítem a la requisición o incrementa su cantidad
   */
  agregarARequisicion(item: ItemExistencia): void {
    const existente = this.requisicion.find(
      r => r.item.itemId === item.itemId && r.item.bodega === item.bodega
    );

    if (existente) {
      existente.cantidadSolicitada += 1;
      this.mostrarNotificacion(`Se aumentó la cantidad de "${item.itemId}" en la requisición`);
    } else {
      this.requisicion.push({
        item: { ...item },
        cantidadSolicitada: 1,
        observaciones: ''
      });
      this.mostrarNotificacion(`Ítem "${item.itemId}" agregado a la requisición`);
    }
    this.cdr.detectChanges();
  }

  /**
   * Quita un ítem de la requisición por índice
   */
  quitarDeRequisicion(index: number): void {
    if (index >= 0 && index < this.requisicion.length) {
      const removido = this.requisicion.splice(index, 1);
      if (removido.length > 0) {
        this.mostrarNotificacion(`Ítem "${removido[0].item.itemId}" eliminado de la requisición`);
      }
      this.cdr.detectChanges();
    }
  }

  /**
   * Incrementa o decrementa la cantidad solicitada
   */
  cambiarCantidadReq(itemReq: ItemRequisicion, delta: number): void {
    const nueva = (itemReq.cantidadSolicitada || 0) + delta;
    if (nueva > 0) {
      itemReq.cantidadSolicitada = nueva;
    }
    this.cdr.detectChanges();
  }

  /**
   * Verifica si un ítem ya está agregado a la requisición
   */
  estaEnRequisicion(item: ItemExistencia): boolean {
    return this.requisicion.some(
      r => r.item.itemId === item.itemId && r.item.bodega === item.bodega
    );
  }

  /**
   * Obtiene la cantidad solicitada actualmente para un ítem
   */
  getCantidadEnReq(item: ItemExistencia): number {
    const r = this.requisicion.find(
      x => x.item.itemId === item.itemId && x.item.bodega === item.bodega
    );
    return r ? r.cantidadSolicitada : 0;
  }

  abrirRequisicion(): void {
    this.mostrarModalRequisicion = true;
  }

  cerrarRequisicion(): void {
    this.mostrarModalRequisicion = false;
  }

  vaciarRequisicion(): void {
    if (this.requisicion.length === 0) return;
    if (confirm('¿Está seguro de vaciar todos los ítems de la requisición?')) {
      this.requisicion = [];
      this.mostrarNotificacion('La requisición ha sido vaciada');
      this.cdr.detectChanges();
    }
  }

  get totalUnidadesRequisicion(): number {
    return this.requisicion.reduce((acc, r) => acc + (r.cantidadSolicitada || 0), 0);
  }

  get totalValorRequisicion(): number {
    return this.requisicion.reduce((acc, r) => {
      const costo = r.item.costoPromedio || 0;
      return acc + (costo * (r.cantidadSolicitada || 0));
    }, 0);
  }

  mostrarNotificacion(msg: string): void {
    this.mensajeToast = msg;
    setTimeout(() => {
      if (this.mensajeToast === msg) {
        this.mensajeToast = null;
        this.cdr.detectChanges();
      }
    }, 2500);
  }

  /**
   * Copia un resumen estructurado de la requisición para pegar en correo, chat o documento
   */
  copiarResumenRequisicion(): void {
    if (this.requisicion.length === 0) return;

    let texto = `📋 REQUISICIÓN DE MATERIALES - BGREEN\n`;
    texto += `Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    if (this.referenciaRequisicion) texto += `Referencia: ${this.referenciaRequisicion}\n`;
    if (this.centroCostoRequisicion) texto += `Centro de Costos: ${this.centroCostoRequisicion}\n`;
    if (this.notaRequisicion) texto += `Nota: ${this.notaRequisicion}\n`;
    texto += `--------------------------------------------------\n`;

    this.requisicion.forEach((r, idx) => {
      const disponible = r.item.stockActual || 0;
      const subtotal = (r.item.costoPromedio || 0) * (r.cantidadSolicitada || 0);
      texto += `${idx + 1}. [${r.item.itemId}] ${r.item.descripcion}\n`;
      texto += `   Bodega: ${r.item.bodega} (${r.item.nombreBodega || ''})\n`;
      texto += `   Cantidad Solicitada: ${r.cantidadSolicitada} | Disponible: ${disponible}\n`;
      texto += `   Costo Prom: $${(r.item.costoPromedio || 0).toLocaleString()} | Subtotal: $${subtotal.toLocaleString()}\n`;
      if (r.observaciones) texto += `   Observación: ${r.observaciones}\n`;
      texto += `\n`;
    });

    texto += `--------------------------------------------------\n`;
    texto += `Total Ítems: ${this.requisicion.length}\n`;
    texto += `Total Unidades: ${this.totalUnidadesRequisicion}\n`;
    texto += `Valor Estimado Total: $${this.totalValorRequisicion.toLocaleString()}\n`;

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(texto);
      this.resumenCopiado = true;
      this.mostrarNotificacion('¡Resumen de requisición copiado al portapapeles!');
      setTimeout(() => {
        this.resumenCopiado = false;
        this.cdr.detectChanges();
      }, 2000);
    }
  }

  /**
   * Exporta la requisición actual a un archivo CSV para Excel
   */
  exportarRequisicionCsv(): void {
    if (this.requisicion.length === 0) return;

    const encabezados = [
      'Item ID',
      'Descripcion',
      'Bodega',
      'Nombre Bodega',
      'Stock Disponible',
      'Cantidad Solicitada',
      'Costo Promedio',
      'Subtotal Estimado',
      'Observaciones',
      'Nota Requisicion'
    ];

    const filas = this.requisicion.map(r => [
      `"${(r.item.itemId || '').replace(/"/g, '""')}"`,
      `"${(r.item.descripcion || '').replace(/"/g, '""')}"`,
      `"${(r.item.bodega || '').replace(/"/g, '""')}"`,
      `"${(r.item.nombreBodega || '').replace(/"/g, '""')}"`,
      (r.item.stockActual ?? 0).toString().replace('.', ','),
      (r.cantidadSolicitada ?? 0).toString().replace('.', ','),
      (r.item.costoPromedio ?? 0).toString().replace('.', ','),
      ((r.item.costoPromedio || 0) * (r.cantidadSolicitada || 0)).toString().replace('.', ','),
      `"${(r.observaciones || '').replace(/"/g, '""')}"`,
      `"${(this.notaRequisicion || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [
      encabezados.join(';'),
      ...filas.map(f => f.join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fechaStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `requisicion_materiales_${fechaStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Exporta los datos actuales a CSV compatible con Microsoft Excel (UTF-8 con BOM)
   */
  exportarCsv(): void {
    if (!this.itemsFiltrados || this.itemsFiltrados.length === 0) return;

    const encabezados = [
      'Cia',
      'ID Item',
      'Descripcion',
      'Descripcion Corta',
      'Unidad Inventario',
      'Tipo Inv/Serv',
      'Desc Tipo Inv/Serv',
      'Bodega',
      'Nombre Bodega',
      'Stock Actual',
      'Costo Promedio',
      'Valor Total Inventario'
    ];

    const filas = this.itemsFiltrados.map(it => [
      it.cia ?? '',
      `"${(it.itemId || '').replace(/"/g, '""')}"`,
      `"${(it.descripcion || '').replace(/"/g, '""')}"`,
      `"${(it.descripcionCorta || '').replace(/"/g, '""')}"`,
      `"${(it.unidadInventario || '').replace(/"/g, '""')}"`,
      `"${(it.tipoInvServ || '').replace(/"/g, '""')}"`,
      `"${(it.descTipoInvServ || '').replace(/"/g, '""')}"`,
      `"${(it.bodega || '').replace(/"/g, '""')}"`,
      `"${(it.nombreBodega || '').replace(/"/g, '""')}"`,
      (it.stockActual ?? 0).toString().replace('.', ','),
      (it.costoPromedio ?? 0).toString().replace('.', ','),
      (it.valorTotalInventario ?? 0).toString().replace('.', ',')
    ]);

    const csvContent = '\uFEFF' + [
      encabezados.join(';'),
      ...filas.map(f => f.join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fechaStr = new Date().toISOString().slice(0, 10);
    const etiquetaBodega = this.bodegaSeleccionada || 'todas';
    link.setAttribute('href', url);
    link.setAttribute('download', `existencias_items_${etiquetaBodega}_${fechaStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
