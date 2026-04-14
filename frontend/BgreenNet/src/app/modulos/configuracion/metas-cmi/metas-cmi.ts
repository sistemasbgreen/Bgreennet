import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
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
  imports: [CommonModule, FormsModule, DecimalPipe],
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
  isEditingProduct: boolean = false;
  currentProduct: producto = { id: '', nombre: '', idProductoSiesa: '', consumptionDocTypes: [], productionDocTypes: [] };
  
  // Catalogos
  tiposDocumento: any[] = [];
  tiposMovimiento: any[] = [];
  
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

  constructor(
    private service: productoservices,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarProductos();
  }

  cargarCatalogos() {
    this.service.getTiposMovimiento().subscribe(res => {
      this.tiposMovimiento = res;
    });
    this.service.getTiposDocumento().subscribe(res => {
      this.tiposDocumento = res;
    });
  }

  // ──────────────────────────────────────────────────────────
  // Computed getters
  // ──────────────────────────────────────────────────────────

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

  // ──────────────────────────────────────────────────────────
  // Data loading
  // ──────────────────────────────────────────────────────────

  cargarProductos() {
    this.service.getProductos().subscribe({
      next: (data) => {
        this.productosOriginales = [...data];
        this.productos = [...data];

        // Add Costo Directo option at the end
        this.productos.push({
          id: 'CostoDirecto',
          nombre: 'Costo Directo',
          consumptionDocTypes: [],
          productionDocTypes: []
        });

        // AUTO-LOAD: If no product is selected, pick the first one
        if (this.productos.length > 0 && !this.selectedProducto) {
          setTimeout(() => {
            this.selectedProducto = this.productos[0].id;
            this.cargarMetas();
            this.cdr.detectChanges();
          });
        }
      },
      error: () => this.showToast('Error al cargar productos', 'error')
    });
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
      },
      error: () => {
        this.showToast('Error al cargar metas', 'error');
        this.cargando = false;
        this.metas = Array(12).fill(0).map(() => ({ valor: 0 }));
      }
    });
  }

  // ──────────────────────────────────────────────────────────
  // Actions
  // ──────────────────────────────────────────────────────────

  onChange() {
    this.cargarMetas();
  }

  onProductoChange() {
    this.cargarMetas();
  }

  onAnioChange() {
    this.cargarMetas();
  }

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

  onInputFocus(event: any) {
    event.target.select();
  }

  onInputBlur(event: any) {
    // Optional: save on blur logic already exists in html as @blur="guardar(i)"
  }

  actualizarFiltro(event: any) {
    const valor = event.target.value.toLowerCase();
    this.productosOriginales = this.productos.filter(p => 
      p.nombre.toLowerCase().includes(valor) || 
      (p.idProductoSiesa && p.idProductoSiesa.toLowerCase().includes(valor))
    );
  }

  distribuirValorATodos() {
    if (this.distribuirValor < 0) return;
    this.metas.forEach(m => m.valor = this.distribuirValor);
    this.showToast(`Valor ${this.distribuirValor} aplicado a todos los meses`, 'success');
  }

  guardar(index?: number) {
    // If index is provided, we save just that month. 
    // If not, we could iterate and save all (global save button)
    if (index !== undefined) {
      this.guardarMes(index);
    } else {
      this.guardarTodo();
    }
  }

  guardarMes(index: number) {
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
        // Only show individual toast if we're not doing a mass save
        this.showToast(`Meta de ${this.meses[index]} guardada`, 'success');
        this.cargarMetas(); 
      },
      error: () => this.showToast('Error al guardar meta', 'error')
    });
  }

  guardarTodo() {
    this.guardando = true;
    // For now, sequentially or just a general success? 
    // Since big button exists, we should probably promise.all or similar if backend supported batch
    // Failing that, we save what's in local state
    this.showToast('Guardando todas las metas...', 'success');
    
    // Simple implementation: save all that have values
    let savedCount = 0;
    this.metas.forEach((m, i) => {
        this.guardarMes(i);
        savedCount++;
    });

    setTimeout(() => {
        this.guardando = false;
        this.showToast('Cambios sincronizados correctamente', 'success');
    }, 1500);
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toast = { visible: true, message, type };
    setTimeout(() => this.toast.visible = false, 3000);
  }

  // ──────────────────────────────────────────────────────────
  // Product & Docs Management
  // ──────────────────────────────────────────────────────────

  openAddProduct() {
    this.isEditingProduct = false;
    this.currentProduct = { id: '', nombre: '', idProductoSiesa: '', consumptionDocTypes: [], productionDocTypes: [] };
    this.showProductModal = true;
  }

  openEditProduct(p: producto) {
    this.isEditingProduct = true;
    this.currentProduct = { ...p };
    this.showProductModal = true;
  }

  closeProductModal() {
    this.showProductModal = false;
  }

  guardarProducto() {
    if (!this.currentProduct.nombre) {
      this.showToast('El nombre es obligatorio', 'error');
      return;
    }

    if (this.isEditingProduct && !this.currentProduct.id) {
       this.showToast('ID faltante para actualizar', 'error');
       return;
    }

    const obs = this.isEditingProduct 
      ? this.service.actualizarProducto(this.currentProduct)
      : this.service.insertarProducto(this.currentProduct);

    obs.subscribe({
      next: () => {
        this.showToast(this.isEditingProduct ? 'Producto actualizado' : 'Producto creado', 'success');
        this.cargarProductos();
        this.closeProductModal();
      },
      error: () => this.showToast('Error al procesar producto', 'error')
    });
  }

  agregarTipoDocumento(p: producto) {
    const state = this.getLinkingState(p.id);
    
    if (!state.code || !state.type) {
      this.showToast('Selecciona movimiento y documento', 'error');
      return;
    }

    // LOG BEFORE SENDING - Ensure all are sent as Numbers (INT)
    const payload = {
      productoId: Number(p.id),
      tipoMovimientoId: Number(state.type),
      tipoDocumentoId: Number(state.code)
    };

        this.cargarProductos();

    this.service.insertarTipoDocumento(
      payload.productoId.toString(), 
      payload.tipoMovimientoId.toString(), 
      payload.tipoDocumentoId.toString()
    ).subscribe({
      next: () => {
        this.showToast('Documento vinculado correctamente', 'success');
        state.code = '';
        this.cargarProductos();
      },
      error: () => this.showToast('Error al vincular documento', 'error')
    });
  }
}