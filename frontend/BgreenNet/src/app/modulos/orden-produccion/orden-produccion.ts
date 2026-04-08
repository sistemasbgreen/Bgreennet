import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { OpDocto } from '../../models/OordenesProduccion/OpDocto';
import { CommonModule } from '@angular/common';
import { OpDoctoService } from '../../servicios/OpDoctoService ';


@Component({
  selector: 'app-orden-produccion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orden-produccion.html',
  styleUrl: './orden-produccion.css',
})
export class OrdenProduccion implements OnInit, OnDestroy {

  documentos: OpDocto[] = [];
  filtrados:  OpDocto[] = [];
  loading  = true;
  error    = false;
  ultimaActualizacion: Date | null = null;

  filtroEstado = 'TODOS';
  estados      = ['TODOS', 'ACTIVO', 'APROBADO', 'CUMPLIDO', 'ANULADO'];

  private sub!: Subscription;

  constructor(private svc: OpDoctoService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error   = false;

    this.sub = this.svc.getDocumentos(30).subscribe({
      next: data => {
        this.documentos          = data;       
        this.loading             = false;
        this.ultimaActualizacion = new Date();
        this.aplicarFiltro();
        console.log('✅ Documentos cargados:', data);
      },
      error: (err) => {
        console.error('Error cargando documentos:', err);
        this.error   = true;
        this.loading = false;
      }
      
    });
  }

  aplicarFiltro(): void {
    this.filtrados = this.filtroEstado === 'TODOS'
      ? [...this.documentos]
      : this.documentos.filter(d => d.indEstado === this.filtroEstado);
  }

  cambiarFiltro(estado: string): void {
    this.filtroEstado = estado;
    this.aplicarFiltro();
  }

  badgeClass(estado: string): string {
    const map: Record<string, string> = {
      'ACTIVO'  : 'badge--activo',
      'APROBADO': 'badge--aprobado',
      'CUMPLIDO': 'badge--cumplido',
      'ANULADO' : 'badge--anulado',
    };
    return map[estado] ?? 'badge--default';
  }

  get conteo(): Record<string, number> {
    return this.estados.reduce((acc, e) => {
      acc[e] = e === 'TODOS'
        ? this.documentos.length
        : this.documentos.filter(d => d.indEstado === e).length;
      return acc;
    }, {} as Record<string, number>);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}