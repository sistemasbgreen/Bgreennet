import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { OpDocto } from '../../models/OordenesProduccion/OpDocto';
import { OpDoctoService } from '../../servicios/OpDoctoService';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { productoservices } from '../../servicios/productoservices';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface SeccionReporte {
  nombre: string;
  items: OpDocto[];
  productoPrincipal: OpDocto | null;
}

interface OpGrupo {
  op: string;
  idOrden: string;
  fecha: string | null;
  status: string;
  items: OpDocto[];
  secciones: SeccionReporte[];
  totalOtrosCostos: number;
  totalManoObra: number;
  totalPurificacion: number;
}

@Component({
  selector: 'app-orden-produccion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orden-produccion.html',
  styleUrl: './orden-produccion.css',
})
export class OrdenProduccion implements OnInit, OnDestroy {

  documentos: OpDocto[] = [];
  opGrupos: OpGrupo[] = [];
  busqueda = '';

  loading = true;
  loadingFiltro = false;
  error = false;
  receptores = '';
  grupoPDF: OpGrupo | null = null;
  ultimaActualizacion: Date | null = null;
  enviandoId: string | null = null;

  // Filtro de fechas
  modoFiltro: 'default' | 'custom' = 'default';
  filtroFechaInicio = '';
  filtroFechaFin = '';

  // Mapeos ERP
  showModalMapeos = false;
  mapeosERP: any[] = [];

  get opGruposFiltrados(): OpGrupo[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.opGrupos;
    return this.opGrupos.filter(g =>
      g.op.toLowerCase().includes(q) ||
      g.idOrden.toLowerCase().includes(q) ||
      (g.fecha && g.fecha.toLowerCase().includes(q))
    );
  }

  get cantidadReceptores(): number {
    if (!this.receptores?.trim()) return 0;
    return this.receptores.split(',').filter(e => e.trim().length > 0).length;
  }

  // Modal state
  showModal = false;
  showEditReceptores = false;
  receptoresEdit = '';
  grupoSeleccionado: OpGrupo | null = null;

  private sub!: Subscription;

  constructor(
    private svc: OpDoctoService, 
    private cdr: ChangeDetectorRef,
    private prodSvc: productoservices
  ) {}

  ngOnInit(): void {
    // Inicializar fechas del filtro: últimos 15 días
    const hoy = new Date();
    const hace15 = new Date();
    hace15.setDate(hoy.getDate() - 15);
    this.filtroFechaFin   = hoy.toISOString().split('T')[0];
    this.filtroFechaInicio = hace15.toISOString().split('T')[0];

    this.cargarDatos();
    this.cargarMapeosERP();
    this.svc.getReceptores().subscribe(res => this.receptores = res);
  }

  cargarMapeosERP(): void {
    this.prodSvc.getProductos().subscribe({
      next: (prods) => {
        this.mapeosERP = prods
          .map(p => ({
            interno: p.id,
            siesa: p.idProductoSiesa,
            erp: p.idProductoTbs,
            desc: p.tbsDescripcion || p.nombre,
            bwart: p.idTbsTipoDoc || '101',
            seccionId: p.seccionId || 999,
            seccionNombre: p.seccionNombre || 'Sin Sección',
            ordenReporte: p.ordenReporte || 999,
            esProduccion: p.idTbsTipoDoc === '101' || p.idTbsTipoDoc?.startsWith('1')
          }));
        this.agruparDatos(); // Re-agrupar cuando lleguen los mapeos
        this.cdr.detectChanges();
      }
    });
  }

  buscarPorFecha(): void {
    if (!this.filtroFechaInicio || !this.filtroFechaFin) return;
    if (this.filtroFechaFin < this.filtroFechaInicio) return;

    this.sub?.unsubscribe();
    this.loadingFiltro = true;
    this.modoFiltro = 'custom';

    this.sub = this.svc.getDocumentosPorFecha(this.filtroFechaInicio, this.filtroFechaFin).subscribe({
      next: data => {
        this.documentos = data;
        this.ultimaActualizacion = new Date();
        this.agruparDatos();
        this.loadingFiltro = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error consultando por fecha:', err);
        this.loadingFiltro = false;
        this.cdr.detectChanges();
      }
    });
  }

  limpiarFiltro(): void {
    const hoy = new Date();
    const hace15 = new Date();
    hace15.setDate(hoy.getDate() - 15);
    this.filtroFechaFin   = hoy.toISOString().split('T')[0];
    this.filtroFechaInicio = hace15.toISOString().split('T')[0];
    this.modoFiltro = 'default';
    this.cargarDatos();
  }




  cargarDatos(): void {
    this.sub?.unsubscribe();
    this.loading = true;
    this.error = false;

    this.sub = this.svc.getDocumentos(150).subscribe({
      next: data => {
        this.documentos = data;
        this.loading = false;
        this.ultimaActualizacion = new Date();
        this.agruparDatos();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando documentos:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  agruparDatos(): void {
    if (this.documentos.length === 0) return;

    const map = new Map<string, OpDocto[]>();
    this.documentos.forEach(d => {
      if (!map.has(d.op)) {
        map.set(d.op, []);
      }
      
      // Update description using mapping
      const dItem = String(d.item).trim();
      const mapeo = this.mapeosERP.find(m => 
        m.siesa && String(m.siesa).trim() === dItem
      );
      if (mapeo) {
        d.descripcion = mapeo.desc;
        (d as any)._seccionId = mapeo.seccionId;
        (d as any)._seccionNombre = mapeo.seccionNombre;
        (d as any)._ordenReporte = mapeo.ordenReporte;
        (d as any)._esProduccion = mapeo.esProduccion;
      } else {
        (d as any)._seccionId = 999;
        (d as any)._seccionNombre = 'Sin Sección';
        (d as any)._ordenReporte = 999;
        (d as any)._esProduccion = false;
      }
      
      map.get(d.op)!.push(d);
    });

    this.opGrupos = Array.from(map.entries()).map(([op, items]) => {
      // Agrupar por sección
      const seccionesMap = new Map<string, SeccionReporte>();
      
      items.forEach(item => {
        const sNombre = (item as any)._seccionNombre;
        if (!sNombre || sNombre === 'Sin Sección') {
          return;
        }
        if (!seccionesMap.has(sNombre)) {
          seccionesMap.set(sNombre, { nombre: sNombre, items: [], productoPrincipal: null });
        }
        
        const sec = seccionesMap.get(sNombre)!;
        
        if ((item as any)._esProduccion) {
          if (sec.productoPrincipal) {
            sec.productoPrincipal.cantidadConsumida += item.cantidadConsumida;
          } else {
            sec.productoPrincipal = { ...item };
          }
        } else {
          const existing = sec.items.find(i => i.descripcion === item.descripcion);
          if (existing) {
            existing.cantidadConsumida += item.cantidadConsumida;
          } else {
            sec.items.push({ ...item });
          }
        }
      });
      
      const secciones: SeccionReporte[] = Array.from(seccionesMap.values()).map(s => {
        // Ordenar items de la sección
        s.items.sort((a, b) => ((a as any)._ordenReporte || 999) - ((b as any)._ordenReporte || 999));
        return s;
      }).sort((a, b) => {
        // Ordenar las secciones (usamos el ID de seccion)
        const sIdA = a.items.length > 0 ? (a.items[0] as any)._seccionId : (a.productoPrincipal as any)?._seccionId || 999;
        const sIdB = b.items.length > 0 ? (b.items[0] as any)._seccionId : (b.productoPrincipal as any)?._seccionId || 999;
        return sIdA - sIdB;
      });

      return {
        op,
        idOrden: items[0]?.idOrden || '',
        fecha: items[0]?.fecha || null,
        status: items[0]?.statusEnvio || 'Pendiente',
        items,
        secciones,
        totalOtrosCostos: items[0]?.totalOtrosCostos || 0,
        totalManoObra: items[0]?.totalManoObra || 0,
        totalPurificacion: items[0]?.totalPurificacionGlicerina || 0
      };
    }).sort((a, b) => b.op.localeCompare(a.op));
  }

  abrirModal(grupo: OpGrupo): void {
    this.grupoSeleccionado = grupo;
    this.showModal = true;
  }

  cerrarModal(): void {
    this.showModal = false;
    this.grupoSeleccionado = null;
  }

  exportarPDF(grupo: OpGrupo) {
    this.grupoPDF = grupo;
    
    // Forzamos detección de cambios para que se renderice el contenedor oculto
    this.cdr.detectChanges();

    setTimeout(() => {
      const data = document.getElementById('pdf-container');
      if (!data) {
        console.error('No se encontró el contenedor de PDF');
        return;
      }

      html2canvas(data, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 800 // Forzamos el ancho para asegurar el layout
      }).then(canvas => {
        if (canvas.width === 0 || canvas.height === 0) {
          console.error('Canvas generado está vacío');
          return;
        }

        const imgWidth = 208;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const contentDataURL = canvas.toDataURL('image/jpeg', 0.95);
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(contentDataURL, 'JPEG', 0, 10, imgWidth, imgHeight);
        pdf.save(`Reporte_Produccion_${grupo.op}.pdf`);
        
        this.grupoPDF = null;
        this.cdr.detectChanges();
      }).catch(err => {
        console.error('Error generando PDF:', err);
        this.grupoPDF = null;
        this.cdr.detectChanges();
      });
    }, 200);
  }

  enviarCorreo(g: OpGrupo) {
    if (this.enviandoId) return;
    if (g.status === 'Enviado') {
      alert('Este reporte ya fue enviado.');
      return;
    }
    
    this.enviandoId = g.op;
    this.svc.enviarReporte(g.fecha || '').subscribe({
      next: (res: string) => {
        alert('✅ Reporte enviado correctamente');
        g.status = 'Enviado';
        this.enviandoId = null;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error enviando correo:', err);
        alert('❌ Error al enviar el reporte: ' + (err.error || 'Servidor no disponible'));
        this.enviandoId = null;
        this.cdr.detectChanges();
      }
    });
  }

  abrirEditReceptores() {
    this.receptoresEdit = this.receptores;
    this.showEditReceptores = true;
  }

  cerrarEditReceptores() {
    this.showEditReceptores = false;
  }

  guardarReceptores() {
    this.svc.updateReceptores(this.receptoresEdit).subscribe({
      next: () => {
        this.receptores = this.receptoresEdit;
        this.cerrarEditReceptores();
        alert('Receptores actualizados correctamente.');
      },
      error: (err) => {
        console.error('Error actualizando receptores:', err);
        alert('No se pudieron actualizar los receptores.');
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}