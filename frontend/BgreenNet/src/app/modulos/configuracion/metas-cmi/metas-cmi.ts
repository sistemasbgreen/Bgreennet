import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MetaDetalle, MetaResponse, productoservices } from '../../../servicios/productoservices';
import { producto } from '../../../models/productos';

interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-metas-cmi',
  imports: [CommonModule, FormsModule],
  templateUrl: './metas-cmi.html',
  styleUrl: './metas-cmi.css',
})
export class MetasCMI implements OnInit {
  activeTab: 'productos' | 'mapeoErp' | 'documentos' = 'productos';

  switchTab(tab: 'productos' | 'mapeoErp' | 'documentos') {
    this.activeTab = tab;
  }

  soloNumeros(event: KeyboardEvent) {
    const pattern = /[0-9]/;
    
    // Permitir teclas especiales como Backspace, Tab, etc.
    if (event.key === 'Backspace' || event.key === 'Tab' || event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Delete') {
      return;
    }

    if (!pattern.test(event.key)) {
      event.preventDefault();
    }
  }

  productos: producto[] = [];
  productosOriginales: producto[] = [];
  selectedProducto: string = '';
  selectedAnio: string = new Date().getFullYear().toString();

  toast: ToastState = { visible: false, message: '', type: 'success' };
  
  showProductModal: boolean = false;
  showMetasModal: boolean = false;
  isEditingProduct: boolean = false;
  editModeType: 'general' | 'erp' = 'general';
  currentProduct: producto = { id: '', nombre: '', idProductoSiesa: '', consumptionDocTypes: [], productionDocTypes: [], sentidoMeta: true, mostrarCmi: true, metaDiariaManual: false };
  selectedProductObj: producto | null = null;
  showConfirmDuplicateModal: boolean = false;
  duplicateProductInfo: producto | null = null;
  
  showDocTypeModal: boolean = false;
  isEditingDocType: boolean = false;
  currentDocType: any = { id: null, codigo: '', descripcion: '', estado: 'Activo' };
  
  // Catalogos
  tiposDocumento: any[] = [];
  tiposMovimiento: any[] = [];
  seccionesReporte: any[] = [];
  
  selectedConsumoDoc: string = '';
  selectedProduccionDoc: string = '';
  tempConsumoDocs: any[] = [];
  tempProduccionDocs: any[] = [];

  
  // Dynamic Flow Variables
  siesaSearchId: string = '';
  productWasSaved: boolean = false;
  isSearchingSiesa: boolean = false;
  
  // Composite Product State
  tempComponentes: string[] = [];
  nuevoComponenteId: string = '';
  tempUsaSuma: boolean = false;
  isCompuestoToggle: boolean = false;
  isAddingComponent: boolean = false;
  
  // Single-view flow properties
  esConsumoEspecifico: boolean = true;
  
  // Drag and drop state for formula builder
  tempConsumoSalidas: any[] = [];
  tempConsumoEntradas: any[] = [];
  tempConsumoZonas: any[][] = [[], [], [], [], []];
  tempConsumoOperadores: string[] = ['+', '+', '+', '+'];
  tempProduccionSalidas: any[] = [];
  tempProduccionEntradas: any[] = [];
  draggedDoc: any = null;
  dragSource: string = '';
  draggedSign: string | null = null;
  isFormulaDividedConsumo: boolean = false;
  
  // Isolated state for document linking per product row
  linkingState: { [productId: string]: { type: string, code: string } } = {};

  // UI state
  distribuirValor: number = 0;
  guardando: boolean = false;
  skeletonRows: number[] = Array(12).fill(0);
  mesActual: number = new Date().getMonth();
  anioActual: number = new Date().getFullYear();

  // Metas state
  metas: MetaDetalle[] = Array(12).fill(0).map(() => ({ valor: 0 }));
  metaDiaria: number = 0;
  cargando: boolean = false;
  
  // Usuario
  userEmail: string = '';
  fullName: string = '';

  constructor(
    private service: productoservices,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarProductos();
    this.loadUserData();
  }

  private loadUserData(): void {
    const userString = localStorage.getItem('usuario');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        this.fullName = `${user.nombre} ${user.apellido}`.toUpperCase();
        this.userEmail = user.Usuario || user.correo;
      } catch (error) {
        console.error('Error al cargar datos del usuario', error);
      }
    }
  }

  getLinkingState(productId: string) {
    if (!this.linkingState[productId]) {
      this.linkingState[productId] = { 
        type: this.tiposMovimiento.length > 0 ? this.tiposMovimiento[0].id : '', 
        code: this.tiposDocumento.length > 0 ? this.tiposDocumento[0].id : '' 
      };
    }
    return this.linkingState[productId];
  }

  meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  cargarCatalogos() {
    this.service.getTiposMovimiento().subscribe(res => {
      this.tiposMovimiento = res;
    });
    this.service.getTiposDocumento().subscribe(res => {
      this.tiposDocumento = res;
    });
    this.service.getSeccionesReporte().subscribe(res => {
      this.seccionesReporte = res;
    });
  }

  get selectedProductoNombre(): string {
    return this.selectedProductObj?.nombre ?? '';
  }

  get maxMeta(): number {
    return Math.max(...this.metas.map(m => m.valor || 0), 0);
  }

  get minMeta(): number {
    const metasConValor = this.metas.filter(m => m.valor > 0).map(m => m.valor);
    return metasConValor.length > 0 ? Math.min(...metasConValor) : 0;
  }

  get mesesConMeta(): number {
    return this.metas.filter(m => m.valor > 0).length;
  }

  getBarWidth(index: number): number {
    if (this.maxMeta === 0) return 0;
    const val = this.metas[index]?.valor || 0;
    return Math.round((val / this.maxMeta) * 100);
  }

  onMetaDiariaChange(val: number) {
    if (this.selectedProductObj && val > 1) {
      this.selectedProductObj.metaDiariaManual = true;
      this.cdr.detectChanges();
    }
  }

  cargarProductos() {
    this.service.getProductos().subscribe({
      next: (data) => {
        const baseProducts = [...data];
        baseProducts.push({
          id: 'CostoDirecto',
          nombre: 'Costo Directo',
          consumptionDocTypes: [],
          productionDocTypes: []
        });
        this.productosOriginales = [...baseProducts];
        this.productos = [...baseProducts];
        this.cargarMetasActuales();
        this.cdr.detectChanges();
      },
      error: () => this.showToast('Error al cargar productos', 'error')
    });
  }

  cargarMetasActuales() {
    const anio = new Date().getFullYear().toString();
    const mesIdx = new Date().getMonth(); // 0-11

    this.productos.forEach(p => {
      const obs = p.id === 'CostoDirecto'
        ? this.service.getCostoDirecto(anio)
        : this.service.getMetas(p.id, anio);

      obs.subscribe({
        next: (res) => {
          // Buscar por campo 'mes' en vez de índice posicional
          // (el Mes 0 puede desplazar índices si viene primero)
          const mesNum = new Date().getMonth() + 1; // 1-12
          const metaMes = res.mensuales?.find(m => m.mes === mesNum);
          p.metaActual = metaMes ? metaMes.valor : 0;
          this.cdr.detectChanges();
        },
        error: () => {
          p.metaActual = 0;
        }
      });
    });
  }

  openMetasModal(p: producto) {
    this.selectedProductObj = p;
    this.selectedProducto = p.id;
    this.selectedAnio = new Date().getFullYear().toString();
    this.metas = Array(12).fill(0).map(() => ({ valor: 0 }));
    this.distribuirValor = 0; // Solo se limpia el campo de Aplicar Masivo
    this.showMetasModal = true;
    this.cdr.detectChanges();
    this.cargarMetas();
  }

  cargarMetas() {
    if (!this.selectedProducto || !this.selectedAnio) return;
    this.cargando = true;
    const obs = this.selectedProducto === 'CostoDirecto'
      ? this.service.getCostoDirecto(this.selectedAnio)
      : this.service.getMetas(this.selectedProducto, this.selectedAnio);

    obs.subscribe({
      next: (res: MetaResponse) => {
        const mensuales = res?.mensuales ?? [];

        // Extraer meta diaria (Mes 0) si existe — comparar con Number()
        const diaria = mensuales.find(m => Number(m.mes) === 0);
        this.metaDiaria = diaria ? diaria.valor : 0;

        // Auto-activar el check si ya existe un valor guardado significativo (> 1)
        if (this.selectedProductObj && this.metaDiaria > 1) {
          this.selectedProductObj.metaDiariaManual = true;
        }

        // Mapear meses del 1 al 12 usando el campo 'mes'
        const nuevasMetas = Array(12).fill(0).map(() => ({ valor: 0 }));
        mensuales.forEach(m => {
          const mesNum = Number(m.mes);
          if (mesNum >= 1 && mesNum <= 12) {
            nuevasMetas[mesNum - 1] = m;
          }
        });
        this.metas = nuevasMetas;

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar metas:', err);
        this.showToast('Error al cargar metas', 'error');
        this.cargando = false;
        this.metas = Array(12).fill(0).map(() => ({ valor: 0 }));
        this.metaDiaria = 0;
        this.cdr.detectChanges();
      }
    });
  }

  onChange() { this.cargarMetas(); }
  onProductoChange() { this.cargarMetas(); }
  onAnioChange() { this.cargarMetas(); }

  cambiarAnio(delta: number) {
     const nuevoAnio = parseInt(this.selectedAnio) + delta;
     this.selectedAnio = nuevoAnio.toString();
     this.cargarMetas();
  }

  cambiarValor(index: number, event: any) {
    const val = parseFloat(event.target.value);
    if (!isNaN(val)) {
      this.metas[index].valor = val;
      this.cdr.detectChanges();
    }
  }

  actualizarFiltro(event: any) {
    const valor = event.target.value.toLowerCase();
    if (!valor) {
      this.productos = [...this.productosOriginales];
      this.cdr.detectChanges();
      return;
    }
    this.productos = this.productosOriginales.filter(p => 
      p.nombre.toLowerCase().includes(valor) || 
      (p.idProductoSiesa && String(p.idProductoSiesa).toLowerCase().includes(valor))
    );
    this.cdr.detectChanges();
  }

  distribuirValorATodos() {
    if (this.distribuirValor < 0) return;
    this.metas.forEach(m => m.valor = this.distribuirValor);
    this.showToast(`Valor ${this.distribuirValor} aplicado a todos los meses`, 'success');
  }

  guardar(index?: number) {
    if (index !== undefined) {
      this.guardarMes(index);
    } else {
      this.guardarTodo();
    }
  }

  guardarMes(index: number, skipRefresh: boolean = false) {
    const valor = this.metas[index].valor;
    const mes = index + 1;
    const anio = parseInt(this.selectedAnio);
    const payload = {
      productoId: this.selectedProducto,
      anio: anio,
      mes: mes,
      valor: valor,
      usuario: this.fullName || this.userEmail || 'ADMIN'
    };
    const obs = this.selectedProducto === 'CostoDirecto'
      ? this.service.guardarCostoDirecto(payload)
      : this.service.guardarMeta(payload);

    obs.subscribe({
      next: () => {
        if (!skipRefresh) {
          this.showToast(`Meta de ${this.meses[index]} guardada`, 'success');
          this.cargarMetas(); 
        }
      },
      error: () => {
        if (!skipRefresh) this.showToast('Error al guardar meta', 'error');
      }
    });
  }

  guardarTodo() {
    this.guardando = true;
    this.showToast('Guardando todas las metas...', 'success');
    let requestsPending = 13; // 12 meses + 1 diaria
    
    // Guardar Meta Diaria (Mes 0)
    const payloadDiario = {
      productoId: this.selectedProducto,
      anio: parseInt(this.selectedAnio),
      mes: 0,
      valor: this.metaDiaria,
      usuario: this.fullName || this.userEmail || 'ADMIN'
    };
    const obsDiario = this.selectedProducto === 'CostoDirecto'
      ? this.service.guardarCostoDirecto(payloadDiario)
      : this.service.guardarMeta(payloadDiario);

    obsDiario.subscribe({
      next: () => { requestsPending--; if (requestsPending === 0) this.finalizeBatchSave(); },
      error: () => { requestsPending--; if (requestsPending === 0) this.finalizeBatchSave(); }
    });

    // Guardar Metas Mensuales (1-12)
    this.metas.forEach((m, i) => {
        const payload = {
          productoId: this.selectedProducto,
          anio: parseInt(this.selectedAnio),
          mes: i + 1,
          valor: m.valor,
          usuario: this.fullName || this.userEmail || 'ADMIN'
        };
        const obs = this.selectedProducto === 'CostoDirecto'
          ? this.service.guardarCostoDirecto(payload)
          : this.service.guardarMeta(payload);

        obs.subscribe({
          next: () => {
            requestsPending--;
            if (requestsPending === 0) this.finalizeBatchSave();
          },
          error: () => {
            requestsPending--;
            if (requestsPending === 0) this.finalizeBatchSave();
          }
        });
    });
  }

  finalizeBatchSave() {
    if (this.selectedProductObj && this.selectedProductObj.id !== 'CostoDirecto') {
      // Send only necessary fields to avoid Jackson issues with complex lists/objects
      const updatePayload: any = {
        id: this.selectedProductObj.id,
        nombre: this.selectedProductObj.nombre,
        sentidoMeta: this.selectedProductObj.sentidoMeta,
        idProductoSiesa: this.selectedProductObj.idProductoSiesa,
        usaSuma: this.selectedProductObj.usaSuma || false,
        esCompuesto: this.selectedProductObj.esCompuesto,
        componenteSiesaIds: this.selectedProductObj.componenteSiesaIds,
        mostrarCmi: this.selectedProductObj.mostrarCmi ?? true,
        metaDiariaManual: this.selectedProductObj.metaDiariaManual ?? false,
        idProductoTbs: this.selectedProductObj.idProductoTbs,
        idTbsTipoDoc: this.selectedProductObj.idTbsTipoDoc,
        tbsDescripcion: this.selectedProductObj.tbsDescripcion,
        seccionId: this.selectedProductObj.seccionId,
        seccionNombre: this.selectedProductObj.seccionNombre,
        ordenReporte: this.selectedProductObj.ordenReporte
      };

      this.service.actualizarProducto(updatePayload).subscribe({
        next: () => {
          this.guardando = false;
          this.showToast('Cambios sincronizados correctamente', 'success');
          this.cargarMetas();
          this.cargarProductos();
        },
        error: (err) => {
          console.error('Error al actualizar producto:', err);
          this.guardando = false;
          this.showToast('Metas guardadas, pero error al actualizar comportamiento', 'error');
          this.cargarMetas();
          this.cargarProductos();
        }
      });
    } else {
      this.guardando = false;
      this.showToast('Cambios sincronizados correctamente', 'success');
      this.cargarMetas();
      this.cargarProductos();
    }
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toast = { visible: true, message, type };
    setTimeout(() => this.toast.visible = false, 3000);
  }

  isEntradaDoc(codigo: string): boolean {
    if (!codigo) return false;
    const upperCode = codigo.toUpperCase();
    // Typical Siesa Entradas
    if (upperCode === 'EI' || upperCode === 'EDP' || upperCode === 'AI' || upperCode === 'EPA') return true;
    // Typical Siesa Salidas
    if (upperCode === 'TEP' || upperCode === 'RM' || upperCode === 'SM' || upperCode === 'SIP') return false;
    // Fallback heuristic
    return upperCode.startsWith('E') || upperCode.startsWith('A');
  }

  openProductModal(p?: producto, mode: 'general' | 'erp' = 'general') {
    this.editModeType = mode;
    this.isEditingProduct = !!p;
    this.currentProduct = p ? { ...p } : { 
      id: '', nombre: '', idProductoSiesa: '', consumptionDocTypes: [], productionDocTypes: [], sentidoMeta: true, mostrarCmi: true, produccionBaseId: '26'
    };
    
    // Reconstruir tempConsumoDocs con orden correcto desde el backend
    const rawConsumoDocs = (p?.consumptionDocIds || []).map((id, idx) => {
      const doc = this.tiposDocumento.find(d => String(d.id) === String(id));
      const orden = p?.consumptionDocOrden ? (p.consumptionDocOrden[idx] ?? idx) : idx;
      const origenId = p?.consumptionDocOrigenIds ? p.consumptionDocOrigenIds[idx] : null;
      return { id: id, codigo: doc ? doc.codigo : '?', orden, origenId };
    });
    // Ordenar por orden ASC (ya viene del backend, pero por seguridad)
    rawConsumoDocs.sort((a, b) => a.orden - b.orden);
    
    // Clasificar por zona según valor de orden: 0-99 (0), 100-199 (1), 200-299 (2), 300-399 (3), 400-499 (4)
    this.tempConsumoZonas = [[], [], [], [], []];
    let maxZoneIdx = 0;
    rawConsumoDocs.forEach(d => {
      const zoneIdx = Math.min(4, Math.max(0, Math.floor(d.orden / 100)));
      this.tempConsumoZonas[zoneIdx].push(d);
      if (zoneIdx > maxZoneIdx) maxZoneIdx = zoneIdx;
    });

    this.tempConsumoSalidas = this.tempConsumoZonas[0];
    this.tempConsumoEntradas = this.tempConsumoZonas[1];
    this.tempConsumoDocs = [...rawConsumoDocs];
    
    let activeOps: string[] = [];
    if (p && p.formulaOperadores) {
      const isDefault = p.formulaOperadores.length === 4 && p.formulaOperadores.every(op => op === '+');
      if (isDefault) {
        activeOps = p.formulaOperadores.slice(0, maxZoneIdx);
      } else {
        activeOps = [...p.formulaOperadores];
        while (activeOps.length > maxZoneIdx && (activeOps[activeOps.length - 1] === '+' || activeOps[activeOps.length - 1] === '')) {
          activeOps.pop();
        }
      }
    } else {
      if (maxZoneIdx > 0) {
        activeOps = Array(maxZoneIdx).fill(p && p.usaSuma === true ? '+' : '-');
      } else {
        activeOps = [];
      }
    }
    this.tempConsumoOperadores = activeOps;
    
    this.isFormulaDividedConsumo = this.tempConsumoOperadores.length > 0;

    // Reconstruir tempProduccionDocs con orden correcto desde el backend
    const rawProduccionDocs = (p?.productionDocIds || []).map((id, idx) => {
      const doc = this.tiposDocumento.find(d => String(d.id) === String(id));
      const orden = p?.productionDocOrden ? (p.productionDocOrden[idx] ?? idx) : idx;
      const origenId = p?.productionDocOrigenIds ? p.productionDocOrigenIds[idx] : null;
      return { id: id, codigo: doc ? doc.codigo : '?', orden, origenId };
    });
    rawProduccionDocs.sort((a, b) => a.orden - b.orden);
    this.tempProduccionSalidas = rawProduccionDocs.filter(d => d.orden < 100);
    this.tempProduccionEntradas = rawProduccionDocs.filter(d => d.orden >= 100);
    this.tempProduccionDocs = [...this.tempProduccionSalidas, ...this.tempProduccionEntradas];

    this.siesaSearchId = p?.idProductoSiesa || '';
    this.productWasSaved = false;
    this.tempComponentes = [...(p?.componenteSiesaIds || [])];
    this.isCompuestoToggle = this.tempComponentes.length > 0;
    this.tempUsaSuma = p ? (p.usaSuma ?? true) : true;
    this.nuevoComponenteId = '';
    
    // Determine if it was "Consumo Especifico"
    if (this.isEditingProduct) {
      const isDefaultBase = this.currentProduct.produccionBaseId === '26';
      const hasSpecificDocs = this.tempProduccionDocs.some(d => ['EI', 'EDP', 'AI'].includes(d.codigo));
      this.esConsumoEspecifico = isDefaultBase && hasSpecificDocs;
    } else {
      this.esConsumoEspecifico = true;
    }
    
    this.showProductModal = true;
  }




  getAvailableDocs(type: 'CONSUMO' | 'PRODUCCION'): any[] {
    const selected = type === 'CONSUMO' ? this.tempConsumoDocs : this.tempProduccionDocs;
    
    // Identificar productos base (componentes o el producto mismo)
    let bases = [];
    if (this.isCompuestoToggle && this.tempComponentes.length > 0) {
      bases = this.tempComponentes.map(c => ({ id: c, nombre: this.getItemName(c) }));
    } else {
      const siesaId = this.currentProduct?.idProductoSiesa || this.siesaSearchId;
      if (siesaId) {
        bases.push({ id: siesaId, nombre: this.currentProduct?.nombre || '' });
      } else {
        bases.push({ id: null, nombre: 'Producto' });
      }
    }

    const available = [];
    for (const doc of this.tiposDocumento) {
      for (const base of bases) {
        // Verificar si esta combinacion exacta ya esta seleccionada
        const isSelected = selected.some(s => String(s.id) === String(doc.id) && s.origenId === base.id);
        if (!isSelected) {
          available.push({
            id: doc.id,
            codigo: doc.codigo,
            origenId: base.id,
            origenNombre: base.nombre
          });
        }
      }
    }
    return available;
  }

  quickAddDoc(type: 'CONSUMO' | 'PRODUCCION', doc: any) {
    if (type === 'CONSUMO') {
      if (!this.tempConsumoDocs.find(d => d.id === doc.id && d.origenId === doc.origenId)) {
        this.tempConsumoZonas[0].push({ id: doc.id, codigo: doc.codigo, origenId: doc.origenId });
        this.tempConsumoDocs = [
          ...this.tempConsumoZonas[0],
          ...this.tempConsumoZonas[1],
          ...this.tempConsumoZonas[2],
          ...this.tempConsumoZonas[3],
          ...this.tempConsumoZonas[4]
        ];
        this.tempConsumoSalidas = this.tempConsumoZonas[0];
        this.tempConsumoEntradas = this.tempConsumoZonas[1];
      }
    } else {
      if (!this.tempProduccionDocs.find(d => d.id === doc.id && d.origenId === doc.origenId)) {
        this.tempProduccionEntradas.push({ id: doc.id, codigo: doc.codigo, origenId: doc.origenId });
        this.tempProduccionDocs = [...this.tempProduccionSalidas, ...this.tempProduccionEntradas];
      }
    }
  }

  removeDoc(type: 'CONSUMO' | 'PRODUCCION', doc: any) {
    if (type === 'CONSUMO') {
      this.tempConsumoZonas = this.tempConsumoZonas.map(zona => 
        zona.filter(d => !(d.id === doc.id && d.origenId === doc.origenId))
      );
      this.tempConsumoDocs = [
        ...this.tempConsumoZonas[0],
        ...this.tempConsumoZonas[1],
        ...this.tempConsumoZonas[2],
        ...this.tempConsumoZonas[3],
        ...this.tempConsumoZonas[4]
      ];
      this.tempConsumoSalidas = this.tempConsumoZonas[0];
      this.tempConsumoEntradas = this.tempConsumoZonas[1];
    } else {
      this.tempProduccionSalidas = this.tempProduccionSalidas.filter(d => !(d.id === doc.id && d.origenId === doc.origenId));
      this.tempProduccionEntradas = this.tempProduccionEntradas.filter(d => !(d.id === doc.id && d.origenId === doc.origenId));
      this.tempProduccionDocs = [...this.tempProduccionSalidas, ...this.tempProduccionEntradas];
    }
  }

  // --- Drag and Drop Logic ---
  onDragStart(event: DragEvent, doc: any, source: string) {
    this.draggedDoc = doc;
    this.dragSource = source;
  }

  onDragStartSign(event: DragEvent, sign: string) {
    this.draggedSign = sign;
  }

  onDropSign(event: DragEvent) {
    event.preventDefault();
    if (this.draggedSign !== null) {
      const op = typeof this.draggedSign === 'boolean' ? (this.draggedSign ? '+' : '-') : String(this.draggedSign);
      this.addOperator(op);
      this.draggedSign = null;
    }
  }

  addOperator(op: string) {
    if (this.tempConsumoOperadores.length >= 4) {
      this.showToast('Máximo de 5 zonas alcanzado (4 signos)', 'error');
      return;
    }
    this.tempConsumoOperadores.push(op);
    this.syncAllConsumptionDocs();
  }

  removeOperator(idx: number) {
    if (idx < 0 || idx >= this.tempConsumoOperadores.length) return;
    // Merge documents of zone idx + 1 into zone idx
    this.tempConsumoZonas[idx] = [...this.tempConsumoZonas[idx], ...this.tempConsumoZonas[idx + 1]];
    // Shift remaining zones down
    for (let i = idx + 1; i < 4; i++) {
      this.tempConsumoZonas[i] = this.tempConsumoZonas[i + 1];
    }
    this.tempConsumoZonas[4] = []; // Clear the last one
    
    // Remove the operator
    this.tempConsumoOperadores.splice(idx, 1);
    this.syncAllConsumptionDocs();
  }

  syncAllConsumptionDocs() {
    this.tempConsumoDocs = [];
    for (let i = 0; i <= this.tempConsumoOperadores.length; i++) {
      this.tempConsumoDocs = [...this.tempConsumoDocs, ...this.tempConsumoZonas[i]];
    }
    this.tempConsumoSalidas = this.tempConsumoZonas[0];
    this.tempConsumoEntradas = this.tempConsumoZonas[1] || [];
  }

  allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  onDropConsumoZona(event: DragEvent, zoneIdx: number) {
    event.preventDefault();
    if (this.draggedDoc) {
      this.moveDoc(this.draggedDoc, this.dragSource, 'ZONA_' + zoneIdx);
    }
  }

  onDropSalidas(event: DragEvent) {
    event.preventDefault();
    if (this.draggedSign !== null) {
      this.tempUsaSuma = this.draggedSign === '+';
      this.isFormulaDividedConsumo = true;
      this.draggedSign = null;
    } else if (this.draggedDoc) {
      this.moveDoc(this.draggedDoc, this.dragSource, 'SALIDAS');
    }
  }

  onDropEntradas(event: DragEvent) {
    event.preventDefault();
    if (this.draggedSign !== null) {
      this.tempUsaSuma = this.draggedSign === '+';
      this.isFormulaDividedConsumo = true;
      this.draggedSign = null;
    } else if (this.draggedDoc) {
      this.moveDoc(this.draggedDoc, this.dragSource, 'ENTRADAS');
    }
  }

  onDropAvailable(event: DragEvent) {
    event.preventDefault();
    this.moveDoc(this.draggedDoc, this.dragSource, 'AVAILABLE');
  }

  onDropProdSalidas(event: DragEvent) {
    event.preventDefault();
    this.moveDoc(this.draggedDoc, this.dragSource, 'PROD_SALIDAS');
  }

  onDropProdEntradas(event: DragEvent) {
    event.preventDefault();
    this.moveDoc(this.draggedDoc, this.dragSource, 'PROD_ENTRADAS');
  }

  onDropProdAvailable(event: DragEvent) {
    event.preventDefault();
    this.moveDoc(this.draggedDoc, this.dragSource, 'PROD_AVAILABLE');
  }

  moveDoc(doc: any, from: string, to: string) {
    if (!doc || from === to) return;
    
    // Remove from source
    if (from.startsWith('ZONA_')) {
      const fromIdx = parseInt(from.split('_')[1]);
      this.tempConsumoZonas[fromIdx] = this.tempConsumoZonas[fromIdx].filter(d => !(d.id === doc.id && d.origenId === doc.origenId));
    } else if (from === 'SALIDAS') {
      this.tempConsumoZonas[0] = this.tempConsumoZonas[0].filter(d => !(d.id === doc.id && d.origenId === doc.origenId));
    } else if (from === 'ENTRADAS') {
      this.tempConsumoZonas[1] = this.tempConsumoZonas[1].filter(d => !(d.id === doc.id && d.origenId === doc.origenId));
    } else if (from === 'PROD_SALIDAS') {
      this.tempProduccionSalidas = this.tempProduccionSalidas.filter(d => !(d.id === doc.id && d.origenId === doc.origenId));
    } else if (from === 'PROD_ENTRADAS') {
      this.tempProduccionEntradas = this.tempProduccionEntradas.filter(d => !(d.id === doc.id && d.origenId === doc.origenId));
    }

    // Add to target
    if (to.startsWith('ZONA_')) {
      const toIdx = parseInt(to.split('_')[1]);
      this.tempConsumoZonas[toIdx].push(doc);
    } else if (to === 'SALIDAS') {
      this.tempConsumoZonas[0].push(doc);
    } else if (to === 'ENTRADAS') {
      this.tempConsumoZonas[1].push(doc);
    } else if (to === 'PROD_SALIDAS') {
      this.tempProduccionSalidas.push(doc);
    } else if (to === 'PROD_ENTRADAS') {
      this.tempProduccionEntradas.push(doc);
    }

    this.tempConsumoSalidas = this.tempConsumoZonas[0];
    this.tempConsumoEntradas = this.tempConsumoZonas[1];

    this.tempConsumoDocs = [
      ...this.tempConsumoZonas[0],
      ...this.tempConsumoZonas[1],
      ...this.tempConsumoZonas[2],
      ...this.tempConsumoZonas[3],
      ...this.tempConsumoZonas[4]
    ];
    this.tempProduccionDocs = [...this.tempProduccionSalidas, ...this.tempProduccionEntradas];
  }
  // ---------------------------

  agregarComponente() {
    const id = String(this.nuevoComponenteId || '').trim();
    if (!id) return this.showToast('Ingresa un ID Siesa', 'error');
    if (this.tempComponentes.includes(id)) return this.showToast('Componente ya agregado', 'error');
    
    this.isAddingComponent = true;
    this.service.validarProductoEnSiesa(id).subscribe({
      next: (data) => {
        this.isAddingComponent = false;
        if (data) {
          this.tempComponentes.push(id);
          this.nuevoComponenteId = '';
          this.showToast(`Componente ${data.nombre} agregado`, 'success');
          this.cdr.detectChanges();
        } else {
          this.showToast('Componente no encontrado en Siesa', 'error');
        }
      },
      error: () => {
        this.isAddingComponent = false;
        this.showToast('Error al conectar con Siesa', 'error');
      }
    });
  }

  onCompuestoToggleChange() {
    if (!this.isCompuestoToggle) {
      this.tempComponentes = [];
      this.cdr.detectChanges();
    }
  }

  onCompuestoClick() {
    if (this.isEditingProduct) {
      this.showToast('No se puede cambiar el tipo de producto una vez creado', 'error');
    }
  }

  getDocsString(docs: any[]): string {
    if (!docs || docs.length === 0) return 'Vacío';
    return docs.map(d => d.codigo).join(' + ');
  }

  buscarEnSiesa() {
    if (!this.siesaSearchId) return this.showToast('Ingresa un ID para buscar', 'error');
    this.isSearchingSiesa = true;
    this.service.validarProductoEnSiesa(this.siesaSearchId).subscribe({
      next: (data) => {
        this.isSearchingSiesa = false;
        if (data) {
          this.currentProduct.nombre = data.nombre;
          this.currentProduct.idProductoSiesa = data.id;
          this.showToast('Producto encontrado en Siesa', 'success');
          this.cdr.detectChanges();
        } else {
          this.showToast('Producto no encontrado en Siesa', 'error');
        }
      },
      error: () => {
        this.isSearchingSiesa = false;
        this.showToast('Error al conectar con Siesa', 'error');
      }
    });
  }

  closeProductModal() { 
    this.showProductModal = false; 
    this.showConfirmDuplicateModal = false;
    this.duplicateProductInfo = null;
  }

  guardarProducto() {
    if (!this.currentProduct.nombre) return this.showToast('El nombre es obligatorio', 'error');
    
    // Check for duplicates
    if (this.currentProduct.idProductoSiesa) {
      const duplicate = this.productosOriginales.find(p =>
        String(p.idProductoSiesa) === String(this.currentProduct.idProductoSiesa) && p.id !== this.currentProduct.id
      );
      if (duplicate && !this.isCompuestoToggle) {
        this.duplicateProductInfo = duplicate;
        this.showConfirmDuplicateModal = true;
        return;
      }
    }

    if (this.isCompuestoToggle && this.tempComponentes.length < 2) {
      return this.showToast('Un producto compuesto debe tener al menos 2 componentes', 'error');
    }

    if (this.tempConsumoDocs.length === 0) {
      return this.showToast('La selección debe tener al menos un documento', 'error');
    }

    this.ejecutarGuardadoProducto();
  }

  confirmarGuardarDuplicado() {
    this.showConfirmDuplicateModal = false;
    this.ejecutarGuardadoProducto();
  }

  ejecutarGuardadoProducto() {
    if (this.isCompuestoToggle) {
      this.currentProduct.idProductoSiesa = ''; // Forzar ID vacío para usar el ID interno en el dashboard
    }
    this.currentProduct.usaSuma = this.tempUsaSuma ?? false;
    this.currentProduct.esCompuesto = this.isCompuestoToggle;
    this.currentProduct.componenteSiesaIds = [...this.tempComponentes];
    this.currentProduct.formulaOperadores = [...this.tempConsumoOperadores];

    if (this.esConsumoEspecifico) {
      this.currentProduct.produccionBaseId = '26';
      const requiredDocs = ['EI', 'EDP', 'AI'];
      const docs = this.tiposDocumento
        .filter(d => requiredDocs.includes(d.codigo))
        .map(d => ({ id: d.id, codigo: d.codigo }));
        
      this.tempProduccionDocs = docs;
      this.tempProduccionSalidas = [];
      this.tempProduccionEntradas = [...docs];
    }
    
    const obs = this.isEditingProduct 
      ? this.service.actualizarProducto(this.currentProduct)
      : this.service.insertarProducto(this.currentProduct);

    obs.subscribe({
      next: (res: any) => {
        this.productWasSaved = true;
        const productId = this.isEditingProduct ? this.currentProduct.id : String(res?.id ?? '');
        if (!productId) return this.showToast('Error al obtener ID del producto', 'error');
        this.currentProduct.id = productId;
        this.sincronizarDocumentos(productId);
      },
      error: () => this.showToast('Error al procesar producto', 'error')
    });
  }

  private sincronizarDocumentos(productId: string) {
    this.service.eliminarTipoDocumento(productId).subscribe({
      next: () => {
        const consumptionMov = this.tiposMovimiento.find(m => m.codigo === 'CONSUMO');
        const productionMov = this.tiposMovimiento.find(m => m.codigo === 'PRODUCCION');
        if (!consumptionMov || !productionMov) return this.showToast('Tipos de movimiento no encontrados', 'error');

        const syncTasks: any[] = [];

        this.tempConsumoZonas.forEach((zona, zoneIdx) => {
          zona.forEach((d, i) => {
            syncTasks.push(this.service.insertarTipoDocumento(productId, consumptionMov.id.toString(), d.id.toString(), zoneIdx * 100 + i, d.origenId));
          });
        });
        this.tempProduccionSalidas.forEach((d, i) =>
          syncTasks.push(this.service.insertarTipoDocumento(productId, productionMov.id.toString(), d.id.toString(), i, d.origenId))
        );
        this.tempProduccionEntradas.forEach((d, i) =>
          syncTasks.push(this.service.insertarTipoDocumento(productId, productionMov.id.toString(), d.id.toString(), 100 + i, d.origenId))
        );

        if (syncTasks.length === 0) return this.finalizeProductSave();
        this.processSyncTasks(syncTasks);
      },
      error: () => {
        this.showToast('Error al limpiar asociaciones', 'error');
        this.finalizeProductSave();
      }
    });
  }

  processSyncTasks(tasks: any[], index: number = 0) {
    if (index >= tasks.length) return this.finalizeProductSave();
    tasks[index].subscribe(() => this.processSyncTasks(tasks, index + 1));
  }

  finalizeProductSave() {
    const productId = this.currentProduct.id;
    this.service.guardarComponentes(productId, this.tempComponentes, this.tempUsaSuma).subscribe({
      next: () => {
        this.showToast(this.isEditingProduct ? 'Producto actualizado' : 'Producto creado', 'success');
        this.cargarProductos();
        if (this.isEditingProduct) this.closeProductModal();
      },
      error: () => {
        this.showToast('Error al guardar componentes', 'error');
        this.cargarProductos();
        if (this.isEditingProduct) this.closeProductModal();
      }
    });
  }

  openDocTypeModal(doc?: any) {
    this.isEditingDocType = !!doc;
    this.currentDocType = doc ? { ...doc } : { id: null, codigo: '', descripcion: '', estado: 'Activo' };
    this.showDocTypeModal = true;
  }

  closeDocTypeModal() {
    this.showDocTypeModal = false;
  }

  guardarTipoDoc() {
    if (!this.currentDocType.codigo || !this.currentDocType.descripcion) {
      return this.showToast('El código y la descripción son obligatorios', 'error');
    }

    this.service.guardarTipoDocumento(this.currentDocType).subscribe({
      next: () => {
        this.showToast(this.isEditingDocType ? 'Tipo de documento actualizado' : 'Tipo de documento agregado', 'success');
        this.closeDocTypeModal();
        this.service.getTiposDocumento().subscribe(res => {
          this.tiposDocumento = res;
          this.cdr.detectChanges();
        });
      },
      error: () => this.showToast('Error al guardar el tipo de documento', 'error')
    });
  }

  agregarTipoDocumento(p: producto) {
    const state = this.getLinkingState(p.id);
    if (!state.code || !state.type) return this.showToast('Selecciona movimiento y documento', 'error');
    this.service.insertarTipoDocumento(p.id, state.type, state.code).subscribe({
      next: () => {
        this.showToast('Documento vinculado', 'success');
        state.code = '';
        this.cargarProductos();
      },
      error: () => this.showToast('Error al vincular documento', 'error')
    });
  }

  goToDashboard(p: producto) {
    this.router.navigate(['/cmi/productos']);
  }

  getConsumptionScope(): string {
    if (this.isCompuestoToggle && this.tempComponentes.length > 0) {
      return this.tempComponentes.join(' + ');
    }
    return this.currentProduct.nombre || 'N/A';
  }

  getItemName(idSiesa: string): string {
    if (idSiesa === '26') return 'Aceite Crudo de Palma';
    const p = this.productosOriginales.find(p => String(p.idProductoSiesa) === String(idSiesa));
    return p ? p.nombre : idSiesa;
  }

  getConsumptionScopeNames(): string {
    if (this.isCompuestoToggle && this.tempComponentes.length > 0) {
      return this.tempComponentes.map(id => this.getItemName(id)).join(' + ');
    }
    return this.getItemName(this.currentProduct.idProductoSiesa || '');
  }

  getProductionScopeNames(): string {
    return this.getItemName(this.currentProduct.produccionBaseId || '26');
  }

  getProductionScope(): string {
    return this.currentProduct.produccionBaseId || '26';
  }

  getProductScope(): string {
    if (this.isCompuestoToggle && this.tempComponentes.length > 0) {
      return this.tempComponentes.join(' + ');
    }
    return this.currentProduct.idProductoSiesa || 'N/A';
  }

  getProductoFormulaPartes(p: producto): { zonas: string[][], operadores: string[] } {
    const zones: string[][] = [[], [], [], [], []];
    
    (p.consumptionDocOrden || []).forEach((orden, idx) => {
      const codigo = p.consumptionDocTypes ? p.consumptionDocTypes[idx] : '';
      const origenId = p.consumptionDocOrigenIds ? p.consumptionDocOrigenIds[idx] : null;
      if (codigo) {
        const text = origenId ? `${codigo} (${this.getItemName(origenId)})` : codigo;
        const zoneIdx = Math.min(4, Math.max(0, Math.floor(orden / 100)));
        zones[zoneIdx].push(text);
      }
    });

    return {
      zonas: zones,
      operadores: p.formulaOperadores || ['+', '+', '+', '+']
    };
  }

  isProductConsumoEspecifico(p: producto): boolean {
    const isDefaultBase = p.produccionBaseId === '26';
    const hasSpecificDocs = (p.productionDocTypes || []).some(t => ['EI', 'EDP', 'AI'].includes(t));
    return isDefaultBase && hasSpecificDocs;
  }

  getProductoFormulaTokens(p: producto): { type: string, text: string }[] {
    if (p.id === 'CostoDirecto') return [];
    const tokens: { type: string, text: string }[] = [];
    const partes = this.getProductoFormulaPartes(p);
    
    // Check if any zone actually has documents
    const hasAnyDocs = partes.zonas.some(z => z.length > 0);
    if (!hasAnyDocs) return [];

    const isEspecifico = this.isProductConsumoEspecifico(p);
    if (isEspecifico) {
      tokens.push({ type: 'parenthesis', text: '(' });
    }
    
    let printedAny = false;
    for (let i = 0; i < 5; i++) {
      const zoneDocs = partes.zonas[i];
      if (zoneDocs && zoneDocs.length > 0) {
        if (printedAny) {
          const op = partes.operadores[i - 1] || '+';
          tokens.push({ type: 'operator', text: ` ${op} ` });
        }
        // Join the documents of this zone with '+'
        zoneDocs.forEach((doc, docIdx) => {
          if (docIdx > 0) {
            tokens.push({ type: 'operator', text: ' + ' });
          }
          tokens.push({ type: 'doc', text: doc });
        });
        printedAny = true;
      }
    }
    
    if (isEspecifico) {
      tokens.push({ type: 'parenthesis', text: ')' });
      tokens.push({ type: 'operator', text: ' / ' });
      tokens.push({ type: 'doc', text: 'Producción B100' });
    }
    
    return tokens;
  }
  
}