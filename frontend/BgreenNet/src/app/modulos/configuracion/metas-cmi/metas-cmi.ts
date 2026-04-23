import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  productos: producto[] = [];
  productosOriginales: producto[] = [];
  selectedProducto: string = '';
  selectedAnio: string = new Date().getFullYear().toString();

  toast: ToastState = { visible: false, message: '', type: 'success' };
  
  showProductModal: boolean = false;
  showMetasModal: boolean = false;
  isEditingProduct: boolean = false;
  currentProduct: producto = { id: '', nombre: '', idProductoSiesa: '', consumptionDocTypes: [], productionDocTypes: [] };
  
  // Catalogos
  tiposDocumento: any[] = [];
  tiposMovimiento: any[] = [];
  
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
  cargando: boolean = false;

  constructor(
    private service: productoservices,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarProductos();
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
  }

  get selectedProductoNombre(): string {
    return this.productos.find(p => p.id === this.selectedProducto)?.nombre ?? '';
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
        this.cdr.detectChanges();
      },
      error: () => this.showToast('Error al cargar productos', 'error')
    });
  }

  openMetasModal(p: producto) {
    this.selectedProducto = p.id;
    this.selectedAnio = new Date().getFullYear().toString();
    this.metas = Array(12).fill(0).map(() => ({ valor: 0 }));
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
        if (res.mensuales && res.mensuales.length === 12) {
          this.metas = res.mensuales;
        } else {
          this.metas = Array(12).fill(0).map(() => ({ valor: 0 }));
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Error al cargar metas', 'error');
        this.cargando = false;
        this.metas = Array(12).fill(0).map(() => ({ valor: 0 }));
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
    }
  }

  actualizarFiltro(event: any) {
    const valor = event.target.value.toLowerCase();
    if (!valor) {
      this.productos = [...this.productosOriginales];
      return;
    }
    this.productos = this.productosOriginales.filter(p => 
      p.nombre.toLowerCase().includes(valor) || 
      (p.idProductoSiesa && String(p.idProductoSiesa).toLowerCase().includes(valor))
    );
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
      usuario: 'ADMIN'
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
    let requestsPending = 12;
    this.metas.forEach((m, i) => {
        const payload = {
          productoId: this.selectedProducto,
          anio: parseInt(this.selectedAnio),
          mes: i + 1,
          valor: m.valor,
          usuario: 'ADMIN'
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
    this.guardando = false;
    this.showToast('Cambios sincronizados correctamente', 'success');
    this.cargarMetas();
    this.cargarProductos();
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toast = { visible: true, message, type };
    setTimeout(() => this.toast.visible = false, 3000);
  }

  removeDoc(type: 'CONSUMO' | 'PRODUCCION', docId: number) {
    if (type === 'CONSUMO') {
      this.tempConsumoDocs = this.tempConsumoDocs.filter(d => d.id !== docId);
    } else {
      this.tempProduccionDocs = this.tempProduccionDocs.filter(d => d.id !== docId);
    }
  }

  openProductModal(p?: producto) {
    this.isEditingProduct = !!p;
    this.currentProduct = p ? { ...p } : { 
      id: '', nombre: '', idProductoSiesa: '', consumptionDocTypes: [], productionDocTypes: [] 
    };
    this.tempConsumoDocs = (p?.consumptionDocIds || []).map(id => {
      const doc = this.tiposDocumento.find(d => String(d.id) === String(id));
      return { id: id, codigo: doc ? doc.codigo : '?' };
    });
    this.tempProduccionDocs = (p?.productionDocIds || []).map(id => {
      const doc = this.tiposDocumento.find(d => String(d.id) === String(id));
      return { id: id, codigo: doc ? doc.codigo : '?' };
    });
    this.siesaSearchId = '';
    this.productWasSaved = false;
    this.tempComponentes = [...(p?.componenteSiesaIds || [])];
    this.isCompuestoToggle = this.tempComponentes.length > 0;
    this.tempUsaSuma = p ? (p.usaSuma ?? false) : false;
    this.nuevoComponenteId = '';
    this.showProductModal = true;
  }



  getAvailableDocs(type: 'CONSUMO' | 'PRODUCCION'): any[] {
    const selectedIds = type === 'CONSUMO' 
      ? this.tempConsumoDocs.map(d => String(d.id)) 
      : this.tempProduccionDocs.map(d => String(d.id));
    
    return this.tiposDocumento.filter(d => !selectedIds.includes(String(d.id)));
  }

  quickAddDoc(type: 'CONSUMO' | 'PRODUCCION', doc: any) {
    const list = type === 'CONSUMO' ? this.tempConsumoDocs : this.tempProduccionDocs;
    if (list.find(d => d.id === doc.id)) return;
    list.push({ id: doc.id, codigo: doc.codigo });
  }

  agregarComponente() {
    const id = this.nuevoComponenteId?.trim();
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

  closeProductModal() { this.showProductModal = false; }

  guardarProducto() {
    if (!this.currentProduct.nombre) return this.showToast('El nombre es obligatorio', 'error');
    if (this.currentProduct.idProductoSiesa) {
      const duplicate = this.productosOriginales.find(p =>
        String(p.idProductoSiesa) === String(this.currentProduct.idProductoSiesa) && p.id !== this.currentProduct.id
      );
      if (duplicate) return this.showToast(`ID Siesa ya asignado a ${duplicate.nombre}`, 'error');
    }
    this.ejecutarGuardadoProducto();
  }

  ejecutarGuardadoProducto() {
    this.currentProduct.usaSuma = this.tempUsaSuma ?? false;
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
        this.tempConsumoDocs.forEach(d => syncTasks.push(this.service.insertarTipoDocumento(productId, consumptionMov.id.toString(), d.id.toString())));
        this.tempProduccionDocs.forEach(d => syncTasks.push(this.service.insertarTipoDocumento(productId, productionMov.id.toString(), d.id.toString())));

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
}