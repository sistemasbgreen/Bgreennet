import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { homeservices } from '../../../servicios/homeservices';
import { SistemaInformacion } from '../../../models/sistemasinformacion';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import { CrearSistema } from '../../../models/CrearSistema';

@Component({
  selector: 'app-sistemasinformacion',
  imports: [NgForOf, NgIf, FormsModule, ReactiveFormsModule],
  templateUrl: './sistemasinformacion.html',
  styleUrl: './sistemasinformacion.css',
})
export class Sistemasinformacion implements OnInit {
  // Data
  sistemaInformacionData: SistemaInformacion[] = [];
  sistemasFiltrados: SistemaInformacion[] = [];
  
  // Modal state
  mostrarModal = false;
  modoEdicion = false;
  sistemaIdEnEdicion: number | null = null;
  
  // Form
  sistemaForm: CrearSistema = this.getNuevoSistema();
  
  // Search & Filter
  terminoBusqueda = '';
  filtroEstado: 'todos' | 'activo' | 'inactivo' = 'todos';
  
  // Loading state
  cargando = false;
  
  // Sort
  ordenColumna: 'nombre' | 'estado' = 'nombre';
  ordenDireccion: 'asc' | 'desc' = 'asc';

  constructor(
    private router: Router,
    private homeservice: homeservices,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarSistemas();
  }

  /**
   * Carga todos los sistemas de información
   */
  cargarSistemas(): void {
    this.cargando = true;
    this.homeservice.getAll().subscribe({
      next: (data) => {
        this.sistemaInformacionData = data;
        this.aplicarFiltros();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar sistemas de información', err);
        alert('Error al cargar los sistemas. Por favor, intente nuevamente.');
        this.cargando = false;
      }
    });
  }

  /**
   * Aplica filtros de búsqueda y estado
   */
  aplicarFiltros(): void {
    let resultado = [...this.sistemaInformacionData];

    // Filtro por búsqueda
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase().trim();
      resultado = resultado.filter(sistema =>
        sistema.nombre.toLowerCase().includes(termino) ||
        sistema.url.toLowerCase().includes(termino)
      );
    }

    // Filtro por estado
    if (this.filtroEstado !== 'todos') {
      const estadoBooleano = this.filtroEstado === 'activo';
      resultado = resultado.filter(sistema => sistema.estado === estadoBooleano);
    }

    // Ordenar
    resultado.sort((a, b) => {
      let comparacion = 0;
      
      if (this.ordenColumna === 'nombre') {
        comparacion = a.nombre.localeCompare(b.nombre);
      } else if (this.ordenColumna === 'estado') {
        comparacion = (a.estado === b.estado) ? 0 : a.estado ? -1 : 1;
      }

      return this.ordenDireccion === 'asc' ? comparacion : -comparacion;
    });

    this.sistemasFiltrados = resultado;
  }

  /**
   * Maneja cambios en el campo de búsqueda
   */
  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  /**
   * Maneja cambios en el filtro de estado
   */
  onFiltroEstadoChange(): void {
    this.aplicarFiltros();
  }

  /**
   * Cambia el orden de la tabla
   */
  cambiarOrden(columna: 'nombre' | 'estado'): void {
    if (this.ordenColumna === columna) {
      this.ordenDireccion = this.ordenDireccion === 'asc' ? 'desc' : 'asc';
    } else {
      this.ordenColumna = columna;
      this.ordenDireccion = 'asc';
    }
    this.aplicarFiltros();
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroEstado = 'todos';
    this.aplicarFiltros();
  }

  /**
   * Abre el modal para crear o editar
   */
  abrirModal(sistema?: SistemaInformacion): void {
    this.mostrarModal = true;

    if (sistema) {
      this.modoEdicion = true;
      this.sistemaIdEnEdicion = sistema.id;
      this.sistemaForm = {
        nombre: sistema.nombre,
        url: sistema.url,
        imagenUrl: sistema.imagenUrl,
        estado: sistema.estado
      };
    } else {
      this.modoEdicion = false;
      this.sistemaIdEnEdicion = null;
      this.sistemaForm = this.getNuevoSistema();
    }
  }

  /**
   * Cierra el modal y resetea el formulario
   */
  cerrarModal(): void {
    this.mostrarModal = false;
    this.sistemaForm = this.getNuevoSistema();
    this.modoEdicion = false;
    this.sistemaIdEnEdicion = null;
  }

  /**
   * Valida el formulario
   */
  private validarFormulario(): boolean {
    if (!this.sistemaForm.nombre?.trim()) {
      alert('El nombre es obligatorio');
      return false;
    }

    if (!this.sistemaForm.url?.trim()) {
      alert('La URL es obligatoria');
      return false;
    }

    // Validación básica de URL
    try {
      new URL(this.sistemaForm.url);
    } catch {
      alert('La URL no es válida');
      return false;
    }

    if (!this.sistemaForm.imagenUrl?.trim()) {
      alert('La URL de la imagen es obligatoria');
      return false;
    }

    // Validación básica de URL de imagen
    try {
      new URL(this.sistemaForm.imagenUrl);
    } catch {
      alert('La URL de la imagen no es válida');
      return false;
    }

    return true;
  }

  /**
   * Guarda o actualiza un sistema
   */
  guardarSistema(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.cargando = true;

    if (this.modoEdicion) {
      this.actualizarSistema();
    } else {
      this.crearSistema();
    }
  }

  /**
   * Crea un nuevo sistema
   */
  private crearSistema(): void {
    this.homeservice.Crearsistemainformacion(this.sistemaForm).subscribe({
      next: (resp) => {
        alert('Sistema creado correctamente');
        this.cargarSistemas();
        this.cerrarModal();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al crear sistema:', err);
        alert('Error al crear el sistema. Por favor, intente nuevamente.');
        this.cargando = false;
      }
    });
  }

  /**
   * Actualiza un sistema existente
   */
  private actualizarSistema(): void {
    if (this.sistemaIdEnEdicion === null) {
      alert('Error: ID no disponible para actualización');
      this.cargando = false;
      return;
    }

    this.homeservice.update(this.sistemaIdEnEdicion, this.sistemaForm).subscribe({
      next: (resp) => {
        alert('Sistema actualizado correctamente');
        this.cargarSistemas();
        this.cerrarModal();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al actualizar sistema:', err);
        alert('Error al actualizar el sistema. Por favor, intente nuevamente.');
        this.cargando = false;
      }
    });
  }

  /**
   * Elimina un sistema
   */
  eliminarSistema(sistema: SistemaInformacion): void {
    const confirmacion = confirm(
      `¿Está seguro de eliminar el sistema "${sistema.nombre}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmacion) {
      return;
    }

    this.cargando = true;

    // Descomenta cuando tengas el método delete en tu servicio
    /*
    this.homeservice.delete(sistema.id).subscribe({
      next: () => {
        alert('Sistema eliminado correctamente');
        this.cargarSistemas();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al eliminar sistema:', err);
        alert('Error al eliminar el sistema. Por favor, intente nuevamente.');
        this.cargando = false;
      }
    });
    */

    // Temporal hasta que implementes el método delete
    console.log('Eliminar sistema con id:', sistema.id);
    alert('Funcionalidad de eliminación pendiente de implementación en el servicio');
    this.cargando = false;
  }

  /**
   * Cambia el estado de un sistema (activo/inactivo)
   */
  toggleEstado(sistema: SistemaInformacion): void {
    const nuevoEstado = !sistema.estado;
    const mensajeEstado = nuevoEstado ? 'activar' : 'desactivar';

    const confirmacion = confirm(
      `¿Desea ${mensajeEstado} el sistema "${sistema.nombre}"?`
    );

    if (!confirmacion) {
      return;
    }

    const sistemaActualizado: CrearSistema = {
      nombre: sistema.nombre,
      url: sistema.url,
      imagenUrl: sistema.imagenUrl,
      estado: nuevoEstado
    };

    this.homeservice.update(sistema.id, sistemaActualizado).subscribe({
      next: () => {
        alert(`Sistema ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
        this.cargarSistemas();
      },
      error: (err) => {
        console.error('Error al cambiar estado:', err);
        alert('Error al cambiar el estado del sistema');
      }
    });
  }

  /**
   * Retorna un objeto de sistema vacío
   */
  private getNuevoSistema(): CrearSistema {
    return {
      nombre: '',
      url: '',
      imagenUrl: '',
      estado: true
    };
  }

  /**
   * Obtiene el contador de sistemas por estado
   */
  get contadorEstados() {
    return {
      total: this.sistemaInformacionData.length,
      activos: this.sistemaInformacionData.filter(s => s.estado).length,
      inactivos: this.sistemaInformacionData.filter(s => !s.estado).length
    };
  }
}