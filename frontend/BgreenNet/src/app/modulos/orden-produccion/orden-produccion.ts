import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { OpDocto } from '../../models/OordenesProduccion/OpDocto';
import { OpDoctoService } from '../../servicios/OpDoctoService';
import { CommonModule } from '@angular/common';

interface OpGrupo {
  op: string;
  fecha: string | null;
  items: OpDocto[];
  itemsBiodiesel: OpDocto[];
  itemsGlicerina: OpDocto[];
}

@Component({
  selector: 'app-orden-produccion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orden-produccion.html',
  styleUrl: './orden-produccion.css',
})
export class OrdenProduccion implements OnInit, OnDestroy {

  documentos: OpDocto[] = [];
  opGrupos: OpGrupo[] = [];
  
  loading = true;
  error = false;
  ultimaActualizacion: Date | null = null;

  // Modal state
  showModal = false;
  grupoSeleccionado: OpGrupo | null = null;

  // ID Sets from EmailReporteService
  private readonly IDS_BIODIESEL = new Set(['8', '7309', '10', '13', '12', '26']);
  private readonly IDS_GLICERINA = new Set(['34', '15', '2549', '32']);

  private sub!: Subscription;

  constructor(private svc: OpDoctoService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
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
    const map = new Map<string, OpDocto[]>();
    this.documentos.forEach(d => {
      if (!map.has(d.op)) {
        map.set(d.op, []);
      }
      map.get(d.op)!.push(d);
    });

    this.opGrupos = Array.from(map.entries()).map(([op, items]) => {
      const itemsBiodiesel = items.filter(i => this.IDS_BIODIESEL.has(i.item.trim()));
      const itemsGlicerina = items.filter(i => this.IDS_GLICERINA.has(i.item.trim()));
      
      return {
        op,
        fecha: items[0]?.fecha || null,
        items,
        itemsBiodiesel,
        itemsGlicerina
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

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}