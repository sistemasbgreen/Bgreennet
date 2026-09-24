import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LogisticoService, ProductoConfigItem } from '../../../servicios/LogisticoService';

interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-logistico-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './logistico-config.html',
  styleUrl: './logistico-config.css'
})
export class LogisticoConfig implements OnInit {

  // Lista de productos por defecto (fallback)
  private readonly PRODUCTOS_DEFAULT: string[] = [
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

  productos: ProductoConfigItem[] = [];
  loading: boolean = false;
  guardando: boolean = false;

  // Filtros
  searchQuery: string = '';
  filtroEstado: 'TODOS' | 'PERMITIDOS' | 'OCULTOS' = 'TODOS';

  // Formulario nuevo producto
  nuevoProductoNombre: string = '';
  nuevoProductoPermitido: boolean = true;

  // Toast feedback
  toast: ToastState = { visible: false, message: '', type: 'success' };
  private toastTimeout: any = null;

  escaneandoTBS: boolean = false;

  constructor(
    private logisticoSvc: LogisticoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.loading = true;
    this.logisticoSvc.getProductosConfig().subscribe({
      next: (data: ProductoConfigItem[]) => {
        this.productos = Array.isArray(data) ? data : [];
        this.loading = false;
        this.cdr.detectChanges();
        // Escanear operaciones TBS para detectar productos no registrados
        this.escanearProductosTBS(false);
      },
      error: (err: any) => {
        console.warn('Error al conectar con BD, usando catálogo por defecto:', err?.error?.detalle || err?.message || err);
        this.loading = false;
        if (this.productos.length === 0) {
          this.productos = this.PRODUCTOS_DEFAULT.map((p, idx) => ({
            id: idx + 1,
            nombreProducto: p,
            permitido: true,
            usuario: 'DEFAULT'
          }));
        }
        this.showToast('error', 'No fue posible conectar con el servidor. Mostrando lista local.');
        this.cdr.detectChanges();
      }
    });
  }

  escanearProductosTBS(mostrarFeedback: boolean = false): void {
    this.escaneandoTBS = true;
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];
    const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const companyId = localStorage.getItem('LOGISTICO_COMPANY_ID') || '900715610';

    this.logisticoSvc.getTransportes(companyId, hace30Dias, hoyStr).subscribe({
      next: (res: any) => {
        this.escaneandoTBS = false;
        let rawList: any[] = [];
        if (Array.isArray(res)) rawList = res;
        else if (res && Array.isArray(res.data)) rawList = res.data;
        else if (res && Array.isArray(res.transports)) rawList = res.transports;
        else if (res && Array.isArray(res.items)) rawList = res.items;

        const currentNormNames = new Set(this.productos.map(p => this.normalize(p.nombreProducto)));
        let nuevosDetectados = 0;

        for (const item of rawList) {
          const prodRaw = String(item.products || item.producto || '').trim();
          if (!prodRaw || prodRaw === 'N/A' || prodRaw === '—') continue;

          const norm = this.normalize(prodRaw);
          if (!currentNormNames.has(norm)) {
            currentNormNames.add(norm);
            nuevosDetectados++;
            this.logisticoSvc.guardarProductoConfig({
              nombreProducto: prodRaw,
              permitido: false,
              usuario: 'DETECTADO_TBS'
            }).subscribe({
              next: (nuevo: ProductoConfigItem) => {
                if (nuevo && !this.productos.some(p => this.normalize(p.nombreProducto) === this.normalize(nuevo.nombreProducto))) {
                  this.productos.push(nuevo);
                  this.cdr.detectChanges();
                }
              }
            });
          }
        }

        if (mostrarFeedback) {
          if (nuevosDetectados > 0) {
            this.showToast('success', `Se detectaron e importaron ${nuevosDetectados} nuevo(s) producto(s) desde operaciones TBS.`);
          } else {
            this.showToast('success', 'Catálogo al día. No se detectaron productos nuevos en operaciones TBS.');
          }
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.escaneandoTBS = false;
        if (mostrarFeedback) {
          this.showToast('error', 'No fue posible conectarse con la API de TBS para escanear productos.');
        }
      }
    });
  }

  private normalize(str: string | undefined | null): string {
    if (!str) return '';
    return str.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  agregarProducto(): void {
    const nombre = this.nuevoProductoNombre.trim();
    if (!nombre) {
      this.showToast('error', 'Por favor ingresa un nombre para el producto.');
      return;
    }

    this.guardando = true;
    this.logisticoSvc.guardarProductoConfig({
      nombreProducto: nombre,
      permitido: this.nuevoProductoPermitido,
      usuario: 'ADMIN_CONFIG'
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.nuevoProductoNombre = '';
        this.nuevoProductoPermitido = true;
        this.showToast('success', `Producto "${nombre}" guardado exitosamente en base de datos.`);
        this.cargarProductos();
      },
      error: (err: any) => {
        this.guardando = false;
        this.showToast('error', 'Error al guardar producto: ' + (err?.error?.detalle || err?.message || 'Error desconocido'));
      }
    });
  }

  toggleProducto(item: ProductoConfigItem): void {
    if (!item.id) return;

    this.logisticoSvc.toggleProducto(item.id).subscribe({
      next: (actualizado: ProductoConfigItem) => {
        item.permitido = actualizado.permitido;
        const estadoTexto = item.permitido ? 'Visible en principal' : 'Oculto';
        this.showToast('success', `"${item.nombreProducto}" ahora está ${estadoTexto}.`);
      },
      error: (err: any) => {
        this.showToast('error', 'Error al cambiar visibilidad: ' + (err?.error?.detalle || err?.message || 'Error'));
        this.cargarProductos();
      }
    });
  }

  eliminarProducto(item: ProductoConfigItem): void {
    if (!item.id) return;
    if (!confirm(`¿Estás seguro de eliminar "${item.nombreProducto}" de la configuración?`)) {
      return;
    }

    this.logisticoSvc.eliminarProductoConfig(item.id).subscribe({
      next: () => {
        this.showToast('success', `Producto "${item.nombreProducto}" eliminado.`);
        this.cargarProductos();
      },
      error: (err: any) => {
        this.showToast('error', 'Error al eliminar producto: ' + (err?.error?.detalle || err?.message || 'Error'));
      }
    });
  }

  // Getters para filtrado y métricas
  get productosFiltrados(): ProductoConfigItem[] {
    const q = this.searchQuery.trim().toLowerCase();

    return this.productos.filter(p => {
      // Filtro de texto
      if (q && !p.nombreProducto.toLowerCase().includes(q)) {
        return false;
      }

      // Filtro de estado
      if (this.filtroEstado === 'PERMITIDOS' && !p.permitido) return false;
      if (this.filtroEstado === 'OCULTOS' && p.permitido) return false;

      return true;
    });
  }

  get totalRegistrados(): number {
    return this.productos.length;
  }

  get totalPermitidos(): number {
    return this.productos.filter(p => p.permitido).length;
  }

  get totalOcultos(): number {
    return this.productos.filter(p => !p.permitido).length;
  }

  showToast(type: 'success' | 'error', message: string): void {
    this.toast = { visible: true, message, type };
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toast.visible = false;
      this.cdr.detectChanges();
    }, 4000);
    this.cdr.detectChanges();
  }
}
